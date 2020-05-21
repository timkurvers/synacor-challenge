# Synacor Challenge

![Node Version](https://badgen.net/badge/node/12+/green)
[![MIT License](https://badgen.net/github/license/timkurvers/synacor-challenge)](LICENSE.md)
![Checks](https://badgen.net/github/checks/timkurvers/synacor-challenge)

JavaScript / ES6+ VM for https://challenge.synacor.com.

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
npm start programs/example.synbin
```

## Development

To monitor code changes and re-run programs in the VM during development:

```bash
npm run start:dev example
```

[Binary Ninja]: https://binary.ninja/
[Node.js]: https://nodejs.org/en/
[architecture spec]: https://github.com/timkurvers/synacor-challenge/blob/master/ARCH-SPEC.txt
[synacor-binja-plugin]: https://github.com/timkurvers/synacor-binja-plugin/
