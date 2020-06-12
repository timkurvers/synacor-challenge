/* eslint-disable no-control-regex, no-param-reassign */

import fs from 'fs';
import path from 'path';

import { ADDRESS_SIZE } from '../../constants';
import { hex8, hex16 } from '../../utils';

import {
  errno, register, signal, threadId,
} from './constants';
import { dirname, encode } from './utils';

const __dirname = dirname(import.meta.url);

// Interrupt
export const interrupt = {
  match: /^\x03/,
  process: (client, { dbg }) => {
    dbg.interrupt();
    client.reply(`T${hex8(signal.TRAP)}`);
  },
};

// Process status
export const status = {
  match: /^\?/,
  process: (client, { dbg }) => {
    if (dbg.halted) {
      client.reply(`W${hex8(signal.TERM)}`);
    } else {
      const swbreak = dbg.break ? 'swbreak:;' : '';
      client.reply(`T${hex8(signal.TRAP)};thread:${hex8(threadId)};${swbreak}`);
    }
  },
};

// Detach
export const D = {
  match: /^D/,
  process: (client) => {
    client.ok();
  },
};

// Registers (R0-R7, as well as instruction and stack pointers)
export const g = {
  match: /^g/,
  process: (client, { dbg }) => {
    const values = [...dbg.registers];
    values[register.IP] = dbg.address * ADDRESS_SIZE;
    // TODO: Properly communicate stack values with GDB / Binary Ninja
    values[register.SP] = dbg.memory.length * ADDRESS_SIZE * 2;
    let result = '';
    for (const value of values) {
      const hex = hex16(value);
      result += hex.slice(2, 4);
      result += hex.slice(0, 2);
    }
    client.reply(result);
  },
};

// H: Thread for future operations
export const H = {
  match: /^H/,
  process: (client) => {
    // No need to actually do anything here as Synacor only supports one
    client.ok();
  },
};

// Kill process (for debugging purposes, this reloads the program)
export const k = {
  match: /^k/,
  process: (client, { dbg }) => {
    dbg.load(dbg.program);
  },
};

// Memory access
export const m = {
  match: /^m([a-f\d]+),([a-f\d]+)/i,
  process: (client, { dbg, match }) => {
    const offset = parseInt(match[1], 16);
    const length = parseInt(match[2], 16);

    const { memory } = dbg;
    const end = Math.min(offset + length, memory.length * ADDRESS_SIZE);

    let result = '';
    for (let i = offset; i < end; i += ADDRESS_SIZE) {
      const value = memory[i / ADDRESS_SIZE];
      const hex = hex16(value);
      result += hex.slice(2, 4);
      result += hex.slice(0, 2);
    }
    client.reply(result);
  },
};

// Read register
export const p = {
  match: /^p([a-f\d]+)/i,
  process: (client, { dbg, match }) => {
    const regnum = parseInt(match[1], 16);

    let value = null;
    if (regnum in dbg.registers) {
      value = dbg.registers[regnum];
    } else if (regnum === register.IP) {
      value = dbg.address * ADDRESS_SIZE;
    } else if (regnum === register.SP) {
      // TODO: Properly communicate stack values with GDB / Binary Ninja
      value = dbg.memory.length * ADDRESS_SIZE * 2;
    } else {
      client.reply(`E${errno.ENOENT}`);
      return;
    }

    const hex = hex16(value);
    let result = hex.slice(2, 4);
    result += hex.slice(0, 2);
    client.reply(result);
  },
};

// Query: Turn off acks
export const QStartNoAckMode = {
  match: /^QStartNoAckMode/,
  process: (client) => {
    client.useAcks = false;
    client.ok();
  },
};

// Query: Attachment strategy
export const qAttached = {
  match: /^qAttached/,
  process: (client) => {
    // Pretend we 'attached' to a process (even though VM runs inside this one)
    client.reply('1');
  },
};

// Query: Current thread
export const qC = {
  match: /^qC/,
  process: (client) => {
    client.reply(`QC${hex8(threadId)}`);
  },
};

// Query: Features supported
export const qSupported = {
  match: /^qSupported/,
  process: (client) => {
    client.reply('qXfer:features:read+;qXfer:exec-file:read+;vCont+;swbreak+');
  },
};

// Query: Thread info
export const qfThreadInfo = {
  match: /^qfThreadInfo/,
  process: (client) => {
    client.reply(`m${hex8(threadId)}`);
  },
};

// Query: Thread info (continued)
export const qsThreadInfo = {
  match: /^qsThreadInfo/,
  process: (client) => {
    client.reply('l');
  },
};


// Query: Tracepoints
export const qT = {
  match: /^qT/,
  process: (client) => {
    client.reply();
  },
};

// Query: Read executable file
export const qXferExecFileRead = {
  match: /^qXfer:exec-file:read:(.*?):([a-f\d]+),([a-f\d]+)/i,
  process: (client, { dbg, match }) => {
    const [_, annex, hoffset, hlength] = match;
    const offset = parseInt(hoffset, 16);
    const length = parseInt(hlength, 16);

    if (!annex || parseInt(annex, 10) === threadId) {
      const slice = dbg.program.fqpath.slice(offset, length);
      if (slice.length) {
        client.reply(`l${encode(slice)}`);
      } else {
        client.reply('l');
      }
    } else {
      client.reply('E00');
    }
  },
};

// Query: Read feature definition
export const qXferFeaturesRead = {
  match: /^qXfer:features:read:(.+?):([a-f\d]+),([a-f\d]+)/i,
  process: (client, { match }) => {
    const [_, annex, hoffset, hlength] = match;
    const offset = parseInt(hoffset, 16);
    const length = parseInt(hlength, 16);

    if (annex === 'target.xml') {
      const xml = fs.readFileSync(path.join(__dirname, annex), 'utf8');
      const stripped = xml.replace(/\n| {2}/g, '');
      const slice = stripped.slice(offset, length);
      if (slice.length) {
        client.reply(`m${encode(slice)}`);
      } else {
        client.reply('l');
      }
    } else {
      client.reply('E00');
    }
  },
};

// Thread status
export const T = {
  match: /^T/,
  process: (client) => {
    client.ok();
  },
};


// Thread control: continue
export const c = {
  match: /^c$/,
  process: (client, { dbg }) => {
    dbg.run();
  },
};

// Thread control: instruction step
export const s = {
  match: /^s$/,
  process: async (client, { dbg }) => {
    await dbg.step();
    if (!dbg.break) {
      client.reply(`T${hex8(signal.TRAP)}`);
    }
  },
};

// Thread control: continue + instruction step
export const vCont = {
  match: /^vCont;(.)/,
  process: async (client, { dbg, match }) => {
    const action = match[1];
    if (action === 'c' && !dbg.running) {
      dbg.run();
    } else if (action === 's' && !dbg.running) {
      await dbg.step();
      if (!dbg.break) {
        client.reply(`T${hex8(signal.TRAP)}`);
      }
    } else {
      client.reply();
    }
  },
};

// File: Set file system
export const vFileSetfs = {
  match: /^vFile:setfs:(\d+)/,
  process: (client, { match }) => {
    const pid = parseInt(match[1], 10);
    if (pid === 0) {
      client.reply('F0');
    } else {
      client.reply();
    }
  },
};

// File: Open
export const vFileOpen = {
  match: /^vFile:open:([a-f\d]+),([a-f\d]+),([a-f\d]+)/i,
  process: (client, { dbg, match }) => {
    const filename = Buffer.from(match[1], 'hex').toString();

    let fd = -1;

    // Only allow opening the program currently loaded
    // TODO: Disallow for now as GDB complains (why?)
    if (false && filename === dbg.program.fqpath) {
      fd = fs.openSync(filename);

    // Or a process map
    } else if (filename === `/proc/${threadId}/maps`) {
      fd = fs.openSync(dbg.procmapPath);
    }

    if (fd !== -1) {
      client.fd = fd;
    }

    client.reply(`F${hex8(fd)}`);
  },
};

// File: Read
export const vFileRead = {
  match: /^vFile:pread:([a-f\d]+),([a-f\d]+),([a-f\d]+)/i,
  process: (client, { match }) => {
    const fd = parseInt(match[1], 16);
    const length = parseInt(match[2], 16);
    const offset = parseInt(match[3], 16);

    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, offset);
    const data = encode(buffer.slice(0, bytesRead));
    client.reply(`F${hex8(bytesRead)};${data}`);
  },
};

// File: Close
export const vFileClose = {
  match: /^vFile:close:([a-f\d]+)/i,
  process: (client, { match }) => {
    let fd = parseInt(match[1], 16);
    try {
      fs.closeSync(fd);
    } catch (e) {
      // TODO: Why is Binary Ninja sending this in non-hex?
      fd = parseInt(match[1], 10);
      fs.closeSync(fd);
    }
    client.reply('F0');
  },
};

// v: All others
export const vZZZ = {
  match: /^v/,
  process: (client) => {
    client.reply();
  },
};

// Z/z: Set/remove breakpoint
export const Z = {
  match: /^(Z)(\d),([a-f\d]+),([a-f\d]+)/i,
  process: (client, { dbg, match }) => {
    const addr = parseInt(match[3], 16);

    if (match[1] === 'Z') {
      dbg.breakpoints.add(addr);
    } else {
      dbg.breakpoints.delete(addr);
    }
    client.ok();
  },
};
