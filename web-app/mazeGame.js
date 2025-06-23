/**
 * Maze-Minesweeper logic module.
 * Provides pure functions to generate and manipulate a maze-based Minesweeper game state, including pathfinding, chests, doors, keys, and defusers.
 * All functions are pure and do not mutate their arguments.
 *
 * @module mazeGame
 */
// Maze-Minesweeper logic for use in both app and tests

export function findPathBFS(maze, start, end) {
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

export function generateMazeMinesweeper(rows, cols, mineCount) {
  let maze, openCells, playerRow, playerCol, exitRow, exitCol, path;
  let minDist = Math.floor((rows + cols) / 3);
  while (true) {
    maze = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (Math.random() < 0.25) maze[r][c] = 1;
    openCells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (maze[r][c] === 0) openCells.push([r, c]);
    if (openCells.length < 2) continue;
    const startIdx = Math.floor(Math.random() * openCells.length);
    [playerRow, playerCol] = openCells[startIdx];
    let farCells = openCells.filter(([r, c]) => Math.abs(r - playerRow) + Math.abs(c - playerCol) >= minDist);
    if (farCells.length === 0) continue;
    const exitIdx = Math.floor(Math.random() * farCells.length);
    [exitRow, exitCol] = farCells[exitIdx];
    path = findPathBFS(maze, [playerRow, playerCol], [exitRow, exitCol]);
    if (path && path.length > minDist) break;
  }
  let doors = [], chests = [], chestContents = {}, keys = 0, defusers = 0;
  let doorCount = Math.min(2, Math.max(1, Math.floor(path.length / 8)));
  let doorIndices = [];
  while (doorIndices.length < doorCount) {
    let idx = Math.floor(Math.random() * (path.length - 2)) + 1;
    if (!doorIndices.includes(idx) && idx < path.length - 1) doorIndices.push(idx);
  }
  for (let idx of doorIndices) doors.push(path[idx]);
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
  chests.forEach(([r, c]) => { cellState[r][c].chest = true; });
  doors.forEach(([r, c]) => { cellState[r][c].door = true; });
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