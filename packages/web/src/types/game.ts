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

