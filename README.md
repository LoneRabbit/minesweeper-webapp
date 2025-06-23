# Minesweeper Web App

A modern, accessible, and fully-featured Minesweeper game with advanced gameplay modes, theming, and a clean web interface. Built for coursework, this project demonstrates pure functional game logic, a well-documented API, comprehensive unit tests, and a responsive, accessible UI.

## Features

- **Classic Minesweeper**: Play the traditional game with customizable board sizes and difficulty levels.
- **Maze/Adventure Mode**: Navigate a randomly generated maze with Minesweeper logic. Reveal cells to move, collect keys and defusers from chests, unlock doors, and reach the exit.
- **Themes**: Choose from Modern Minimal, 90s Internet, and High Contrast themes for accessibility and style.
- **Accessibility**: Fully keyboard-accessible, high-contrast mode, and semantic HTML for screen readers.
- **First Click Safe**: The first cell you reveal is always safe.
- **Timer & Leaderboard**: Track your best times locally for each difficulty.
- **Pure Functional Logic**: All game logic is implemented as pure functions for reliability and testability.
- **Comprehensive Unit Tests**: Mocha-based tests for both classic and maze modes.
- **API Documentation**: JSDoc comments throughout the logic modules.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd minesweeper-webapp
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Running the App

Start the local development server:
```sh
node server.js
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

Unit tests are written with Mocha and can be run with:
```sh
npm test
```
Tests cover all core game logic, including win/loss conditions, flagging, recursive reveals, maze generation, and inventory mechanics.

## Project Structure

```
minesweeper-webapp/
  public/           # Static assets and main UI (index.html, style.css, app.js)
  web-app/          # Pure JS modules for game logic and tests
    game.js         # Classic Minesweeper logic (pure functions, JSDoc)
    mazeGame.js     # Maze/Adventure mode logic (pure functions, JSDoc)
    tests/          # Mocha test suites for both modes
  server.js         # Express server for local development
  package.json      # Project metadata and dependencies
```

- **public/app.js**: Main UI logic, event handling, and rendering.
- **web-app/game.js**: Pure functional Minesweeper logic (classic mode).
- **web-app/mazeGame.js**: Pure functional Maze/Adventure mode logic.
- **web-app/tests/**: Mocha test suites for both modules.

## Game Modes

### Classic Minesweeper

- Custom board sizes and mine counts.
- Three difficulty levels: Easy, Medium, Hard.
- Flagging, recursive reveal, and win/loss detection.

### Maze/Adventure Mode

- Randomly generated maze with a guaranteed solvable path.
- Player must reveal cells to move; can only move to revealed, non-mine cells.
- Chests (with keys or bomb defusers), locked doors, and inventory tracking.
- Reach the exit to win; hitting a mine ends the game.
- All mines are revealed on loss.

## Theming & Accessibility

- **Modern Minimal**: Clean, neutral colors.
- **90s Internet**: Nostalgic, playful palette and fonts.
- **High Contrast**: For visually impaired users.
- Fully keyboard-accessible (tab, enter/space to reveal, F to flag).
- Responsive design for mobile and desktop.

## API & Documentation

All game logic is implemented as pure functions and documented with JSDoc. See `web-app/game.js` and `web-app/mazeGame.js` for API details.

To generate HTML documentation (requires [JSDoc](https://jsdoc.app/)):
```sh
npx jsdoc web-app/game.js web-app/mazeGame.js
```

## Assignment Criteria

- Pure functional implementation of all game logic.
- Well-documented API with JSDoc.
- Comprehensive, behavior-driven unit tests.
- Clean, accessible, and responsive web UI.
- Custom board sizes, difficulty levels, and themes.
- Advanced Maze/Adventure mode with inventory and pathfinding.

## Screenshots

> _Replace the image files and paths below with your own screenshots!_

### Classic Minesweeper (Modern Minimal Theme)
![Classic Minesweeper - Modern Minimal](docs/screenshots/classic-modern.png)

### Maze/Adventure Mode (90s Internet Theme)
![Maze Mode - 90s Internet](docs/screenshots/maze-90s.png)

### High Contrast Theme
![High Contrast Theme](docs/screenshots/high-contrast.png)

To add your own screenshots:
1. Take screenshots of your app in different modes/themes.
2. Save them as PNG or JPG files in a new folder: `docs/screenshots/`.
3. Update the image paths above if needed.

---

## FAQ

**Q: How do I change the board size or difficulty?**  
A: Use the "Difficulty" dropdown in the UI. You can also customize the logic in `web-app/game.js` for more options.

**Q: How do I switch themes?**  
A: Use the "Theme" dropdown in the UI. The app supports Modern Minimal, 90s Internet, and High Contrast themes.

**Q: How do I play Maze/Adventure mode?**  
A: Select "Maze" from the "Mode" dropdown. Reveal cells to move, collect keys and defusers from chests, unlock doors, and reach the exit.

**Q: How is the first click always safe?**  
A: The board is regenerated if your first click would reveal a mine or a non-empty cell.

**Q: Where is my leaderboard stored?**  
A: Leaderboard times are saved in your browser's local storage, per difficulty.

**Q: How do I run the tests?**  
A: Run `npm test` in your project directory. See the "Running Tests" section above.

**Q: How do I generate API documentation?**  
A: Run `npx jsdoc web-app/game.js web-app/mazeGame.js`. The output will be in the `docs/` folder.

**Q: Can I play with just the keyboard?**  
A: Yes! Use Tab to focus cells, Enter/Space to reveal, and "F" to flag.

**Q: How do I add more themes or features?**  
A: Extend the theme definitions in `public/app.js` and add corresponding CSS in `public/style.css`.

---

## License

ISC 