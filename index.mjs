#!/usr/bin/env node --experimental-modules --experimental-specifier-resolution=node

import Program from './src/Program';
import VM from './src/VM';

const name = process.argv[2];
if (!name) {
  console.error('No program name specified');
  process.exit(1);
}

const vm = new VM();
const program = Program.for(name);
vm.run(program);
