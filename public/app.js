import {
  newGame,
  revealCell,
  toggleFlag,
  getGameStatus,
  getDifficultyLevels,
  setTheme
} from './game.js';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const difficultyEl = document.getElementById('difficulty');
const themeEl = document.getElementById('theme');
const resetBtn = document.getElementById('reset');
const timerEl = document.getElementById('timer');
const leaderboardEl = document.getElementById('leaderboard');
const modeEl = document.getElementById('mode');

const THEMES = {
  modern: {
    name: 'Modern Minimal',
    class: 'theme-modern',
    assets: {}
  },
  '90s': {
    name: '90s Internet',
    class: 'theme-90s',
    assets: {}
  },
  contrast: {
    name: 'High Contrast',
    class: 'theme-contrast',
    assets: {}
  }
};

let gameState;
let boardRows = 9;
let boardCols = 9;
let boardMines = 10;
let firstClick = true;
let firstClickCell = null;
let timer = 0;
let timerInterval = null;
let timerStarted = false;

// Maze mode state
let mazeState = null;
let mazeStatusTimeout = null;

function getConfigFromDifficulty() {
  const val = difficultyEl.value;
  const levels = getDifficultyLevels();
  const found = levels.find(l => l.difficulty === val);
  if (found) return found;
  // fallback
  return { rows: 9, cols: 9, mines: 10, difficulty: 'easy' };
}

function safeNewGame(config, safeRow, safeCol) {
  // Try until the safe cell is blank (not a mine, zero adjacent mines)
  let state;
  let attempts = 0;
  do {
    state = newGame(config);
    attempts++;
    if (attempts > 100) break; // avoid infinite loop
  } while (
    state.board[safeRow][safeCol].mine ||
    state.board[safeRow][safeCol].adjacentMines !== 0
  );
  return state;
}

function renderBoard(state) {
  const { board } = state;
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateRows = `repeat(${board.length}, 32px)`;
  boardEl.style.gridTemplateColumns = `repeat(${board[0].length}, 32px)`;
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.tabIndex = 0;
      if (cell.revealed) cellEl.classList.add('revealed');
      if (cell.flagged) cellEl.classList.add('flagged');
      if ((cell.revealed && cell.mine) || (state.gameOver && cell.mine)) cellEl.classList.add('mine');
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;
      // Cell content
      if (cell.revealed) {
        if (cell.mine) {
          cellEl.textContent = '💣';
        } else if (cell.adjacentMines > 0) {
          cellEl.textContent = cell.adjacentMines;
        }
      } else if (cell.flagged) {
        cellEl.textContent = '🚩';
      } else if (state.gameOver && cell.mine) {
        // Show all mines when game is over
        cellEl.textContent = '💣';
      } else {
        cellEl.textContent = '';
      }
      // Mouse events
      cellEl.addEventListener('click', onCellClick);
      cellEl.addEventListener('contextmenu', onCellRightClick);
      // Keyboard accessibility
      cellEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onCellClick(e);
        } else if (e.key.toLowerCase() === 'f') {
          onCellRightClick(e);
        }
      });
      boardEl.appendChild(cellEl);
    });
  });
}

function startTimer() {
  if (!timerStarted) {
    timerStarted = true;
    timerInterval = setInterval(() => {
      timer++;
      updateTimer();
    }, 1000);
  }
}
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerStarted = false;
}
function resetTimer() {
  stopTimer();
  timer = 0;
  updateTimer();
}
function updateTimer() {
  timerEl.textContent = `⏱️ Time: ${timer} s`;
}

function getLeaderboardKey() {
  const config = getConfigFromDifficulty();
  return `minesweeper_leaderboard_${config.difficulty}`;
}
function loadLeaderboard() {
  const key = getLeaderboardKey();
  return JSON.parse(localStorage.getItem(key) || '[]');
}
function saveLeaderboard(lb) {
  const key = getLeaderboardKey();
  localStorage.setItem(key, JSON.stringify(lb));
}
function maybeAddToLeaderboard(time) {
  let lb = loadLeaderboard();
  // If not in top 5, skip
  if (lb.length === 5 && time > lb[4].time) return;
  let name = prompt('New record! Enter your name:','Player');
  if (!name) name = 'Player';
  lb.push({ name, time });
  lb.sort((a, b) => a.time - b.time);
  lb = lb.slice(0, 5);
  saveLeaderboard(lb);
}
function renderLeaderboard() {
  const lb = loadLeaderboard();
  if (lb.length === 0) {
    leaderboardEl.innerHTML = '<b>Leaderboard:</b> No records yet.';
    return;
  }
  leaderboardEl.innerHTML = '<b>Leaderboard:</b><br><table><tr><th>#</th><th>Name</th><th>Time (s)</th></tr>' +
    lb.map((entry, i) => `<tr><td>${i+1}</td><td>${entry.name}</td><td>${entry.time}</td></tr>`).join('') + '</table>';
}

function onCellClick(e) {
  e.preventDefault();
  const cellEl = e.currentTarget;
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  if (gameState.gameOver) return;
  if (firstClick) {
    // Regenerate board so first click is always blank
    gameState = safeNewGame(gameState.config, row, col);
    firstClick = false;
    resetTimer();
    startTimer();
  }
  gameState = revealCell(gameState, row, col);
  update();
  if (gameState.gameOver) {
    stopTimer();
    if (gameState.won) {
      maybeAddToLeaderboard(timer);
      renderLeaderboard();
    }
  }
}

function onCellRightClick(e) {
  e.preventDefault();
  const cellEl = e.currentTarget;
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  if (gameState.gameOver) return;
  gameState = toggleFlag(gameState, row, col);
  update();
}

function updateStatus() {
  const status = getGameStatus(gameState);
  if (status === 'won') {
    statusEl.textContent = '🎉 You won!';
  } else if (status === 'lost') {
    statusEl.textContent = '💥 Game over!';
  } else {
    statusEl.textContent = `Flags left: ${gameState.flagsLeft}`;
  }
}

function updateTheme() {
  const val = themeEl.value;
  const theme = THEMES[val] || THEMES.modern;
  document.body.className = theme.class;
  setTheme(theme);
}

function update() {
  renderBoard(gameState);
  updateStatus();
  updateTimer();
}

function resetGame() {
  const config = getConfigFromDifficulty();
  gameState = newGame(config);
  firstClick = true;
  resetTimer();
  renderLeaderboard();
  update();
}

function findPathBFS(maze, start, end) {
  const rows = maze.length, cols = maze[0].length;
  const queue = [[start, [start]]];
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  visited[start[0]][start[1]] = true;
  while (queue.length) {
    const [[r, c], path] = queue.shift();
    if (r === end[0] && c === end[1]) return path;
    for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 0 && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push([[nr, nc], path.concat([[nr, nc]])]);
      }
    }
  }
  return null;
}

function generateMazeMinesweeper(rows, cols, mineCount) {
  // Maze: 0=open, 1=wall
  let maze, openCells, playerRow, playerCol, exitRow, exitCol, path;
  let minDist = Math.floor((rows + cols) / 3);
  // 1. Generate maze and guarantee a path
  while (true) {
    maze = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (Math.random() < 0.25) maze[r][c] = 1;
    openCells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (maze[r][c] === 0) openCells.push([r, c]);
    if (openCells.length < 2) continue;
    // Pick start
    const startIdx = Math.floor(Math.random() * openCells.length);
    [playerRow, playerCol] = openCells[startIdx];
    // Pick exit far enough away
    let farCells = openCells.filter(([r, c]) => Math.abs(r - playerRow) + Math.abs(c - playerCol) >= minDist);
    if (farCells.length === 0) continue;
    const exitIdx = Math.floor(Math.random() * farCells.length);
    [exitRow, exitCol] = farCells[exitIdx];
    // Find path
    path = findPathBFS(maze, [playerRow, playerCol], [exitRow, exitCol]);
    if (path && path.length > minDist) break;
  }
  // 2. Place doors, chests, keys, defusers
  let doors = [], chests = [], chestContents = {}, keys = 0, defusers = 0;
  // Place 1-2 doors on the path (not start or exit)
  let doorCount = Math.min(2, Math.max(1, Math.floor(path.length / 8)));
  let doorIndices = [];
  while (doorIndices.length < doorCount) {
    let idx = Math.floor(Math.random() * (path.length - 2)) + 1;
    if (!doorIndices.includes(idx) && idx < path.length - 1) doorIndices.push(idx);
  }
  for (let idx of doorIndices) doors.push(path[idx]);
  // Place chests (1 per door + 1 for defuser)
  let chestIndices = [];
  while (chestIndices.length < doorCount + 1) {
    let idx = Math.floor(Math.random() * (path.length - 2)) + 1;
    if (!chestIndices.includes(idx) && !doorIndices.includes(idx)) chestIndices.push(idx);
  }
  for (let i = 0; i < chestIndices.length; i++) {
    let pos = path[chestIndices[i]];
    chests.push(pos);
    if (i < doorCount) {
      chestContents[pos.join(",")] = 'key';
      keys++;
    } else {
      chestContents[pos.join(",")] = 'defuser';
      defusers++;
    }
  }
  // 3. Place mines (not on path, not on chests, not on doors, not start/exit)
  let forbidden = new Set(path.map(([r, c]) => r + ',' + c));
  chests.forEach(([r, c]) => forbidden.add(r + ',' + c));
  doors.forEach(([r, c]) => forbidden.add(r + ',' + c));
  forbidden.add(playerRow + ',' + playerCol);
  forbidden.add(exitRow + ',' + exitCol);
  let mineCells = [];
  let availableForMines = openCells.filter(([r, c]) => !forbidden.has(r + ',' + c));
  for (let i = 0; i < mineCount && availableForMines.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableForMines.length);
    mineCells.push(availableForMines[idx]);
    availableForMines.splice(idx, 1);
  }
  // 4. Minesweeper cell state
  const cellState = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (maze[r][c] === 1) {
        cellState[r][c] = { revealed: false, flagged: false, mine: false, adjacentMines: 0, chest: false, door: false };
      } else {
        cellState[r][c] = { revealed: false, flagged: false, mine: mineCells.some(([mr, mc]) => mr === r && mc === c), adjacentMines: 0, chest: false, door: false };
      }
    }
  }
  // Mark chests and doors
  chests.forEach(([r, c]) => { cellState[r][c].chest = true; });
  doors.forEach(([r, c]) => { cellState[r][c].door = true; });
  // Fill adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (maze[r][c] === 0 && !cellState[r][c].mine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cellState[nr][nc] && cellState[nr][nc].mine) count++;
          }
        }
        cellState[r][c].adjacentMines = count;
      }
    }
  }
  // Reveal start cell and allow movement from there
  cellState[playerRow][playerCol].revealed = true;
  return {
    maze,
    cellState,
    player: { row: playerRow, col: playerCol },
    exit: { row: exitRow, col: exitCol },
    mines: mineCells,
    chests,
    chestContents,
    doors,
    rows,
    cols,
    gameOver: false,
    won: false,
    inventory: { keys: 0, defusers: 0 }
  };
}

function setMazeStatus(msg) {
  clearTimeout(mazeStatusTimeout);
  statusEl.textContent = msg;
  mazeStatusTimeout = setTimeout(() => updateMazeStatus(), 1500);
}

function revealMazeCell(state, row, col, useDefuser = false) {
  if (state.maze[row][col] === 1) return state; // wall
  if (state.cellState[row][col].revealed || state.cellState[row][col].flagged) return state;
  // Deep copy
  const cellState = state.cellState.map(rowArr => rowArr.map(cell => ({ ...cell })));
  let inventory = { ...state.inventory };
  let feedbacks = [];
  function openChest(r, c) {
    const content = state.chestContents[[r, c].join(",")];
    if (content === 'key') {
      inventory.keys = (inventory.keys || 0) + 1;
      cellState[r][c].justOpened = 'key';
      feedbacks.push('You found a key! 🗝️');
    }
    if (content === 'defuser') {
      inventory.defusers = (inventory.defusers || 0) + 1;
      cellState[r][c].justOpened = 'defuser';
      feedbacks.push('You found a bomb defuser! 🧯');
    }
    cellState[r][c].chest = false;
  }
  if (cellState[row][col].chest) {
    openChest(row, col);
  }
  if (cellState[row][col].door) {
    if (inventory.keys > 0) {
      inventory.keys--;
      cellState[row][col].justOpened = 'door';
      feedbacks.push('You unlocked a door! 🚪');
      cellState[row][col].door = false;
    } else {
      setMazeStatus('You need a key to unlock this door!');
      return { ...state, cellState, inventory };
    }
  }
  cellState[row][col].revealed = true;
  // If mine, game over or use defuser
  if (cellState[row][col].mine) {
    if (useDefuser && inventory.defusers > 0) {
      inventory.defusers--;
      cellState[row][col].mine = false;
      // Continue as if blank
    } else {
      // Reveal all bombs
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          if (cellState[r][c].mine) cellState[r][c].revealed = true;
        }
      }
      return { ...state, cellState, inventory, gameOver: true, won: false };
    }
  }
  // If blank, reveal adjacent blanks (flood fill)
  if (cellState[row][col].adjacentMines === 0) {
    const stack = [[row, col]];
    const visited = Array.from({ length: state.rows }, () => Array(state.cols).fill(false));
    visited[row][col] = true;
    while (stack.length) {
      const [r, c] = stack.pop();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols && state.maze[nr][nc] === 0 && !visited[nr][nc]) {
            visited[nr][nc] = true;
            if (!cellState[nr][nc].revealed && !cellState[nr][nc].mine && !cellState[nr][nc].flagged && !cellState[nr][nc].door) {
              cellState[nr][nc].revealed = true;
              // Open chest if present
              if (cellState[nr][nc].chest) {
                openChest(nr, nc);
              }
              if (cellState[nr][nc].adjacentMines === 0) stack.push([nr, nc]);
            }
          }
        }
      }
    }
  }
  // Show all feedbacks in sequence
  if (feedbacks.length > 0) {
    let i = 0;
    function showNextFeedback() {
      setMazeStatus(feedbacks[i]);
      i++;
      if (i < feedbacks.length) {
        setTimeout(showNextFeedback, 1500);
      } else {
        setTimeout(() => {
          // Clear justOpened for all cells
          for (let r = 0; r < state.rows; r++) for (let c = 0; c < state.cols; c++) cellState[r][c].justOpened = null;
          renderMazeMinesweeper({ ...state, cellState, inventory });
        }, 1500);
      }
    }
    showNextFeedback();
  }
  return { ...state, cellState, inventory };
}

function flagMazeCell(state, row, col) {
  if (state.maze[row][col] === 1) return state; // wall
  if (state.cellState[row][col].revealed) return state;
  const cellState = state.cellState.map(rowArr => rowArr.map(cell => ({ ...cell })));
  cellState[row][col].flagged = !cellState[row][col].flagged;
  return { ...state, cellState, inventory: { ...state.inventory } };
}

function renderMazeMinesweeper(state) {
  const { maze, cellState, player, exit, rows, cols, gameOver, won } = state;
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateRows = `repeat(${rows}, 32px)`;
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cellState[r][c];
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.tabIndex = 0;
      if (maze[r][c] === 1) {
        cellEl.style.background = '#444';
        cellEl.title = 'Wall';
      } else if (player.row === r && player.col === c) {
        cellEl.textContent = '🧑';
        cellEl.style.background = '#4caf50';
        cellEl.title = 'You';
      } else if (exit.row === r && exit.col === c) {
        cellEl.textContent = '🚪';
        cellEl.style.background = '#ffd700';
        cellEl.title = 'Exit';
      } else if (cell.justOpened === 'key') {
        cellEl.textContent = '🗝️';
        cellEl.title = 'Key';
      } else if (cell.justOpened === 'defuser') {
        cellEl.textContent = '🧯';
        cellEl.title = 'Bomb Defuser';
      } else if (cell.justOpened === 'door') {
        cellEl.textContent = '🚪';
        cellEl.title = 'Unlocked Door';
      } else if (cell.chest && !cell.revealed) {
        cellEl.textContent = '🎁';
        cellEl.title = 'Chest';
      } else if (cell.door && !cell.revealed) {
        cellEl.textContent = '🔒';
        cellEl.title = 'Locked Door';
      } else if (cell.revealed) {
        if (cell.mine) {
          cellEl.textContent = '💣';
          cellEl.style.background = '#f44336';
        } else if (cell.adjacentMines > 0) {
          cellEl.textContent = cell.adjacentMines;
        }
        cellEl.classList.add('revealed');
      } else if (cell.flagged) {
        cellEl.textContent = '🚩';
        cellEl.classList.add('flagged');
      } else if (gameOver && cell.mine) {
        // Show all mines when game is over
        cellEl.textContent = '💣';
        cellEl.style.background = '#f44336';
      } else {
        cellEl.textContent = '';
      }
      // Reveal/flag events
      cellEl.addEventListener('click', e => {
        if (gameOver || won) return;
        if (player.row === r && player.col === c) return; // can't reveal self
        mazeState = revealMazeCell(mazeState, r, c);
        if (mazeState.gameOver) updateMazeStatus();
        renderMazeMinesweeper(mazeState);
      });
      cellEl.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (gameOver || won) return;
        mazeState = flagMazeCell(mazeState, r, c);
        renderMazeMinesweeper(mazeState);
      });
      // Movement by click
      cellEl.addEventListener('dblclick', () => {
        if (gameOver || won) return;
        if (Math.abs(player.row - r) + Math.abs(player.col - c) === 1 && cell.revealed && !cell.mine && !cell.door) {
          moveMazePlayer(r, c);
        }
      });
      boardEl.appendChild(cellEl);
    }
  }
}

function moveMazePlayer(newRow, newCol) {
  if (!mazeState) return;
  const { cellState, exit } = mazeState;
  if (!cellState[newRow][newCol].revealed || cellState[newRow][newCol].mine || cellState[newRow][newCol].door) return;
  mazeState.player = { row: newRow, col: newCol };
  // Check for exit
  if (exit.row === newRow && exit.col === newCol) {
    mazeState.gameOver = true;
    mazeState.won = true;
    updateMazeStatus();
    renderMazeMinesweeper(mazeState);
    return;
  }
  renderMazeMinesweeper(mazeState);
}

function updateMazeStatus() {
  if (!mazeState) return;
  let inv = mazeState.inventory;
  statusEl.textContent =
    (mazeState.won ? '🎉 You escaped the maze!' : mazeState.gameOver ? '💥 You hit a mine!' : 'Navigate to the exit (🚪)') +
    ` | Keys: ${inv.keys || 0} 🗝️ | Defusers: ${inv.defusers || 0} 🧯`;
}

function handleMazeMinesweeperKey(e) {
  if (!mazeState || mazeState.gameOver || mazeState.won) return;
  const { player, cellState, rows, cols } = mazeState;
  let [dr, dc] = [0, 0];
  if (e.key === 'ArrowUp') dr = -1;
  else if (e.key === 'ArrowDown') dr = 1;
  else if (e.key === 'ArrowLeft') dc = -1;
  else if (e.key === 'ArrowRight') dc = 1;
  else if (e.key.toLowerCase() === 'd') {
    // Use defuser on adjacent mine
    for (const [ddr, ddc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nr = player.row + ddr, nc = player.col + ddc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cellState[nr][nc].mine && cellState[nr][nc].revealed === false && mazeState.inventory.defusers > 0) {
        mazeState = revealMazeCell(mazeState, nr, nc, true);
        renderMazeMinesweeper(mazeState);
        return;
      }
    }
    return;
  } else return;
  const nr = player.row + dr;
  const nc = player.col + dc;
  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cellState[nr][nc].revealed && !cellState[nr][nc].mine && !cellState[nr][nc].door) {
    moveMazePlayer(nr, nc);
  }
}

function resetMaze() {
  const config = getConfigFromDifficulty();
  mazeState = generateMazeMinesweeper(config.rows, config.cols, config.mines);
  renderMazeMinesweeper(mazeState);
  updateMazeStatus();
  timerEl.textContent = '';
  leaderboardEl.textContent = '';
}

// Mode switching logic
function updateMode() {
  if (modeEl.value === 'classic') {
    boardEl.style.display = '';
    resetGame();
    window.removeEventListener('keydown', handleMazeMinesweeperKey);
  } else if (modeEl.value === 'maze') {
    boardEl.style.display = '';
    resetMaze();
    window.addEventListener('keydown', handleMazeMinesweeperKey);
  }
}

modeEl.addEventListener('change', updateMode);

// Update reset button to handle both modes
resetBtn.addEventListener('click', () => {
  if (modeEl.value === 'classic') {
    resetGame();
  } else {
    resetMaze();
  }
});

difficultyEl.addEventListener('change', () => {
  if (modeEl.value === 'classic') {
    resetGame();
  } else {
    resetMaze();
  }
});

themeEl.addEventListener('change', () => {
  updateTheme();
});

// Initial setup
updateTheme();
updateMode(); 