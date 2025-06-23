/**
 * Minesweeper game logic module.
 * Provides pure functions to create and manipulate Minesweeper game state, supporting custom board sizes, difficulty levels, and themes.
 * All functions are pure and do not mutate their arguments.
 *
 * @module game
 */

/**
 * @typedef {Object} GameConfig
 * @property {number} rows - Number of rows on the board.
 * @property {number} cols - Number of columns on the board.
 * @property {number} mines - Number of mines to place.
 * @property {string} [difficulty] - Optional difficulty label (e.g., 'easy', 'medium', 'hard').
 */

/**
 * @typedef {Object} Theme
 * @property {string} name - Theme name.
 * @property {Object.<string, string>} assets - Key-value pairs for asset names and URLs/paths.
 */

/**
 * @typedef {Object} GameState
 * @property {Array<Array<Cell>>} board - 2D array representing the board state.
 * @property {boolean} gameOver - Whether the game is over.
 * @property {boolean} won - Whether the player has won.
 * @property {number} flagsLeft - Number of flags remaining.
 * @property {GameConfig} config - The configuration used for this game.
 */

/**
 * @typedef {Object} Cell
 * @property {boolean} revealed - Whether the cell is revealed.
 * @property {boolean} flagged - Whether the cell is flagged.
 * @property {boolean} mine - Whether the cell contains a mine.
 * @property {number} adjacentMines - Number of adjacent mines.
 */

// Internal theme state (to be managed by the UI)
let currentTheme = { name: 'default', assets: {} };

// Predefined difficulty levels
const DIFFICULTY_LEVELS = [
  { rows: 9, cols: 9, mines: 10, difficulty: 'easy' },
  { rows: 16, cols: 16, mines: 40, difficulty: 'medium' },
  { rows: 16, cols: 30, mines: 99, difficulty: 'hard' }
];

function createEmptyBoard(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      revealed: false,
      flagged: false,
      mine: false,
      adjacentMines: 0
    }))
  );
}

function placeMines(board, mines) {
  const rows = board.length;
  const cols = board[0].length;
  let placed = 0;
  const total = rows * cols;
  const positions = Array.from({ length: total }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let i = 0; i < mines; i++) {
    const pos = positions[i];
    const r = Math.floor(pos / cols);
    const c = pos % cols;
    board[r][c].mine = true;
  }
  return board;
}

function countAdjacentMines(board, row, col) {
  const rows = board.length;
  const cols = board[0].length;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
        count++;
      }
    }
  }
  return count;
}

function fillAdjacentMines(board) {
  return board.map((row, r) =>
    row.map((cell, c) => ({
      ...cell,
      adjacentMines: cell.mine ? 0 : countAdjacentMines(board, r, c)
    }))
  );
}

/**
 * Initializes a new game with the given configuration.
 * @param {GameConfig} config
 * @returns {GameState}
 */
export function newGame(config) {
  const { rows, cols, mines } = config;
  let board = createEmptyBoard(rows, cols);
  board = placeMines(board, mines);
  board = fillAdjacentMines(board);
  return {
    board,
    gameOver: false,
    won: false,
    flagsLeft: mines,
    config
  };
}

function revealRecursive(board, row, col, revealed = new Set()) {
  const rows = board.length;
  const cols = board[0].length;
  const key = `${row},${col}`;
  if (revealed.has(key)) return;
  revealed.add(key);
  board[row][col].revealed = true;
  if (board[row][col].adjacentMines === 0 && !board[row][col].mine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].revealed && !board[nr][nc].flagged) {
          revealRecursive(board, nr, nc, revealed);
        }
      }
    }
  }
}

/**
 * Reveals a cell at (row, col).
 * @param {GameState} state
 * @param {number} row
 * @param {number} col
 * @returns {GameState}
 */
export function revealCell(state, row, col) {
  if (state.gameOver || state.board[row][col].flagged || state.board[row][col].revealed) return state;
  // Deep copy board
  const board = state.board.map(rowArr => rowArr.map(cell => ({ ...cell })));
  if (board[row][col].mine) {
    board[row][col].revealed = true;
    return { ...state, board, gameOver: true, won: false };
  }
  revealRecursive(board, row, col);
  // Check win
  const won = board.flat().every(cell => cell.revealed || cell.mine);
  return {
    ...state,
    board,
    gameOver: won,
    won
  };
}

/**
 * Flags or unflags a cell at (row, col).
 * @param {GameState} state
 * @param {number} row
 * @param {number} col
 * @returns {GameState}
 */
export function toggleFlag(state, row, col) {
  if (state.gameOver || state.board[row][col].revealed) return state;
  const board = state.board.map(rowArr => rowArr.map(cell => ({ ...cell })));
  const cell = board[row][col];
  if (cell.flagged) {
    cell.flagged = false;
    return { ...state, board, flagsLeft: state.flagsLeft + 1 };
  } else if (state.flagsLeft > 0) {
    cell.flagged = true;
    return { ...state, board, flagsLeft: state.flagsLeft - 1 };
  }
  return state;
}

/**
 * Returns the current game status: 'playing', 'won', or 'lost'.
 * @param {GameState} state
 * @returns {string}
 */
export function getGameStatus(state) {
  if (state.gameOver) return state.won ? 'won' : 'lost';
  return 'playing';
}

/**
 * Gets the current theme.
 * @returns {Theme}
 */
export function getCurrentTheme() {
  return currentTheme;
}

/**
 * Sets the current theme.
 * @param {Theme} theme
 */
export function setTheme(theme) {
  currentTheme = theme;
}

/**
 * Returns a list of predefined difficulty levels.
 * @returns {Array<GameConfig>}
 */
export function getDifficultyLevels() {
  return DIFFICULTY_LEVELS;
} 