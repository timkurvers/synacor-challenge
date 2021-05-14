/* eslint-disable no-await-in-loop */

import assert from 'assert';
import fs from 'fs';

import Item from './entities/Item';
import Location from './entities/Location';

class Analyzer {
  constructor() {
    this.program = null;
    this.data = null;

    this.locations = [];
    this.items = [];
  }

  load(program) {
    this.program = program;
    this.data = program.data;

    // Verify provided program is the official and sufficiently decoded binary
    assert.strictEqual(
      this.data.readBigUInt64BE(),
      0x1500150013005700n,
      'analyzer must be provided with the official Synacor challenge binary',
    );
    assert.strictEqual(
      this.data.readBigUInt64BE(0x2FFC),
      0x090046006F006F00n,
      'analyzer must be provided with a binary that has the self-test complete',
    );

    // Parse locations and items
    this.locations.push(...Location.parse(this.data, 0x121A, 0x1332));
    this.locations.push(...Location.parse(this.data, 0x133E, 0x14CE));
    this.items.push(...Item.parse(this.data, 0x14D8, 0x1550));
  }

  // Generates a Graphviz map of the Synacor world
  async visualize(outpath) {
    const file = await fs.promises.open(outpath, 'w');
    await file.write('digraph Synacor {\n  node [colorscheme="set28" style="filled"]\n');
    for (const location of this.locations) {
      // Determine items available at this location
      const items = this.items.filter((item) => item.location === location.id);

      // Annotate locations with special behaviour on entry
      const suffix = location.fn ? '❗️' : '';

      const label = [
        `${location.label}${suffix}`,
        ...items.map((item) => `+ ${item.label}`),
      ].join('\\n');

      const shape = location.isStart ? 'diamond' : 'ellipse';
      await file.write(`  ${location.id} [fillcolor="${location.group}" label="${label}" shape="${shape}"]\n`);

      for (const exit of location.exits) {
        await file.write(`  ${location.id} -> ${exit.target} [label="${exit.label}"]\n`);
      }
    }
    await file.write('}\n');
    await file.close();
  }
}

export default Analyzer;
