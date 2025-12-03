// =============================================================================
// REACT KOMPONENTE - Cell (Spielfeld-Zelle)
// =============================================================================
// Eine React-Komponente ist eine Funktion die JSX zurückgibt.
// JSX ist eine Syntax-Erweiterung die HTML-ähnlichen Code in JavaScript erlaubt.

// CSSProperties ist ein TypeScript-Typ für inline CSS-Styles
import { CSSProperties, useState } from 'react'

// Importiere unseren Cell-Typ
import { Cell as CellType } from '../../types/game'

// -----------------------------------------------------------------------------
// PROPS INTERFACE
// -----------------------------------------------------------------------------
// Props sind die "Parameter" einer Komponente.
// Wie Funktionsparameter, aber für React-Komponenten.
// Sie werden von der Eltern-Komponente übergeben.

interface CellProps {
  value: CellType      // Der Wert der Zelle (red, yellow oder null)
  isWinning: boolean   // Ist diese Zelle Teil der Gewinnlinie?
  onClick: () => void  // Callback-Funktion wenn geklickt wird
  disabled: boolean    // Ist die Zelle deaktiviert?
}

// -----------------------------------------------------------------------------
// DIE KOMPONENTE
// -----------------------------------------------------------------------------
// React Komponenten sind Funktionen die JSX zurückgeben.
// 
// DESTRUCTURING IN PARAMETERN:
// ({ value, isWinning, onClick, disabled }: CellProps)
// Das ist das gleiche wie:
// (props: CellProps) => { const { value, isWinning, onClick, disabled } = props; ... }

export const Cell = ({ value, isWinning, onClick, disabled }: CellProps) => {
  // ---------------------------------------------------------------------------
  // LOKALER STATE MIT useState
  // ---------------------------------------------------------------------------
  // useState für den Hover-Effekt
  // Dieser State gehört nur zu dieser einen Zelle
  const [isHovered, setIsHovered] = useState(false)

  // ---------------------------------------------------------------------------
  // HILFSFUNKTION
  // ---------------------------------------------------------------------------
  // Normale JavaScript-Funktion innerhalb der Komponente
  const getCellColor = (): string => {
    if (!value) return 'transparent'  // Leere Zelle
    return value === 'red' ? '#f5222d' : '#fadb14'  // Rot oder Gelb
  }

  // ---------------------------------------------------------------------------
  // INLINE STYLES MIT TYPESCRIPT
  // ---------------------------------------------------------------------------
  // CSSProperties ist ein TypeScript-Typ der alle gültigen CSS-Eigenschaften enthält
  // So bekommen wir Autovervollständigung und Typsicherheit für CSS!
  
  const cellStyle: CSSProperties = {
    width: '52px',
    height: '52px',
    borderRadius: '50%',  // Macht es rund
    
    // Template Literal mit Funktion: `${ausdruck}`
    background: value
      ? `radial-gradient(circle at 30% 30%, ${getCellColor()}, ${value === 'red' ? '#a8071a' : '#d48806'})`
      : 'rgba(15, 15, 26, 0.8)',
    
    // Komplexer ternärer Ausdruck für boxShadow
    boxShadow: value
      ? isWinning
        ? `0 0 20px ${getCellColor()}, 0 0 40px ${getCellColor()}, inset 0 -4px 8px rgba(0, 0, 0, 0.3)`
        : `inset 0 -4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)`
      : 'inset 0 4px 8px rgba(0, 0, 0, 0.4)',
    
    // Bedingter Cursor
    cursor: disabled ? 'default' : 'pointer',
    
    transition: 'transform 0.2s ease, box-shadow 0.3s ease',
    
    // Komplexe Bedingung für transform
    transform: isHovered && !disabled && !value ? 'scale(1.05)' : 'scale(1)',
    
    border: isWinning ? `3px solid ${getCellColor()}` : '2px solid rgba(30, 58, 95, 0.6)',
    position: 'relative',
    overflow: 'hidden',
  }

  // Highlight-Effekt oben links auf dem Spielstein
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
    pointerEvents: 'none',  // Klicks durchlassen
  }

  // ---------------------------------------------------------------------------
  // JSX RETURN
  // ---------------------------------------------------------------------------
  // JSX ist wie HTML, aber mit JavaScript-Superkräften:
  // - Attribute in camelCase (onClick statt onclick)
  // - JavaScript-Ausdrücke in geschweiften Klammern {}
  // - className statt class (weil class ein JS-Keyword ist)
  
  return (
    <div
      style={cellStyle}
      
      // EVENT HANDLER
      // onClick erwartet eine Funktion, nicht einen Funktionsaufruf!
      // Falsch: onClick={disabled ? undefined : onClick()}  <- ruft sofort auf!
      // Richtig: onClick={disabled ? undefined : onClick}   <- übergibt Referenz
      onClick={disabled ? undefined : onClick}
      
      // onMouseEnter/Leave für Hover-Effekt
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      
      // CONDITIONAL CLASSNAME
      // className kann undefined sein, dann wird kein class-Attribut gesetzt
      className={value ? 'animate-drop' : undefined}
      
      // DATA ATTRIBUTES für Testing
      // data-* Attribute sind für custom Daten gedacht
      data-testid={`cell`}
      data-value={value || 'empty'}
      data-winning={isWinning}
    >
      {/* VERSCHACHTELTE JSX-ELEMENTE */}
      {/* Das ist ein Kind-Element (child) */}
      <div style={innerHighlight} />
    </div>
  )
}
