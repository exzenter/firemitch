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

interface GameStore {
  board: Board
  currentPlayer: Player
  winner: Player | null
  winningCells: [number, number][]
  status: GameStatus
  
  // Actions
  dropPiece: (col: number) => boolean
  resetGame: () => void
  checkWin: (row: number, col: number, player: Player) => [number, number][] | null
  checkDraw: () => boolean
}

export const useGameStore = create<GameStore>((set, get) => ({
  board: createEmptyBoard(),
  currentPlayer: 'red',
  winner: null,
  winningCells: [],
  status: 'playing',
  
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
      set({
        board: newBoard,
        winner: currentPlayer,
        winningCells,
        status: 'won',
      })
      return true
    }
    
    // Check for draw
    const isDraw = newBoard[0].every(cell => cell !== null)
    
    if (isDraw) {
      set({
        board: newBoard,
        status: 'draw',
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
  
  checkDraw: () => {
    const { board } = get()
    return board[0].every(cell => cell !== null)
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
}))

