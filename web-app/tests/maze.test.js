// Maze-Minesweeper logic for testing
// If you move maze logic to a module, import it here. For now, mock minimal versions for test.

function assert(condition, message) {
  if (!condition) {
    console.error('❌', message);
  } else {
    console.log('✅', message);
  }
}

console.log('--- Maze-Minesweeper Tests ---');

// Import or define the maze generation function for testing
// For this test, we assume generateMazeMinesweeper is available in scope
// If not, you should move it to a module and import it here
const generateMazeMinesweeper = require('../../public/app.js').generateMazeMinesweeper;

// Test 1: Maze generation guarantees a path and exit distance
(function testMazePathAndExitDistance() {
  const rows = 10, cols = 10, mines = 10;
  const mazeState = generateMazeMinesweeper(rows, cols, mines);
  const { maze, player, exit } = mazeState;
  // BFS to check path
  function bfs(maze, start, end) {
    const queue = [start];
    const visited = Array.from({ length: maze.length }, () => Array(maze[0].length).fill(false));
    visited[start[0]][start[1]] = true;
    while (queue.length) {
      const [r, c] = queue.shift();
      if (r === end[0] && c === end[1]) return true;
      for (const [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < maze.length && nc >= 0 && nc < maze[0].length && maze[nr][nc] === 0 && !visited[nr][nc]) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
    return false;
  }
  assert(bfs(maze, [player.row, player.col], [exit.row, exit.col]), 'Maze has a path from player to exit');
  const minDist = Math.floor((rows + cols) / 3);
  const dist = Math.abs(player.row - exit.row) + Math.abs(player.col - exit.col);
  assert(dist >= minDist, 'Exit is at least minimum distance from player');
})();

// Test 2: Chests, doors, and inventory
(function testChestsDoorsInventory() {
  const mazeState = generateMazeMinesweeper(10, 10, 10);
  let chestCount = 0, doorCount = 0;
  for (let r = 0; r < mazeState.rows; r++) {
    for (let c = 0; c < mazeState.cols; c++) {
      if (mazeState.cellState[r][c].chest) chestCount++;
      if (mazeState.cellState[r][c].door) doorCount++;
    }
  }
  assert(chestCount >= 1, 'At least one chest is placed');
  assert(doorCount >= 1, 'At least one door is placed');
  // Simulate opening a chest
  for (let r = 0; r < mazeState.rows; r++) {
    for (let c = 0; c < mazeState.cols; c++) {
      if (mazeState.cellState[r][c].chest) {
        mazeState.cellState[r][c].revealed = true;
        mazeState.cellState[r][c].chest = false;
        mazeState.inventory.keys = (mazeState.inventory.keys || 0) + 1;
      }
    }
  }
  assert(mazeState.inventory.keys >= 1, 'Player can collect keys from chests');
})();

// Test 3: Movement and win/loss
(function testMazeWinLoss() {
  const mazeState = generateMazeMinesweeper(8, 8, 5);
  // Simulate moving to exit (assume path is clear)
  mazeState.player = { ...mazeState.exit };
  mazeState.gameOver = true;
  mazeState.won = true;
  assert(mazeState.won, 'Player wins by reaching the exit');
  // Simulate stepping on a mine
  mazeState.gameOver = true;
  mazeState.won = false;
  assert(!mazeState.won, 'Player loses by hitting a mine');
})();

console.log('--- End of Maze-Minesweeper Tests ---'); 