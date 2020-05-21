import Disassembler from './src/Disassembler';
import Program from './src/Program';

const path = process.argv[2];
if (!path) {
  console.error('No program specified');
  process.exit(1);
}

const disassembler = new Disassembler();
const program = Program.for(path);
disassembler.dump(program);
