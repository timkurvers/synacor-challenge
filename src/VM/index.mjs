/* eslint-disable consistent-return, no-await-in-loop */

import EventEmitter from 'events';
import Promise from 'bluebird';

import { hexoffset } from '../utils';

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
    this.stdin = () => new Promise((resolve, reject, onCancel) => {
      const onData = (charCodes) => {
        process.stdin.removeListener('data', onData);
        resolve(charCodes);
      };
      onCancel(() => {
        process.stdin.removeListener('data', onData);
      });
      process.stdin.on('data', onData);
    });
    this.stdout = (str) => process.stdout.write(str);
    this.stderr = (str) => process.stderr.write(str);

    this.resolve = this.resolve.bind(this);
  }

  initialize() {
    this.program = null;
    this.running = false;
    this.halted = false;

    this.address = 0;
    this.memory = [];
    this.registers = new Array(8).fill(0);
    this.stack = [];
    this.input = [];
  }

  eval() {
    // Detect debug commands starting with '$'
    if (this.input[0] === 0x24) {
      // And ending with '\n'
      const end = this.input.findIndex((c) => c === 0x0A);
      if (end !== -1) {
        this.input.shift();
        const chars = this.input.splice(0, end);
        const cmd = Buffer.from(chars).toString();
        try {
          const result = eval(cmd); // eslint-disable-line no-eval
          if (result !== undefined) {
            console.log(result);
          }
        } catch (e) {
          console.error(e);
        }
      }
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

    this.program = program;
    this.emit('load', program);
  }

  async prompt() {
    this.eval();
    if (this.input.length) {
      return this.input.shift();
    }
    while (!this.input.length) {
      const charCodes = await this.stdin();
      this.input.push(...charCodes);
      this.eval();
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
      return this.step();
    }
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
