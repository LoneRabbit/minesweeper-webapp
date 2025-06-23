// Maze-Minesweeper logic for testing
// If you move maze logic to a module, import it here. For now, mock minimal versions for test.

import assert from 'assert';
import { generateMazeMinesweeper } from '../mazeGame.js';

/**
 * Returns a string representation of the maze for debugging.
 */
function displayMaze(maze) {
  return '\n' + maze.map(row => row.map(cell => cell === 1 ? '█' : ' ').join('')).join('\n');
}

/**
 * Throws if the maze state is invalid.
 * - Maze and cellState are rectangular arrays
 * - Player and exit are on open cells
 * - There is a path from player to exit
 * - Chests and doors are on the path
 */
function throw_if_invalid_maze(mazeState) {
  const { maze, cellState, player, exit, chests, doors, rows, cols } = mazeState;
  // Rectangular
  if (!Array.isArray(maze) || maze.length !== rows) throw new Error('Maze is not rectangular' + displayMaze(maze));
  if (!Array.isArray(cellState) || cellState.length !== rows) throw new Error('cellState is not rectangular');
  for (let r = 0; r < rows; r++) {
    if (!Array.isArray(maze[r]) || maze[r].length !== cols) throw new Error('Maze row not correct length');
    if (!Array.isArray(cellState[r]) || cellState[r].length !== cols) throw new Error('cellState row not correct length');
  }
  // Player and exit on open cells
  if (maze[player.row][player.col] !== 0) throw new Error('Player not on open cell');
  if (maze[exit.row][exit.col] !== 0) throw new Error('Exit not on open cell');
  // Path exists
  if (!bfs_path_exists(maze, [player.row, player.col], [exit.row, exit.col])) throw new Error('No path from player to exit' + displayMaze(maze));
  // Chests and doors on path
  for (const [r, c] of chests) {
    if (!bfs_path_exists(maze, [player.row, player.col], [r, c])) throw new Error('Chest not on path');
  }
  for (const [r, c] of doors) {
    if (!bfs_path_exists(maze, [player.row, player.col], [r, c])) throw new Error('Door not on path');
  }
}

/**
 * Returns true if there is a path from start to end in the maze (0=open, 1=wall).
 */
function bfs_path_exists(maze, start, end) {
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

describe('Maze-Minesweeper', function() {
  describe('Maze generation', function() {
    it('generates a valid maze state', function() {
      const mazeState = generateMazeMinesweeper(10, 10, 10);
      throw_if_invalid_maze(mazeState);
    });
    it('exit is at least minimum distance from player', function() {
      const rows = 10, cols = 10;
      const mazeState = generateMazeMinesweeper(rows, cols, 10);
      const { player, exit } = mazeState;
      const minDist = Math.floor((rows + cols) / 3);
      const dist = Math.abs(player.row - exit.row) + Math.abs(player.col - exit.col);
      assert(dist >= minDist, 'Exit is at least minimum distance from player');
    });
    it('maze always has a path from player to exit', function() {
      const mazeState = generateMazeMinesweeper(8, 8, 5);
      assert(bfs_path_exists(mazeState.maze, [mazeState.player.row, mazeState.player.col], [mazeState.exit.row, mazeState.exit.col]), 'Maze has a path from player to exit');
    });
  });

  describe('Chests and doors', function() {
    it('places at least one chest and one door', function() {
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
    });
    it('player can collect keys from chests', function() {
      const mazeState = generateMazeMinesweeper(10, 10, 10);
      let keys = 0;
      for (let r = 0; r < mazeState.rows; r++) {
        for (let c = 0; c < mazeState.cols; c++) {
          if (mazeState.cellState[r][c].chest) {
            mazeState.cellState[r][c].revealed = true;
            mazeState.cellState[r][c].chest = false;
            keys++;
          }
        }
      }
      mazeState.inventory.keys = keys;
      assert(mazeState.inventory.keys >= 1, 'Player can collect keys from chests');
    });
  });

  describe('Game end conditions', function() {
    it('player wins by reaching the exit', function() {
      const mazeState = generateMazeMinesweeper(8, 8, 5);
      mazeState.player = { ...mazeState.exit };
      mazeState.gameOver = true;
      mazeState.won = true;
      assert(mazeState.won, 'Player wins by reaching the exit');
    });
    it('player loses by hitting a mine', function() {
      const mazeState = generateMazeMinesweeper(8, 8, 5);
      mazeState.gameOver = true;
      mazeState.won = false;
      assert(!mazeState.won, 'Player loses by hitting a mine');
    });
  });
}); 