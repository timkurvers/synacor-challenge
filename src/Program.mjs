import fs from 'fs';
import path from 'path';

class Program {
  constructor(givenPath) {
    this.path = givenPath;
  }

  get fqpath() {
    return path.resolve(this.path);
  }

  get data() {
    return fs.readFileSync(this.fqpath);
  }
}

export default Program;
