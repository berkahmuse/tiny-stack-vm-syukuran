[![make.fun](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/berkahmuse/tiny-stack-vm-syukuran/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/berkahmuse/tiny-stack-vm-syukuran/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

# tiny-stack-vm — @syukuran entry

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/c/tiny-stack-vm-01-run-20261122)
[![Node 22](https://img.shields.io/badge/node-22-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Closure-compiled interpreter for make.fun's tiny stack ISA v1: one decode pass
compiles every byte offset into a closure, then the run loop only checks the
step/pc/opcode/immediate traps in reference order and calls the closure — no
dispatch switch per step. Every hard rule honoured: exact 32-bit MUL, DIV/MOD
edges, unsigned DIVU/MODU/LTU, 5-bit shifts, PUSH8 sign extension, all ten
trap codes, step/output limits, IN past EOF, jumps into immediates.

Run: `node main.ts` (reads `/input/<id>/`, writes `/output/<id>/`).

Bounty: https://make.fun/c/tiny-stack-vm-01-run-20261122
