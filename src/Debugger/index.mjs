import fs from 'fs';
import os from 'os';
import path from 'path';

import VM from '../VM';
import { ADDRESS_SIZE } from '../constants';
import { hex } from '../utils';

import { GDBServer } from './gdb';

class Debugger extends VM {
  constructor() {
    super();

    // Remote protocol server for GDB clients to connect to
    this.gdb = new GDBServer(this);

    // Path to process map (see below)
    this.procmapPath = null;

    // Facilitate for cancelling stdin promise when debugger interrupts
    this.stdinPromise = null;
    const { stdin } = this;
    this.stdin = () => {
      this.stdinPromise = stdin();
      return this.stdinPromise;
    };

    // Stores and handles breakpoints
    this.breakpoints = new Set();
    this.on('pre-step', () => {
      if (this.break) {
        this.running = false;
        this.emit('break');
      }
    });

    // To allow interrupts to fire when the VM is busy (infinite loops or simply
    // intensive computations), the debugger occasionally has to process incoming
    // signals (such as SIGINT). These specify the window and the last occurence.
    this.signalWindow = 1000;
    this.lastSignalWindow = new Date();
  }

  // Whether currently on a breakpoint
  get break() {
    const offset = this.address * ADDRESS_SIZE;
    return this.breakpoints.has(offset);
  }

  interrupt() {
    this.running = false;
    if (this.stdinPromise && !this.stdinPromise.isCancelled()) {
      this.stdinPromise.cancel();
    }
  }

  load(program) {
    super.load(program);

    console.log('loaded program', program.path);

    // Write process map (queried by GDB / Binary Ninja)
    const end = hex(program.data.length, { bitSize: 32 });
    const procmap = `00000000-${end} rwxp 00000000 00:00 0 ${program.fqpath}`;
    this.procmapPath = path.join(os.tmpdir(), 'synacor-dbg-procmap.txt');
    fs.writeFileSync(this.procmapPath, procmap);
    console.log('wrote procmap file', this.procmapPath);
  }

  next() {
    const now = new Date();

    // When past the signal window, process incoming signals (such as SIGINT) to
    // allow the VM to be interrupted when it is busy (infinite loops or simply
    // intensive computations)
    if (now - this.lastSignalWindow > this.signalWindow) {
      this.lastSignalWindow = now;
      return setImmediate(this.step);
    }
    return this.step();
  }
}

export default Debugger;
