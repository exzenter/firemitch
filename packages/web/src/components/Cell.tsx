import { CSSProperties, useState } from 'react'
import { Cell as CellType } from '../types/game'

interface CellProps {
  value: CellType
  isWinning: boolean
  onClick: () => void
  disabled: boolean
}

export const Cell = ({ value, isWinning, onClick, disabled }: CellProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const getCellColor = (): string => {
    if (!value) return 'transparent'
    return value === 'red' ? '#f5222d' : '#fadb14'
  }

  const cellStyle: CSSProperties = {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: value
      ? `radial-gradient(circle at 30% 30%, ${getCellColor()}, ${value === 'red' ? '#a8071a' : '#d48806'})`
      : 'rgba(15, 15, 26, 0.8)',
    boxShadow: value
      ? isWinning
        ? `0 0 20px ${getCellColor()}, 0 0 40px ${getCellColor()}, inset 0 -4px 8px rgba(0, 0, 0, 0.3)`
        : `inset 0 -4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)`
      : 'inset 0 4px 8px rgba(0, 0, 0, 0.4)',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.3s ease',
    transform: isHovered && !disabled && !value ? 'scale(1.05)' : 'scale(1)',
    border: isWinning ? `3px solid ${getCellColor()}` : '2px solid rgba(30, 58, 95, 0.6)',
    position: 'relative',
    overflow: 'hidden',
  }

  const innerHighlight: CSSProperties = {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '30%',
    height: '30%',
    borderRadius: '50%',
    background: value
      ? 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)'
      : 'none',
    pointerEvents: 'none',
  }

  return (
    <div
      style={cellStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={value ? 'animate-drop' : undefined}
      data-testid={`cell`}
      data-value={value || 'empty'}
      data-winning={isWinning}
    >
      <div style={innerHighlight} />
    </div>
  )
}

