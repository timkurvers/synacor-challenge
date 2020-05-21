import Program from './src/Program';
import VM from './src/VM';

const path = process.argv[2];
if (!path) {
  console.error('No program specified');
  process.exit(1);
}

const vm = new VM();
const program = Program.for(path);
vm.run(program);
