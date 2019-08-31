/* eslint-disable class-methods-use-this, no-await-in-loop */

import colors from 'colors/safe';

import { hexoffset } from '../utils';

import {
  ADDRESS_SIZE,
  LITERAL_MAX,
  LITERAL_MODULO,
  REGISTER_MAX,
} from '../constants';

import Operand from './operations/Operand';
import operations from './operations/lookup';

class VM {
  constructor() {
    this.program = null;
    this.memory = null;
    this.address = 0;
    this.registers = new Array(8).fill(0);
    this.stack = [];
    this.input = [];

    this.resolve = this.resolve.bind(this);
  }

  get eof() {
    return this.address >= this.memory.length;
  }

  end() {
    this.address = this.memory.length;
  }

  load(program) {
    const { data } = program;
    const size = data.length / ADDRESS_SIZE;
    this.memory = new Uint16Array(size);
    for (let i = 0; i < size; ++i) {
      this.memory[i] = data.readUInt16LE(i * ADDRESS_SIZE);
    }
  }

  prompt() {
    if (this.input.length) {
      return this.input.shift();
    }
    return new Promise((resolve) => {
      const onData = (charCodes) => {
        process.stdin.removeListener('data', onData);
        this.input.push(...charCodes);
        resolve(this.input.shift());
      };
      process.stdin.on('data', onData);
    });
  }

  read() {
    const value = this.memory[this.address];
    this.address += 1;
    return value;
  }

  resolve(operand) {
    const value = this.read();
    if (operand & Operand.REGISTER) {
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

  async run(program) {
    this.load(program);

    while (!this.eof) {
      const { address } = this;
      const opcode = this.read();
      const operation = operations.get(opcode);
      if (!operation) {
        console.log(colors.cyan(hexoffset(address)), colors.red(opcode));
        break;
      }

      const values = operation.operands.map(this.resolve);
      await operation.exec(this, ...values);
    }
  }

  write(charCode) {
    process.stdout.write(String.fromCharCode(charCode));
  }
}

export default VM;
