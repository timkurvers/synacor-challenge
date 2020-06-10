import { hash, log } from './utils';

class GDBClient {
  constructor(socket) {
    this._socket = socket;
    this._socket.setEncoding('utf8');
    this._socket.setNoDelay(true);

    this.useAcks = true;
  }

  ack() {
    if (this.useAcks) {
      this.send('+');
    }
  }

  ok() {
    this.reply('OK');
    log();
  }

  reply(data = '') {
    const checksum = hash(data);
    const packet = `$${data}#${checksum}`;
    this.send(packet);
    log();
  }

  send(packet) {
    log('<=', packet);
    try {
      this._socket.write(packet);
    } catch (e) {
      console.error('could not write to socket', e);
    }
  }
}

export default GDBClient;
