# Synacor Challenge

![Node Version](https://badgen.net/badge/node/12+/green)
[![MIT License](https://badgen.net/github/license/timkurvers/synacor-challenge)](LICENSE.md)
[![CI](https://github.com/timkurvers/synacor-challenge/workflows/ci/badge.svg)](https://github.com/timkurvers/synacor-challenge/actions?query=workflow%3Aci)

JavaScript / ES6+ virtual machine for https://challenge.synacor.com.

The [architecture spec] is bundled in this repository.

See [synacor-binja-plugin] for a [Binary Ninja] plugin capable of analyzing Synacor programs.

## Setup

Install [Node.js] 12 or higher for your platform.

Install dependencies through npm:

```bash
npm install
```

## Running VM

To run a program (from the `programs`-folder) in the VM:

```bash
npm start programs/alphabet.synbin
```

### Special commands

Whenever the program in the VM is awaiting input, commands prefixed with `$` are
executed as JavaScript code using [eval].

This may be used to easily inspect and mutate program state at runtime:

```
$ this.registers
[
  25975, 25974, 26006,
      0,   101,     0,
      0,     0
]

$ this.address = 0xa0a
2570
```

## External Debugging

Debuggers like `gdb` do not support arbitrary architectures like Synacor out of
the box.

However, by piggybacking on the [GDB remote protocol] and replicating packets
sent back and forth we can trick `gdb` into happily controlling a Synacor program
whilst running in a JavaScript VM within a Node.js process. 🤯

Features supported:

- Breakpoints (`break`)
- Control flow (stepping using `stepi` and `continue`)

To debug a program and listen for "remote gdb" connections on `localhost:31337`:

```bash
npm run debug programs/alphabet.synbin
```

Fire up `gdb` in a separate shell and attach to the remote target:

```bash
(gdb) target remote :31337
Remote debugging using :31337
0x00000000 in ?? ()
(gdb) b *0x2a
Breakpoint 1 at 0x2a

(gdb) stepi
0x00000004 in ?? ()

(gdb) c
Continuing.

Breakpoint 1, 0x0000002a in ?? ()
(gdb) c
Continuing.

Program terminated with signal SIGTERM, Terminated.
```

### Binary Ninja

See [synacor-binja-plugin] for debugging Synacor programs using [Binary Ninja].

### Options

To listen on a different host/port use `GDB_HOST` and `GDB_PORT`:

```bash
GDB_HOST=customhost GDB_PORT=1337 npm run debug programs/alphabet.synbin
```

To log all GDB remote protocol traffic use `GDB_LOG`:

```bash
GDB_LOG= npm run debug programs/alphabet.synbin
```

## Development

To monitor code changes and re-run programs in the VM during development:

```bash
npm run start:dev programs/alphabet.synbin
```

Similary, for the debugger during development:

```bash
npm run debug:dev programs/alphabet.synbin
```

[Binary Ninja]: https://binary.ninja/
[GDB Remote Protocol]: https://sourceware.org/gdb/current/onlinedocs/gdb/Remote-Protocol.html
[Node.js]: https://nodejs.org/en/
[architecture spec]: https://github.com/timkurvers/synacor-challenge/blob/master/ARCH-SPEC.txt
[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
[synacor-binja-plugin]: https://github.com/timkurvers/synacor-binja-plugin/
