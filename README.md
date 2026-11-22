# Starfleet Battles Trainer

A single-file, solo web game based on Star Fleet Battles (Captain's Basic Set), built to learn the rules by playing them and to serve as a helper at the table.

- `sfb-duel.html` - the game. Open it in any modern browser; no server needed. This file is generated from `src/` (see Source layout below), so edit the files in `src/`, never this one.
- `docs/rules-coverage-audit.md` - which rules are implemented, which are optional, and which are not done.

## Download and run the game

The game is one self-contained file, so there is nothing to install and no server to run.

1. Download `sfb-duel.html`:
   - On GitHub, open the file in the repository, click **Raw** (or the download icon), and save the page as `sfb-duel.html`; or
   - Click **Code > Download ZIP** on the repository page, unzip it, and use the `sfb-duel.html` inside; or
   - With Git: `git clone https://github.com/LBitner99/StarFleetBattlesTrainer.git` and open `sfb-duel.html` from the new folder.
2. Double-click `sfb-duel.html` to open it in a modern browser (Chrome, Edge, Firefox or Safari). It works offline once opened.
3. Pick a scenario and ships on the first screen, then press the start button. Progress such as the match history is kept in the browser, so use the same browser and the same copy of the file to keep it.

If you change anything in `src/`, run `build.ps1` (Windows PowerShell) or `python3 build.py` to regenerate `sfb-duel.html` before opening it. Downloaders of the finished game do not need to do this.

Current build: v188.

## Source layout

- `src/template.html` and `src/style.css` - the page and its styles.
- `src/js/` - the game code, one file per area (movement, firing, seeking weapons, planets, monsters, UI and so on), numbered in the order they are joined.
- `src/data/` - the large data tables: ship data, SSD geometry, ship silhouettes and the rule texts and summaries shown in the pop-ups.
- `src/manifest.txt` - the order in which the files are joined. Order matters, because the script runs top to bottom.
- `build.ps1` (Windows) or `build.py` (Python 3) joins them into `sfb-duel.html`. `push.ps1` runs `build.ps1` before every push, so the pushed game always matches `src/`.
- `docs/` - the rules coverage audit and the rule, scenario and ship tables.

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
