import Disassembler from './src/Disassembler';
import Program from './src/Program';

const name = process.argv[2];
if (!name) {
  console.error('No program name specified');
  process.exit(1);
}

const disassembler = new Disassembler();
const program = Program.for(name);
disassembler.dump(program);
