import fs from 'fs';

class Program {
  constructor(path) {
    this.path = path;
  }

  get data() {
    return fs.readFileSync(this.path);
  }

  static for(path) {
    return new Program(path);
  }
}

export default Program;
