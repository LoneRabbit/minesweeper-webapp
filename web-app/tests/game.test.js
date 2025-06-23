import {
  newGame,
  revealCell,
  toggleFlag,
  getGameStatus,
  getCurrentTheme,
  setTheme,
  getDifficultyLevels
} from '../game.js';

let passed = 0, failed = 0;
function assert(condition, message) {
  if (!condition) {
    console.error('❌', message);
    failed++;
  } else {
    console.log('✅', message);
    passed++;
  }
}

console.log('--- Minesweeper Game Module Tests ---');

// Test 1: New game creation
const config = { rows: 5, cols: 5, mines: 5 };
const state = newGame(config);
assert(state.board.length === 5 && state.board[0].length === 5, 'Board size is correct');
const mineCount = state.board.flat().filter(cell => cell.mine).length;
assert(mineCount === 5, 'Correct number of mines placed');
assert(state.flagsLeft === 5, 'Flags left matches mine count');

// Test 2: Reveal a non-mine cell
let safeCell;
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    if (!state.board[r][c].mine) {
      safeCell = { r, c };
      break;
    }
  }
  if (safeCell) break;
}
const state2 = revealCell(state, safeCell.r, safeCell.c);
assert(state2.board[safeCell.r][safeCell.c].revealed, 'Revealing a safe cell works');
assert(getGameStatus(state2) === 'playing', 'Game is still playing after safe reveal');

// Test 3: Reveal a mine cell
let mineCell;
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    if (state.board[r][c].mine) {
      mineCell = { r, c };
      break;
    }
  }
  if (mineCell) break;
}
const state3 = revealCell(state, mineCell.r, mineCell.c);
assert(state3.board[mineCell.r][mineCell.c].revealed, 'Revealing a mine cell works');
assert(getGameStatus(state3) === 'lost', 'Game is lost after revealing a mine');

// Test 4: Flag and unflag a cell
const state4 = toggleFlag(state, safeCell.r, safeCell.c);
assert(state4.board[safeCell.r][safeCell.c].flagged, 'Flagging a cell works');
assert(state4.flagsLeft === 4, 'Flags left decreases after flagging');
const state5 = toggleFlag(state4, safeCell.r, safeCell.c);
assert(!state5.board[safeCell.r][safeCell.c].flagged, 'Unflagging a cell works');
assert(state5.flagsLeft === 5, 'Flags left increases after unflagging');

// Test 5: Theme functions
const theme = { name: 'dark', assets: { mine: 'mine.png' } };
setTheme(theme);
const currentTheme = getCurrentTheme();
assert(currentTheme.name === 'dark', 'Theme name is set correctly');
assert(currentTheme.assets.mine === 'mine.png', 'Theme asset is set correctly');

// Test 6: Difficulty levels
const levels = getDifficultyLevels();
assert(Array.isArray(levels) && levels.length >= 3, 'Difficulty levels are available');
assert(levels.some(l => l.difficulty === 'easy'), 'Easy difficulty is present');
assert(levels.some(l => l.difficulty === 'medium'), 'Medium difficulty is present');
assert(levels.some(l => l.difficulty === 'hard'), 'Hard difficulty is present');

// Test 7: Win condition detection
(function testWinCondition() {
  const config = { rows: 2, cols: 2, mines: 1 };
  let state = newGame(config);
  // Find mine and safe cells
  let mineCell, safeCells = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (state.board[r][c].mine) mineCell = { r, c };
      else safeCells.push({ r, c });
    }
  }
  // Reveal all safe cells
  for (const cell of safeCells) {
    state = revealCell(state, cell.r, cell.c);
  }
  assert(getGameStatus(state) === 'won', 'Game is won after all safe cells are revealed');
})();

// Test 8: Cannot flag a revealed cell
(function testFlagRevealedCell() {
  let state = newGame({ rows: 2, cols: 2, mines: 1 });
  // Find a safe cell and reveal it
  let safeCell;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (!state.board[r][c].mine) safeCell = { r, c };
  state = revealCell(state, safeCell.r, safeCell.c);
  const flagged = toggleFlag(state, safeCell.r, safeCell.c);
  assert(!flagged.board[safeCell.r][safeCell.c].flagged, 'Cannot flag a revealed cell');
})();

// Test 9: Cannot reveal a flagged cell
(function testRevealFlaggedCell() {
  let state = newGame({ rows: 2, cols: 2, mines: 1 });
  // Find a safe cell and flag it
  let safeCell;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (!state.board[r][c].mine) safeCell = { r, c };
  state = toggleFlag(state, safeCell.r, safeCell.c);
  const revealed = revealCell(state, safeCell.r, safeCell.c);
  assert(!revealed.board[safeCell.r][safeCell.c].revealed, 'Cannot reveal a flagged cell');
})();

// Test 10: Recursive reveal of empty cells
(function testRecursiveReveal() {
  // Board with no mines
  let state = newGame({ rows: 3, cols: 3, mines: 0 });
  state = revealCell(state, 1, 1);
  const allRevealed = state.board.flat().every(cell => cell.revealed);
  assert(allRevealed, 'Revealing an empty cell recursively reveals all cells');
})();

// Test 11: Cannot flag when flagsLeft is 0
(function testFlagLimit() {
  let state = newGame({ rows: 2, cols: 2, mines: 1 });
  // Flag all cells except one
  let flagged = state;
  let flaggedCount = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (flagged.flagsLeft > 0 && !flagged.board[r][c].flagged) {
        flagged = toggleFlag(flagged, r, c);
        flaggedCount++;
      }
    }
  }
  // Try to flag another cell (should not work)
  let unflaggedCell;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (!flagged.board[r][c].flagged) unflaggedCell = { r, c };
  if (unflaggedCell) {
    const after = toggleFlag(flagged, unflaggedCell.r, unflaggedCell.c);
    assert(!after.board[unflaggedCell.r][unflaggedCell.c].flagged, 'Cannot flag when flagsLeft is 0');
  } else {
    assert(true, 'All cells flagged, skipping flag limit test');
  }
})();

console.log(`--- End of Tests ---\nPassed: ${passed}, Failed: ${failed}`); 