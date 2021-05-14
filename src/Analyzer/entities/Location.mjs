import Reader from '../Reader';

import Exit from './Exit';

class Location {
  constructor(id, name, description, fn) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.fn = fn;

    this.exits = [];
  }

  get group() {
    // Foothills & dark cave
    if (this.id <= 0x1256) return 5;

    // Cavern & passages
    if (this.id <= 0x1314) return 3;

    // Ruins
    if (this.id <= 0x1366) return 7;

    // Synacor HQ
    if (this.id <= 0x137A) return 1;

    // Beach & tropical cave
    if (this.id <= 0x13FC) return 6;

    // Vault
    if (this.id <= 0x14A6) return 2;

    // Dead end
    if (this.id <= 0x14CE) return 3;

    return -1;
  }

  get isStart() {
    return this.id === 0x121A;
  }

  get label() {
    if (this.name.startsWith('Vault')) {
      const parts = this.description.match(/'[^']+'/g);
      if (parts) {
        const symbol = parts.pop();
        const suffix = parts.length ? `\\n(req. ${parts.pop()})` : '';
        return `${this.name} ${symbol}${suffix}`;
      }
    }
    return this.name;
  }

  static parse(data, fromOffset, toOffset) {
    const reader = new Reader(data);

    const locations = [];
    for (reader.pos = fromOffset; reader.pos <= toOffset;) {
      const id = reader.pos;
      const name = reader.readPStringAt(reader.read() * 2);
      const description = reader.readPStringAt(reader.read() * 2);
      const exits = Exit.parse(data, reader.read() * 2, reader.read() * 2);
      const fn = reader.read();

      const location = new this(id, name, description, fn);
      location.exits.push(...exits);
      locations.push(location);
    }
    return locations;
  }
}

export default Location;
