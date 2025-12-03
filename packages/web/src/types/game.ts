export type Player = 'red' | 'yellow'
export type Cell = Player | null
export type Board = Cell[][]

export type GameStatus = 'waiting' | 'playing' | 'won' | 'draw'

export interface GameState {
  id: string
  board: Board
  currentPlayer: Player
  winner: Player | null
  winningCells: [number, number][]
  status: GameStatus
  players: {
    red: string | null
    yellow: string | null
  }
  createdAt: Date
  updatedAt: Date
}

export const ROWS = 6
export const COLS = 7
export const WIN_LENGTH = 4

export const createEmptyBoard = (): Board => {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(null))
}

// Firestore doesn't support nested arrays, so we flatten the board
export const serializeBoard = (board: Board): Cell[] => {
  return board.flat()
}

export const deserializeBoard = (flat: Cell[]): Board => {
  const board: Board = []
  for (let row = 0; row < ROWS; row++) {
    board.push(flat.slice(row * COLS, (row + 1) * COLS))
  }
  return board
}

export const createEmptyBoardFlat = (): Cell[] => {
  return Array(ROWS * COLS).fill(null)
}

// Serialize winningCells for Firestore (no nested arrays allowed)
export const serializeWinningCells = (cells: [number, number][]): number[] => {
  return cells.flatMap(([row, col]) => [row, col])
}

export const deserializeWinningCells = (flat: number[]): [number, number][] => {
  const cells: [number, number][] = []
  for (let i = 0; i < flat.length; i += 2) {
    cells.push([flat[i], flat[i + 1]])
  }
  return cells
}

