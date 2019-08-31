/* eslint-disable no-param-reassign */

import Operand from '../VM/operations/Operand';
import VM from '../VM';
import operations from '../VM/operations/lookup';
import {
  LITERAL_MAX,
  LITERAL_MODULO,
} from '../constants';
import { color, hexoffset } from '../utils';

class Disassembler extends VM {
  resolve(operand) {
    let value = this.read();

    if (operand & Operand.DYNAMIC && value > LITERAL_MAX) {
      operand |= Operand.TYPE_REGISTER;
    }

    if (operand & Operand.TYPE_REGISTER) {
      value %= LITERAL_MODULO;
      const register = color.register(`R${value}`);
      if (operand & Operand.TYPE_ADDRESS) {
        return `address(${register})`;
      }
      if (operand & Operand.TYPE_CHAR) {
        return `char(${register})`;
      }
      return register;
    }

    if (operand & Operand.TYPE_ADDRESS) {
      return color.address(hexoffset(value));
    }
    if (operand & Operand.TYPE_CHAR) {
      return color.string(String.fromCharCode(value));
    }
    return color.number(value);
  }

  async dump(program) {
    this.load(program);

    while (!this.eof) {
      const { address } = this;
      const opcode = this.read();

      const operation = operations.get(opcode);
      if (!operation) {
        console.log(color.address(hexoffset(address)), color.error(opcode));
        continue;
      }

      const operands = operation.operands.map(this.resolve);
      console.log(
        color.address(hexoffset(address)),
        operation.name.padStart(6, ' '),
        ...operands,
      );
    }
  }
}

export default Disassembler;
