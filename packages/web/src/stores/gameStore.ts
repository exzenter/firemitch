import { create } from 'zustand'
import { 
  Board, 
  Player, 
  GameStatus, 
  createEmptyBoard, 
  ROWS, 
  COLS, 
  WIN_LENGTH 
} from '../types/game'

interface PlayerInfo {
  red: string
  yellow: string
}

interface SessionStats {
  red: number
  yellow: number
  draws: number
}

interface GameStore {
  board: Board
  currentPlayer: Player
  winner: Player | null
  winningCells: [number, number][]
  status: GameStatus
  players: PlayerInfo
  stats: SessionStats
  gameStarted: boolean
  
  // Actions
  setPlayers: (redName: string, yellowName: string) => void
  startGame: () => void
  dropPiece: (col: number) => boolean
  resetGame: () => void
  resetSession: () => void
  checkWin: (row: number, col: number, player: Player) => [number, number][] | null
}

export const useGameStore = create<GameStore>((set, get) => ({
  board: createEmptyBoard(),
  currentPlayer: 'red',
  winner: null,
  winningCells: [],
  status: 'waiting',
  players: { red: '', yellow: '' },
  stats: { red: 0, yellow: 0, draws: 0 },
  gameStarted: false,
  
  setPlayers: (redName: string, yellowName: string) => {
    set({
      players: { red: redName, yellow: yellowName },
    })
  },
  
  startGame: () => {
    set({
      gameStarted: true,
      status: 'playing',
      board: createEmptyBoard(),
      currentPlayer: 'red',
      winner: null,
      winningCells: [],
    })
  },
  
  dropPiece: (col: number) => {
    const { board, currentPlayer, status } = get()
    
    if (status !== 'playing') return false
    
    // Find the lowest empty row in the column
    let targetRow = -1
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        targetRow = row
        break
      }
    }
    
    if (targetRow === -1) return false // Column is full
    
    // Create new board with the piece
    const newBoard = board.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex === targetRow && colIndex === col ? currentPlayer : cell
      )
    )
    
    // Check for win
    const winningCells = get().checkWin(targetRow, col, currentPlayer)
    
    if (winningCells) {
      const { stats } = get()
      set({
        board: newBoard,
        winner: currentPlayer,
        winningCells,
        status: 'won',
        stats: {
          ...stats,
          [currentPlayer]: stats[currentPlayer] + 1,
        },
      })
      return true
    }
    
    // Check for draw
    const isDraw = newBoard[0].every(cell => cell !== null)
    
    if (isDraw) {
      const { stats } = get()
      set({
        board: newBoard,
        status: 'draw',
        stats: {
          ...stats,
          draws: stats.draws + 1,
        },
      })
      return true
    }
    
    // Continue game
    set({
      board: newBoard,
      currentPlayer: currentPlayer === 'red' ? 'yellow' : 'red',
    })
    
    return true
  },
  
  checkWin: (row: number, col: number, player: Player) => {
    const { board } = get()
    
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1],  // diagonal down-left
    ]
    
    for (const [dRow, dCol] of directions) {
      const cells: [number, number][] = [[row, col]]
      
      // Check in positive direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row + dRow * i
        const newCol = col + dCol * i
        
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          board[newRow][newCol] === player
        ) {
          cells.push([newRow, newCol])
        } else {
          break
        }
      }
      
      // Check in negative direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row - dRow * i
        const newCol = col - dCol * i
        
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          board[newRow][newCol] === player
        ) {
          cells.push([newRow, newCol])
        } else {
          break
        }
      }
      
      if (cells.length >= WIN_LENGTH) {
        return cells
      }
    }
    
    return null
  },
  
  resetGame: () => {
    set({
      board: createEmptyBoard(),
      currentPlayer: 'red',
      winner: null,
      winningCells: [],
      status: 'playing',
    })
  },
  
  resetSession: () => {
    set({
      board: createEmptyBoard(),
      currentPlayer: 'red',
      winner: null,
      winningCells: [],
      status: 'waiting',
      players: { red: '', yellow: '' },
      stats: { red: 0, yellow: 0, draws: 0 },
      gameStarted: false,
    })
  },
}))
