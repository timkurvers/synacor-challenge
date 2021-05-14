class Reader {
  constructor(buffer) {
    this.buffer = buffer;
    this.pos = 0;
  }

  read() {
    const { pos } = this;
    this.pos += 2;
    return this.buffer.readUInt16LE(pos);
  }

  readAt(offset) {
    return this.buffer.readUInt16LE(offset);
  }

  readPStringAt(offset) {
    const length = this.readAt(offset);
    return this.readStringNAt(length, offset + 2);
  }

  readStringNAt(length, offset) {
    const codes = [];
    for (let i = 0; i < length; ++i) {
      codes.push(this.readAt(offset + i * 2));
    }
    return String.fromCharCode(...codes);
  }
}

export default Reader;
