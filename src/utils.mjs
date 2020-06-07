import colors from 'colors/safe';

import { ADDRESS_SIZE } from './constants';

export const color = {
  address: colors.green,
  error: colors.red.bold,
  number: colors.cyan,
  operation: colors.white.bold,
  register: colors.yellow,
  string: colors.red.bold,
};

export const hex = (value, bitSize = 16) => (
  `0x${value.toString(16).toUpperCase().padStart(bitSize / 4, '0')}`
);
export const hex8 = (value) => hex(value, 8);
export const hex16 = hex;

export const hexoffset = (address, bitSize = 16) => {
  const offset = address * ADDRESS_SIZE;
  return hex(offset, bitSize);
};
