/* eslint-disable consistent-return, no-await-in-loop */

import EventEmitter from 'events';

import Promise from 'bluebird';

import { hex, hexoffset } from '../utils';

import {
  ADDRESS_SIZE,
  LITERAL_MAX,
  LITERAL_MODULO,
  REGISTER,
  REGISTER_MAX,
} from '../constants';

import operations from './operations/lookup';

Promise.config({ cancellation: true });

class VM extends EventEmitter {
  constructor() {
    super();

    this.initialize();

    // Standard in/out/err hooks (may be overwritten)
    this.stdin = () => {
      this.stdin.promise = new Promise((resolve, reject, onCancel) => {
        const onData = (charCodes) => {
          process.stdin.removeListener('data', onData);
          resolve(charCodes);
        };
        onCancel(() => {
          process.stdin.removeListener('data', onData);
        });
        process.stdin.on('data', onData);
      });
      return this.stdin.promise;
    };
    this.stdin.cancel = () => {
      if (this.stdin.promise && !this.stdin.promise.isCancelled()) {
        this.stdin.promise.cancel();
      }
    };
    this.stdout = (str) => process.stdout.write(str);
    this.stderr = (str) => process.stderr.write(str);

    // Handle initial piped input (if any)
    if (!process.stdin.isTTY) {
      this.stdin().then((charCodes) => {
        this.input.push(...charCodes);
      });
    }

    this.resolve = this.resolve.bind(this);
    this.step = this.step.bind(this);
  }

  initialize() {
    this.program = null;
    this.running = false;
    this.halted = false;

    this.address = 0;
    this.memory = [];
    this.rawMemory = [];
    this.registers = new Array(8).fill(0);
    this.stack = [];
    this.input = [];
  }

  eval(cmd) {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('vm', 'hex', 'hexoffset', `with (vm) {
        return (${cmd})
      }`);
      const result = fn(this, hex, hexoffset);
      if (result !== undefined) {
        console.log(result);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Processes all pending debug commands (starting with '$') from given queue
  evalPending(queue = this.input) {
    while (queue[0] === 0x24) {
      queue.shift();
      const nl = queue.findIndex((c) => c === 0x0A);
      const end = Math.min(nl, queue.length - 1);
      const chars = queue.splice(0, end + 1);
      const cmd = Buffer.from(chars).toString();
      this.eval(cmd);
    }
  }

  halt() {
    this.running = false;
    this.halted = true;
    this.emit('halt');
  }

  load(program) {
    this.initialize();

    const { data } = program;
    const size = data.length / ADDRESS_SIZE;
    this.memory = new Uint16Array(size);
    for (let i = 0; i < size; ++i) {
      this.memory[i] = data.readUInt16LE(i * ADDRESS_SIZE);
    }
    this.rawMemory = Buffer.from(this.memory.buffer);

    this.program = program;
    this.emit('load', program);
  }

  async prompt() {
    this.evalPending();
    while (!this.input.length) {
      const charCodes = await this.stdin();
      this.input.push(...charCodes);
      this.evalPending();
    }
    return this.input.shift();
  }

  read() {
    const value = this.memory[this.address];
    this.address += 1;
    return value;
  }

  resolve(operand) {
    const value = this.read();
    if (operand === REGISTER) {
      return value % LITERAL_MODULO;
    }
    if (value <= LITERAL_MAX) {
      return value;
    }
    if (value <= REGISTER_MAX) {
      return this.registers[value % LITERAL_MODULO];
    }
    return NaN;
  }

  async step() {
    this.stdin.cancel();
    if (this.halted) {
      this.halt();
      return;
    }

    const { address } = this;
    const opcode = this.read();

    const operation = operations.get(opcode);
    if (!operation) {
      this.stderr(`Unknown opcode ${opcode} at ${hexoffset(address)}\n`);
      this.halt();
      return;
    }

    const values = operation.operands.map(this.resolve);
    await operation.exec(this, ...values);

    if (!this.halted) {
      this.emit('pre-step');
    }

    if (this.running) {
      return this.next();
    }
  }

  next() {
    return this.step();
  }

  async run() {
    if (!this.program || this.running) {
      return;
    }

    this.running = true;
    this.emit('run');

    return this.step();
  }

  write(charCode) {
    this.stdout(String.fromCharCode(charCode));
  }
}

export default VM;
