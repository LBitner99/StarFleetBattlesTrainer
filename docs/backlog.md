# Backlog

Known problems and loose ends that are not being worked on right now. Newest first.

## Bugs

- **Romulan ship selector (reported v171, not fixed yet).** On the ship choice screen the Romulan race shows the Q-ships, and clicking them jumps to the Gorn race selection. Probably the Romulan ship list in `FLEET` (`src/data/ships.js`) holds Q-ship keys (`QGS`, `QGL`) that belong to the Gorn side, so the picker switches race when one is clicked. Check `FLEET.rom`, `pickSide` and `pickShip` in `src/js/29-ui.js`.

## Open items from the scenario work

- Fighters (v174) are the Kzinti AAS only: no rearming or repair aboard (J4.8), no dogfights (J7), fighters fire only at ships, the computer flies all fighters, and a computer carrier never slows to recover them. Other fighters and carriers (CVS, AFF, auxiliary carrier for SH5) are not built.
- SG3 (v174): the Tholian 2xPC lists, the third-player option and SG3.64 modules/minefields are not built.
- Not yet tested in a long game: the type-G rack anti-drone firing against real drone attacks (v174 tug block).
- Year selection (Y168 default) and Commander's Option Items (S3.2) are not built; they apply to every scenario.
- Ally and fleet AI still needs larger fleets (SG8, up to 13 ships). Reinforcement arrival was built for SG3 in v174 (`sg3Rein`).
- See `docs/scenario-matrix.md` and `docs/rules-coverage-audit.md` for the full lists.
