/* eslint-disable import/prefer-default-export */

import colors from 'colors/safe';

import { ADDRESS_SIZE } from './constants';

export const color = {
  address: colors.yellow,
  error: colors.red.bold,
  number: colors.cyan,
  register: colors.green,
  string: colors.gray.bold,
};

export const hexoffset = (address, maxBytes = 2) => {
  const offset = address * ADDRESS_SIZE;
  return `0x${offset.toString(16).toUpperCase().padStart(maxBytes * 2, '0')}`;
};
