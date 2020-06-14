/* eslint-disable no-param-reassign */

import {
  ADDRESS, CHAR, REGISTER, VALUE,
  LITERAL_MODULO,
} from '../../constants';

import Operation from './Operation';

// halt: 0
//   stop execution and terminate the program
export const halt = new Operation({
  opcode: 0,
  name: 'halt',
  exec: (vm) => {
    vm.halt();
  },
});

// set: 1 a b
//   set register <a> to the value of <b>
export const set = new Operation({
  opcode: 1,
  name: 'set',
  operands: [REGISTER, VALUE],
  exec: (vm, a, b) => {
    vm.registers[a] = b;
  },
});

// push: 2 a
//   push <a> onto the stack
export const push = new Operation({
  opcode: 2,
  name: 'push',
  operands: [VALUE],
  exec: (vm, a) => {
    vm.stack.push(a);
  },
});

// pop: 3 a
//   remove the top element from the stack and write it into <a>; empty stack = error
export const pop = new Operation({
  opcode: 3,
  name: 'pop',
  operands: [REGISTER],
  exec: (vm, a) => {
    if (!vm.stack.length) {
      throw new Error('empty stack');
    }
    vm.registers[a] = vm.stack.pop();
  },
});

// eq: 4 a b c
//   set <a> to 1 if <b> is equal to <c>; set it to 0 otherwise
export const eq = new Operation({
  opcode: 4,
  name: 'eq',
  operands: [REGISTER, VALUE, VALUE],
  exec: (vm, a, b, c) => {
    vm.registers[a] = b === c ? 1 : 0;
  },
});

// gt: 5 a b c
//   set <a> to 1 if <b> is greater than <c>; set it to 0 otherwise
export const gt = new Operation({
  opcode: 5,
  name: 'gt',
  operands: [REGISTER, VALUE, VALUE],
  exec: (vm, a, b, c) => {
    vm.registers[a] = b > c ? 1 : 0;
  },
});

// jmp: 6 a
//   jump to <a>
export const jmp = new Operation({
  opcode: 6,
  name: 'jmp',
  operands: [ADDRESS],
  exec: (vm, a) => {
    vm.address = a;
  },
});

// jt: 7 a b
//   if <a> is nonzero, jump to <b>
export const jt = new Operation({
  opcode: 7,
  name: 'jt',
  operands: [VALUE, ADDRESS],
  exec: (vm, a, b) => {
    if (a !== 0) {
      vm.address = b;
    }
  },
});

// jf: 8 a b
//   if <a> is zero, jump to <b>
export const jf = new Operation({
  opcode: 8,
  name: 'jf',
  operands: [VALUE, ADDRESS],
  exec: (vm, a, b) => {
    if (a === 0) {
      vm.address = b;
    }
  },
});

// add: 9 a b c
//   assign into <a> the sum of <b> and <c> (modulo 32768)
export const add = new Operation({
  opcode: 9,
  name: 'add',
  operands: [REGISTER, VALUE, VALUE],
  exec: (vm, a, b, c) => {
    vm.registers[a] = (b + c) % LITERAL_MODULO;
  },
});

// mult: 10 a b c
//   store into <a> the product of <b> and <c> (modulo 32768)
export const mult = new Operation({
  opcode: 10,
  name: 'mult',
  operands: [REGISTER, VALUE, VALUE],
  exec: (vm, a, b, c) => {
    vm.registers[a] = (b * c) % LITERAL_MODULO;
  },
});

// mod: 11 a b c
//   store into <a> the remainder of <b> divided by <c>
export const mod = new Operation({
  opcode: 11,
  name: 'mod',
  operands: [REGISTER, VALUE, VALUE],
  exec: (vm, a, b, c) => {
    vm.registers[a] = b % c;
  },
});

// and: 12 a b c
//   stores into <a> the bitwise and of <b> and <c>
export const and = new Operation({
  opcode: 12,
  name: 'and',
  operands: [REGISTER, VALUE, VALUE],
  exec: (vm, a, b, c) => {
    vm.registers[a] = b & c;
  },
});

// or: 13 a b c
//   stores into <a> the bitwise or of <b> and <c>
export const or = new Operation({
  opcode: 13,
  name: 'or',
  operands: [REGISTER, VALUE, VALUE],
  exec: (vm, a, b, c) => {
    vm.registers[a] = b | c;
  },
});

// not: 14 a b
//   stores 15-bit bitwise inverse of <b> in <a>
export const not = new Operation({
  opcode: 14,
  name: 'not',
  operands: [REGISTER, VALUE],
  exec: (vm, a, b) => {
    vm.registers[a] = ~b & 0x7FFF;
  },
});

// rmem: 15 a b
//   read memory at address <b> and write it to <a>
export const rmem = new Operation({
  opcode: 15,
  name: 'rmem',
  operands: [REGISTER, ADDRESS],
  exec: (vm, a, b) => {
    vm.registers[a] = vm.memory[b];
  },
});

// wmem: 16 a b
//   write the value from <b> into memory at address <a>
export const wmem = new Operation({
  opcode: 16,
  name: 'wmem',
  operands: [ADDRESS, VALUE],
  exec: (vm, a, b) => {
    vm.memory[a] = b;
  },
});

// call: 17 a
//   write the address of the next instruction to the stack and jump to <a>
export const call = new Operation({
  opcode: 17,
  name: 'call',
  operands: [ADDRESS],
  exec: (vm, a) => {
    vm.stack.push(vm.address + 2);
    vm.address = a;
  },
});

// ret: 18
//   remove the top element from the stack and jump to it; empty stack = halt
export const ret = new Operation({
  opcode: 18,
  name: 'ret',
  exec: (vm) => {
    if (!vm.stack.length) {
      vm.halt();
      return;
    }
    vm.address = vm.stack.pop();
  },
});

// out: 19 a
//   write the character represented by ascii code <a> to the terminal
export const print = new Operation({
  opcode: 19,
  name: 'out',
  operands: [CHAR],
  exec: (vm, a) => {
    vm.write(a);
  },
});

// in: 20 a
//   read a character from the terminal and write its ascii code to <a>; it can be assumed that once
//   input starts, it will continue until a newline is encountered; this means that you can safely
//   read whole lines from the keyboard and trust that they will be fully read
export const prompt = new Operation({
  opcode: 20,
  name: 'in',
  operands: [REGISTER],
  exec: async (vm, a) => {
    vm.registers[a] = await vm.prompt();
  },
});

// noop: 21
//   no operation
export const noop = new Operation({
  opcode: 21,
  name: 'noop',
});
