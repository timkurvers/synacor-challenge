import assert from 'assert';

import Reader from '../Reader';

class Exit {
  constructor(id) {
    this.id = id;
    this.label = null;
    this.target = null;
  }

  static parse(data, namesOffset, targetOffset) {
    const reader = new Reader(data);
    reader.pos = namesOffset;

    // Initialize exits with a label each
    const count = reader.read();
    const exits = Array.from({ length: count }, (_, id) => new this(id));
    for (const exit of exits) {
      exit.label = reader.readPStringAt(reader.read() * 2);
    }

    // Ensure the amount of targets matches the amount of names
    reader.pos = targetOffset;
    assert.equal(reader.read(), exits.length);

    // Augment exits with their target location
    for (const exit of exits) {
      exit.target = reader.read() * 2;
    }

    return exits;
  }
}

export default Exit;
