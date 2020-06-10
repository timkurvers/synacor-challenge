import Debugger from './src/Debugger';
import Program from './src/Program';

const path = process.argv[2];
if (!path) {
  console.error('No program specified');
  process.exit(1);
}

const port = process.env.GDB_PORT || 31337;

const dbg = new Debugger();
const program = new Program(path);
dbg.load(program);
dbg.gdb.listen(port);
