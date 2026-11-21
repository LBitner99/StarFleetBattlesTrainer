# Starfleet Battles Trainer

A single-file, solo web game based on Star Fleet Battles (Captain's Basic Set), built to learn the rules by playing them and to serve as a helper at the table.

- `sfb-duel.html` - the game. Open it in any modern browser; no build step or server needed.
- `docs/rules-coverage-audit.md` - which rules are implemented, which are optional, and which are not done.

Current build: v166.

## Goals

- Teach the Star Fleet Battles Captain's Basic Set rules by playing a solo duel against a computer opponent, so the systems are learned in real time, and to use the tool as a helper in real games.
- Work up from the Basic Set toward its scenarios (for example SG4 Basic Piracy and SG6 Pursuit into the Asteroids), adding ships a few at a time.
- Keep the Basic rules as the default. Anything beyond them (Advanced, Commander's and Optional rules, terrain, monsters, legendary officers and so on) sits behind a switch.
- Let the computer opponent use optional rules only when that option is switched on for the whole scenario, so the default difficulty does not change.
- Keep an interactive ship sheet in the look of the SSD, with models and graphics matching the ships.
- Comment the code with the rule numbers it implements, so the source doubles as a rules reference. Rule pop-ups in the game link every rule number to a summary.

## Rulebooks used

- **Captain's Basic Set rulebook (2012)** is the reference. Rule citations give the Basic Set first.
- **Captain's Basic Set SSD book (2011)** supplies the ship data (boxes, weapons, shields, movement cost).
- **Captain's Master Rulebook (Silver Anniversary edition)** is cited only where it holds the only applicable rule or revises a Basic rule. Where it revises one, the game shows both texts.

Both rulebooks are checked when verifying a rule. `docs/rules-coverage-audit.md` records what was compared and what is still open.

## Credits

Star Fleet Battles is a game by Amarillo Design Bureau. This is an unofficial fan project for personal learning. The rulebooks are not included in this repository.
