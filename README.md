# Crowning Point · Morning Sales Training ("The 30")

The 9:00–9:30 AM training system for the Resolute × Crowning Point floor in Tampa, with a new branded week every Sunday.

## What's here
- `framework/framework.json`: the permanent system: daily clock, day lanes, 4-week rotation, culture events, awards, research digest, compliance notes.
- `framework/WEEKLY-ROUTINE.md`: the exact steps the Sunday routine follows.
- `weeks/<monday-date>/week.json`: that week's sessions (the only file that changes week to week).
- `weeks/<monday-date>/out/`: the PDF playbook and the Instagram feed and story graphics.
- `weeks/<monday-date>/captions.md`: ready-to-paste captions.
- `weeks/LOG.md`: everything already used, so weeks never repeat.
- `brand/`: drop the real logo files here (see `brand/README.md`).

## The Daily 30
| Time | Block | What |
|---|---|---|
| 9:00 | Crown Call | Energy and receipts: wins, the bell, one shout-out |
| 9:03 | The Lesson | One idea, one framework, one line to steal |
| 9:13 | Live Reps | Everybody talks. The drill format changes every day |
| 9:27 | Lock-In | One commitment, then phones at 9:30 |

MON The Open · TUE The Conversation · WED CEO Wednesday (retention / scaling / agency building / profitability) · THU Battle for the Crown · FRI Film Room · SAT The Arena

## Build
```
cd build && npm install && node build.mjs 2026-09-28
```
