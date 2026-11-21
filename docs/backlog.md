# Backlog

Known problems and loose ends that are not being worked on right now. Newest first.

## Bugs

- **Romulan ship selector (reported v171, not fixed yet).** On the ship choice screen the Romulan race shows the Q-ships, and clicking them jumps to the Gorn race selection. Probably the Romulan ship list in `FLEET` (`src/data/ships.js`) holds Q-ship keys (`QGS`, `QGL`) that belong to the Gorn side, so the picker switches race when one is clicked. Check `FLEET.rom`, `pickSide` and `pickShip` in `src/js/29-ui.js`.

## Open items from the scenario work

- SG2 with the Kzinti CV and the Federation BT are still played as the nearest ship until those ships are built.
- Year selection (Y168 default) and Commander's Option Items (S3.2) are not built; they apply to every scenario.
- Ally and fleet AI still needs reinforcement arrival (SG3) and larger fleets (SG8, up to 13 ships).
- See `docs/scenario-matrix.md` and `docs/rules-coverage-audit.md` for the full lists.
