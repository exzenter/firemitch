import { useEffect, useState, useCallback } from 'react'
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  increment,
  setDoc,
  getDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Board, Player, Cell, ROWS, COLS, WIN_LENGTH, deserializeBoard, serializeBoard, serializeWinningCells, deserializeWinningCells } from '../types/game'

// Firestore stores flat arrays, we convert to proper format for internal use
interface FirestoreGameData {
  players: { red: string; yellow: string }
  playerNames: { red: string; yellow: string }
  board: Cell[] // Flat array in Firestore
  currentPlayer: Player
  status: 'playing' | 'won' | 'draw' | 'abandoned'
  winner: Player | null
  winningCells: number[] // Flat array [row1, col1, row2, col2, ...]
}

interface OnlineGameState {
  players: { red: string; yellow: string }
  playerNames: { red: string; yellow: string }
  board: Board // 2D array for internal use
  currentPlayer: Player
  status: 'playing' | 'won' | 'draw' | 'abandoned'
  winner: Player | null
  winningCells: [number, number][]
}

interface UseOnlineGameResult {
  gameState: OnlineGameState | null
  loading: boolean
  error: string | null
  myColor: Player | null
  isMyTurn: boolean
  makeMove: (col: number) => Promise<boolean>
  leaveGame: () => Promise<void>
}

const checkWin = (
  board: Board,
  row: number,
  col: number,
  player: Player
): [number, number][] | null => {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
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
      } else break
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
      } else break
    }

    if (cells.length >= WIN_LENGTH) return cells
  }
  return null
}

export const useOnlineGame = (
  gameId: string | null,
  currentUid: string | undefined
): UseOnlineGameResult => {
  const [gameState, setGameState] = useState<OnlineGameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const myColor: Player | null = gameState
    ? gameState.players.red === currentUid
      ? 'red'
      : gameState.players.yellow === currentUid
        ? 'yellow'
        : null
    : null

  const isMyTurn = gameState?.currentPlayer === myColor && gameState?.status === 'playing'

  useEffect(() => {
    if (!gameId) {
      setLoading(false)
      return
    }

    const gameRef = doc(db, 'games', gameId)

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as FirestoreGameData
          // Convert flat arrays to proper format
          setGameState({
            ...data,
            board: deserializeBoard(data.board),
            winningCells: deserializeWinningCells(data.winningCells || []),
          })
        } else {
          setError('Spiel nicht gefunden')
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [gameId])

  const updateStats = async (
    odg: string,
    opponentId: string,
    opponentName: string,
    result: 'win' | 'loss' | 'draw'
  ) => {
    // Update user stats
    const userRef = doc(db, 'users', odg)
    const statField = result === 'win' ? 'stats.wins' : result === 'loss' ? 'stats.losses' : 'stats.draws'
    await updateDoc(userRef, {
      [statField]: increment(1),
    })

    // Update opponent history
    const historyRef = doc(db, 'userHistory', odg, 'opponents', opponentId)
    const historySnap = await getDoc(historyRef)
    
    const historyStatField = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws'
    
    if (historySnap.exists()) {
      await updateDoc(historyRef, {
        [historyStatField]: increment(1),
        lastPlayed: serverTimestamp(),
      })
    } else {
      await setDoc(historyRef, {
        opponentName,
        wins: result === 'win' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0,
        draws: result === 'draw' ? 1 : 0,
        lastPlayed: serverTimestamp(),
      })
    }
  }

  const makeMove = useCallback(async (col: number): Promise<boolean> => {
    if (!gameId || !gameState || !currentUid || !myColor) return false
    if (gameState.status !== 'playing') return false
    if (gameState.currentPlayer !== myColor) return false

    const { board } = gameState

    let targetRow = -1
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        targetRow = row
        break
      }
    }

    if (targetRow === -1) return false

    const newBoard = board.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex === targetRow && colIndex === col ? myColor : cell
      )
    )

    const gameRef = doc(db, 'games', gameId)

    const winningCells = checkWin(newBoard, targetRow, col, myColor)

    if (winningCells) {
      await updateDoc(gameRef, {
        board: serializeBoard(newBoard),
        winner: myColor,
        winningCells: serializeWinningCells(winningCells), // Serialize for Firestore
        status: 'won',
        updatedAt: serverTimestamp(),
      })

      // Update stats for both players
      const opponentColor = myColor === 'red' ? 'yellow' : 'red'
      const opponentId = gameState.players[opponentColor]
      const opponentName = gameState.playerNames[opponentColor]
      
      await updateStats(currentUid, opponentId, opponentName, 'win')
      await updateStats(opponentId, currentUid, gameState.playerNames[myColor], 'loss')
      
      return true
    }

    const isDraw = newBoard[0].every((cell) => cell !== null)

    if (isDraw) {
      await updateDoc(gameRef, {
        board: serializeBoard(newBoard), // Serialize for Firestore
        status: 'draw',
        updatedAt: serverTimestamp(),
      })

      const opponentColor = myColor === 'red' ? 'yellow' : 'red'
      const opponentId = gameState.players[opponentColor]
      const opponentName = gameState.playerNames[opponentColor]
      
      await updateStats(currentUid, opponentId, opponentName, 'draw')
      await updateStats(opponentId, currentUid, gameState.playerNames[myColor], 'draw')
      
      return true
    }

    await updateDoc(gameRef, {
      board: serializeBoard(newBoard), // Serialize for Firestore
      currentPlayer: myColor === 'red' ? 'yellow' : 'red',
      updatedAt: serverTimestamp(),
    })

    return true
  }, [gameId, gameState, currentUid, myColor])

  const leaveGame = useCallback(async () => {
    if (!gameId || !gameState || gameState.status !== 'playing') return

    const gameRef = doc(db, 'games', gameId)
    await updateDoc(gameRef, {
      status: 'abandoned',
      updatedAt: serverTimestamp(),
    })
  }, [gameId, gameState])

  return {
    gameState,
    loading,
    error,
    myColor,
    isMyTurn,
    makeMove,
    leaveGame,
  }
}
