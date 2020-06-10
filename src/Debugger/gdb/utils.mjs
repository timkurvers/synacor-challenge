import path from 'path';
import { fileURLToPath } from 'url';

import colors from 'colors/safe';

import { hex8, sum } from '../../utils';

export const encode = (data) => {
  const buffer = Buffer.from(data);
  const bytes = [];
  for (const c of buffer) {
    // Escape special characters '#', '$', '}' and '*'
    if (c === 0x23 || c === 0x24 || c === 0x7D || c === 0x2A) {
      bytes.push(0x7D, c ^ 0x20);
    } else {
      bytes.push(c);
    }
  }
  return Buffer.from(bytes).toString();
};

export const hash = (data) => {
  const checksum = sum(data.split('').map((c) => c.charCodeAt(0))) % 256;
  return hex8(checksum);
};
export const validate = (data, checksum) => hash(data) === checksum;

export const basename = (url) => path.basename(fileURLToPath(url));
export const dirname = (url) => path.dirname(fileURLToPath(url));

export const log = (...args) => {
  const enabled = 'GDB_LOG' in process.env;
  if (enabled) {
    console.log(colors.gray(args.join(' ')));
  }
};
