import { useGameStore } from '../stores/gameStore'
import { Cell } from './Cell'
import { ROWS, COLS } from '../types/game'

export const Board = () => {
  const { board, dropPiece, status, winningCells, currentPlayer } = useGameStore()

  const handleColumnClick = (col: number) => {
    if (status !== 'playing') return
    dropPiece(col)
  }

  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col)
  }

  const isColumnFull = (col: number) => {
    return board[0][col] !== null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        background: 'linear-gradient(145deg, #1e3a5f 0%, #0d2137 100%)',
        borderRadius: '12px',
        boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Column hover indicators */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '4px',
        }}
      >
        {Array.from({ length: COLS }).map((_, col) => (
          <div
            key={`indicator-${col}`}
            onClick={() => handleColumnClick(col)}
            style={{
              width: '52px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: status === 'playing' && !isColumnFull(col) ? 'pointer' : 'not-allowed',
              opacity: status === 'playing' && !isColumnFull(col) ? 1 : 0.3,
            }}
          >
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: `12px solid ${currentPlayer === 'red' ? '#f5222d' : '#fadb14'}`,
                opacity: status === 'playing' && !isColumnFull(col) ? 0.6 : 0,
                transition: 'opacity 0.2s ease',
              }}
            />
          </div>
        ))}
      </div>

      {/* Game board */}
      {Array.from({ length: ROWS }).map((_, row) => (
        <div
          key={`row-${row}`}
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
          }}
        >
          {Array.from({ length: COLS }).map((_, col) => (
            <Cell
              key={`cell-${row}-${col}`}
              value={board[row][col]}
              isWinning={isWinningCell(row, col)}
              onClick={() => handleColumnClick(col)}
              disabled={status !== 'playing' || isColumnFull(col)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

