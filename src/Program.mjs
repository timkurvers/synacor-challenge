import fs from 'fs';

class Program {
  constructor(name) {
    this.name = name;
  }

  get data() {
    return fs.readFileSync(this.path);
  }

  get path() {
    return `./programs/${this.name}.bin`;
  }

  static for(name) {
    return new Program(name);
  }
}

export default Program;
