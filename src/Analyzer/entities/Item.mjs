import Reader from '../Reader';

class Item {
  constructor(id, name, description, location, fn) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.location = location;
    this.fn = fn;
  }

  get label() {
    return this.name;
  }

  static parse(data, fromOffset, toOffset) {
    const reader = new Reader(data);

    const items = [];
    for (reader.pos = fromOffset; reader.pos <= toOffset;) {
      const id = reader.pos;

      const name = reader.readPStringAt(reader.read() * 2);
      const description = reader.readPStringAt(reader.read() * 2);
      const location = reader.read() * 2;
      const fn = reader.read();

      const item = new this(id, name, description, location, fn);
      items.push(item);
    }
    return items;
  }
}

export default Item;
