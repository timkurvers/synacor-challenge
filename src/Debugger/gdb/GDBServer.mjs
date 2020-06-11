import net from 'net';

import { hex8 } from '../../utils';

import GDBClient from './GDBClient';
import { hash, log, validate } from './utils';
import { signal } from './constants';
import * as packets from './packets';

const { interrupt } = packets;

class GDBServer {
  constructor(dbg) {
    this.dbg = dbg;
    this.clients = new Set();

    dbg.on('break', () => {
      this.reply(`T${hex8(signal.TRAP)}`);
    });

    dbg.on('halt', () => {
      this.reply(`X${hex8(signal.TERM)}`);
    });

    this._server = net.createServer((socket) => {
      const client = new GDBClient(socket);
      this.clients.add(client);

      socket.on('data', (packet) => {
        if (packet.match(interrupt.match)) {
          log('=> [interrupt]');
          client.ack();
          interrupt.process(client, { dbg });
          return;
        }

        log('=>', packet);

        const [_, data, checksum] = packet.split(/\$|#/);
        if (!data) {
          return;
        }

        if (!validate(data, checksum)) {
          log('packet checksum mismatch', checksum, hex8(hash(data)));
          return;
        }

        client.ack();

        for (const candidate of Object.values(packets)) {
          const match = data.match(candidate.match);
          if (match) {
            candidate.process(client, {
              data, dbg, packet, match,
            });
            break;
          }
        }
      });

      socket.on('error', (err) => {
        console.error('gdb client error', err);
      });

      socket.on('end', () => {
        this.clients.delete(client);
        log('client disconnected');
      });
    });

    this._server.on('error', (err) => {
      console.error('gdb server error', err);
    });
  }

  listen(port) {
    this._server.listen(port, () => {
      console.log(`gdb server listening on port ${port}`);
    });
  }

  reply(msg) {
    for (const client of this.clients) {
      client.reply(msg);
    }
  }
}

export default GDBServer;
