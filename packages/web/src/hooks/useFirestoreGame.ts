import { useEffect, useState } from 'react'
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Board, Player, GameStatus, createEmptyBoard, ROWS, COLS, WIN_LENGTH } from '../types/game'

interface FirestoreGameState {
  board: Board
  currentPlayer: Player
  winner: Player | null
  winningCells: [number, number][]
  status: GameStatus
  players: {
    red: string | null
    yellow: string | null
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface UseFirestoreGameResult {
  gameState: FirestoreGameState | null
  loading: boolean
  error: Error | null
  createGame: () => Promise<string>
  joinGame: (gameId: string, playerId: string) => Promise<void>
  makeMove: (gameId: string, col: number, playerId: string) => Promise<boolean>
}

const checkWin = (
  board: Board, 
  row: number, 
  col: number, 
  player: Player
): [number, number][] | null => {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
  ]
  
  for (const [dRow, dCol] of directions) {
    const cells: [number, number][] = [[row, col]]
    
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
}

export const useFirestoreGame = (gameId?: string): UseFirestoreGameResult => {
  const [gameState, setGameState] = useState<FirestoreGameState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!gameId) return

    setLoading(true)
    const gameRef = doc(db, 'games', gameId)
    
    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setGameState(snapshot.data() as FirestoreGameState)
        } else {
          setGameState(null)
        }
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [gameId])

  const createGame = async (): Promise<string> => {
    const gamesRef = collection(db, 'games')
    const newGameRef = doc(gamesRef)
    
    const initialState: Omit<FirestoreGameState, 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>
      updatedAt: ReturnType<typeof serverTimestamp>
    } = {
      board: createEmptyBoard(),
      currentPlayer: 'red',
      winner: null,
      winningCells: [],
      status: 'waiting',
      players: {
        red: null,
        yellow: null,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    await setDoc(newGameRef, initialState)
    return newGameRef.id
  }

  const joinGame = async (gameId: string, playerId: string): Promise<void> => {
    const gameRef = doc(db, 'games', gameId)
    
    // This would typically check which slot is available
    // For simplicity, we just update - in production you'd use a transaction
    await updateDoc(gameRef, {
      'players.red': playerId,
      updatedAt: serverTimestamp(),
    })
  }

  const makeMove = async (
    gameId: string, 
    col: number, 
    _playerId: string
  ): Promise<boolean> => {
    if (!gameState || gameState.status !== 'playing') return false
    
    const { board, currentPlayer } = gameState
    
    // Find the lowest empty row
    let targetRow = -1
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        targetRow = row
        break
      }
    }
    
    if (targetRow === -1) return false
    
    // Create new board
    const newBoard = board.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex === targetRow && colIndex === col ? currentPlayer : cell
      )
    )
    
    const gameRef = doc(db, 'games', gameId)
    
    // Check for win
    const winningCells = checkWin(newBoard, targetRow, col, currentPlayer)
    
    if (winningCells) {
      await updateDoc(gameRef, {
        board: newBoard,
        winner: currentPlayer,
        winningCells,
        status: 'won',
        updatedAt: serverTimestamp(),
      })
      return true
    }
    
    // Check for draw
    const isDraw = newBoard[0].every(cell => cell !== null)
    
    if (isDraw) {
      await updateDoc(gameRef, {
        board: newBoard,
        status: 'draw',
        updatedAt: serverTimestamp(),
      })
      return true
    }
    
    // Continue game
    await updateDoc(gameRef, {
      board: newBoard,
      currentPlayer: currentPlayer === 'red' ? 'yellow' : 'red',
      updatedAt: serverTimestamp(),
    })
    
    return true
  }

  return {
    gameState,
    loading,
    error,
    createGame,
    joinGame,
    makeMove,
  }
}

