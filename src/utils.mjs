import { ADDRESS_SIZE } from './constants';

export { default as colors } from 'colors/safe';

export const hex = (value, { bitSize = 0, prefix = false } = {}) => {
  const result = value.toString(16).padStart(bitSize / 4, '0');
  return prefix ? `0x${result}` : result;
};

export const hex8 = (value, { prefix = false } = {}) => (
  hex(value, { bitSize: 8, prefix })
);

export const hex16 = (value, { prefix = false } = {}) => (
  hex(value, { bitSize: 16, prefix })
);

export const hexoffset = (address, { bitSize = 16, prefix = true } = {}) => (
  hex(address * ADDRESS_SIZE, { bitSize, prefix })
);

export const sum = (array) => array.reduce((total, next) => total + next, 0);
