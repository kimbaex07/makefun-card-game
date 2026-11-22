# Ember Duel

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/kimbaex07/makefun-card-game/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/kimbaex07/makefun-card-game/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

**Ember Duel** is an original turn-based card duel for the [make.fun "Make the best card game" competition](https://make.fun/c/best-card-game-20261122-1826). You face Cinder, a rival who banks ember for a devastating Inferno — read the telegraph, raise a shield, and burn their life to zero first.

*Twelve original cards. One readable rival. Zero luck you cannot play around.*

## How to play

- **Goal:** reduce the rival's life from 20 to 0. If your life hits 0, you lose.
- **Ember is mana:** each turn you gain +1 ember (up to 10) and draw a card.
- **Play a card:** click it, or press **1–7**. A card costs ember; you cannot play what you cannot afford.
- **End your turn:** click **END TURN** or press **Space**. Then the rival plays, one card at a time, so you can read its plan.
- **Restart:** press **R**. **M** mutes the procedural sounds.

## The cards

Twelve original cards in a 30-card deck, each told apart by colour **and** shape:

| Card | Cost | Effect |
| --- | --- | --- |
| Spark | 1 | Deal 2 damage |
| Flame Lash | 2 | Deal 4 damage |
| Inferno | 4 | Deal 7 damage |
| Cinder Burst | 3 | Deal 3, draw a card |
| Frostbite | 2 | Deal 3, foe loses 1 ember |
| Phoenix Rise | 5 | Deal 5, heal 3 |
| Ashen Gambit | 3 | Deal 6, take 2 damage |
| Stone Wall | 1 | Gain 3 shield |
| Ember Bulwark | 2 | Gain 5 shield |
| Mend | 2 | Heal 4 life |
| Kindle | 0 | Draw 2 cards |
| Stoke | 1 | Gain 2 ember |

Shield absorbs damage before life does and stays up until it is broken.

## The rival's mind

Cinder is readable on purpose: when it holds Inferno but cannot afford it yet, it banks its ember and ends the turn early — the duel log says so. That is your cue to shield up. When hurt, it walls up or mends; when you are nearly beaten, it spends everything on damage. A passive player loses in a few turns; a player who shields the telegraphed Inferno and spends ember on damage wins with life to spare.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files, and all sounds are procedural WebAudio.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22 stdlib only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
