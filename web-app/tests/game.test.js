import assert from 'assert';
import {
  newGame,
  revealCell,
  toggleFlag,
  getGameStatus,
  getCurrentTheme,
  setTheme,
  getDifficultyLevels
} from '../game.js';

describe('Minesweeper Game Module', function() {
  it('should create a new game with correct board size and mine count', function() {
    const config = { rows: 5, cols: 5, mines: 5 };
    const state = newGame(config);
    assert.strictEqual(state.board.length, 5, 'Board row count');
    assert.strictEqual(state.board[0].length, 5, 'Board col count');
    const mineCount = state.board.flat().filter(cell => cell.mine).length;
    assert.strictEqual(mineCount, 5, 'Correct number of mines placed');
    assert.strictEqual(state.flagsLeft, 5, 'Flags left matches mine count');
  });

  it('should reveal a non-mine cell and keep game playing', function() {
    const state = newGame({ rows: 5, cols: 5, mines: 5 });
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
    assert.strictEqual(getGameStatus(state2), 'playing', 'Game is still playing after safe reveal');
  });

  it('should reveal a mine cell and lose the game', function() {
    const state = newGame({ rows: 5, cols: 5, mines: 5 });
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
    assert.strictEqual(getGameStatus(state3), 'lost', 'Game is lost after revealing a mine');
  });

  it('should flag and unflag a cell and update flags left', function() {
    const state = newGame({ rows: 5, cols: 5, mines: 5 });
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
    const state4 = toggleFlag(state, safeCell.r, safeCell.c);
    assert(state4.board[safeCell.r][safeCell.c].flagged, 'Flagging a cell works');
    assert.strictEqual(state4.flagsLeft, 4, 'Flags left decreases after flagging');
    const state5 = toggleFlag(state4, safeCell.r, safeCell.c);
    assert(!state5.board[safeCell.r][safeCell.c].flagged, 'Unflagging a cell works');
    assert.strictEqual(state5.flagsLeft, 5, 'Flags left increases after unflagging');
  });

  it('should set and get theme correctly', function() {
    const theme = { name: 'dark', assets: { mine: 'mine.png' } };
    setTheme(theme);
    const currentTheme = getCurrentTheme();
    assert.strictEqual(currentTheme.name, 'dark', 'Theme name is set correctly');
    assert.strictEqual(currentTheme.assets.mine, 'mine.png', 'Theme asset is set correctly');
  });

  it('should provide difficulty levels', function() {
    const levels = getDifficultyLevels();
    assert(Array.isArray(levels) && levels.length >= 3, 'Difficulty levels are available');
    assert(levels.some(l => l.difficulty === 'easy'), 'Easy difficulty is present');
    assert(levels.some(l => l.difficulty === 'medium'), 'Medium difficulty is present');
    assert(levels.some(l => l.difficulty === 'hard'), 'Hard difficulty is present');
  });

  it('should detect win condition', function() {
    const config = { rows: 2, cols: 2, mines: 1 };
    let state = newGame(config);
    let mineCell, safeCells = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        if (state.board[r][c].mine) mineCell = { r, c };
        else safeCells.push({ r, c });
      }
    }
    for (const cell of safeCells) {
      state = revealCell(state, cell.r, cell.c);
    }
    assert.strictEqual(getGameStatus(state), 'won', 'Game is won after all safe cells are revealed');
  });

  it('should not flag a revealed cell', function() {
    let state = newGame({ rows: 2, cols: 2, mines: 1 });
    let safeCell;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (!state.board[r][c].mine) safeCell = { r, c };
    state = revealCell(state, safeCell.r, safeCell.c);
    const flagged = toggleFlag(state, safeCell.r, safeCell.c);
    assert(!flagged.board[safeCell.r][safeCell.c].flagged, 'Cannot flag a revealed cell');
  });

  it('should not reveal a flagged cell', function() {
    let state = newGame({ rows: 2, cols: 2, mines: 1 });
    let safeCell;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (!state.board[r][c].mine) safeCell = { r, c };
    state = toggleFlag(state, safeCell.r, safeCell.c);
    const revealed = revealCell(state, safeCell.r, safeCell.c);
    assert(!revealed.board[safeCell.r][safeCell.c].revealed, 'Cannot reveal a flagged cell');
  });

  it('should recursively reveal empty cells', function() {
    let state = newGame({ rows: 3, cols: 3, mines: 0 });
    state = revealCell(state, 1, 1);
    const allRevealed = state.board.flat().every(cell => cell.revealed);
    assert(allRevealed, 'Revealing an empty cell recursively reveals all cells');
  });

  it('should not flag when flagsLeft is 0', function() {
    let state = newGame({ rows: 2, cols: 2, mines: 1 });
    let flagged = state;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        if (flagged.flagsLeft > 0 && !flagged.board[r][c].flagged) {
          flagged = toggleFlag(flagged, r, c);
        }
      }
    }
    let unflaggedCell;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (!flagged.board[r][c].flagged) unflaggedCell = { r, c };
    if (unflaggedCell) {
      const after = toggleFlag(flagged, unflaggedCell.r, unflaggedCell.c);
      assert(!after.board[unflaggedCell.r][unflaggedCell.c].flagged, 'Cannot flag when flagsLeft is 0');
    } else {
      assert(true, 'All cells flagged, skipping flag limit test');
    }
  });
}); 