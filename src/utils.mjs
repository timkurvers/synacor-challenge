import { ADDRESS_SIZE } from './constants';

export { default as colors } from 'colors/safe';

export const hex = (value, { bitSize = 0, le = false, prefix = false } = {}) => {
  let result = value.toString(16).padStart(bitSize / 4, '0');
  if (le) {
    result = result.split(/([a-f\d]{2})/).reverse().join('');
  }
  return prefix ? `0x${result}` : result;
};

export const hex8 = (value, { le = false, prefix = false } = {}) => (
  hex(value, { bitSize: 8, le, prefix })
);

export const hex16 = (value, { le = false, prefix = false } = {}) => (
  hex(value, { bitSize: 16, le, prefix })
);

export const hex32 = (value, { le = false, prefix = false } = {}) => (
  hex(value, { bitSize: 32, le, prefix })
);

export const hexoffset = (address, { bitSize = 16, prefix = true } = {}) => (
  hex(address * ADDRESS_SIZE, { bitSize, prefix })
);

export const sum = (array) => array.reduce((total, next) => total + next, 0);
