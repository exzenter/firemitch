// =============================================================================
// REACT KOMPONENTE - Board (Spielbrett)
// =============================================================================
// Das Spielbrett zeigt alle Zellen an und verarbeitet Klicks.
// Es verwendet den globalen Zustand Store um auf Spieldaten zuzugreifen.

import { useGameStore } from '../../stores/gameStore'
import { Cell } from './Cell'
import { ROWS, COLS } from '../../types/game'

// -----------------------------------------------------------------------------
// DIE KOMPONENTE
// -----------------------------------------------------------------------------
// Diese Komponente hat keine Props - sie holt sich alles aus dem Store

export const Board = () => {
  // ---------------------------------------------------------------------------
  // ZUSTAND STORE VERWENDEN
  // ---------------------------------------------------------------------------
  // useGameStore ist ein Hook der uns Zugriff auf den globalen State gibt.
  // Wir destructuren nur die Werte die wir brauchen.
  // 
  // WICHTIG: Wenn sich einer dieser Werte ändert, re-rendert die Komponente!
  // Zustand ist "reactive" - es beobachtet welche Werte verwendet werden.
  
  const { board, dropPiece, status, winningCells, currentPlayer } = useGameStore()

  // ---------------------------------------------------------------------------
  // EVENT HANDLER FUNKTION
  // ---------------------------------------------------------------------------
  // Diese Funktion wird aufgerufen wenn eine Spalte angeklickt wird.
  // Parameter: col ist die Spalten-Nummer (0-6)
  
  const handleColumnClick = (col: number) => {
    // Guard Clause: Früh abbrechen wenn Spiel nicht läuft
    if (status !== 'playing') return
    
    // dropPiece kommt aus dem Store und aktualisiert den State
    dropPiece(col)
  }

  // ---------------------------------------------------------------------------
  // HILFSFUNKTIONEN
  // ---------------------------------------------------------------------------
  
  // Prüft ob eine Zelle Teil der Gewinnlinie ist
  // .some() gibt true zurück wenn MINDESTENS ein Element die Bedingung erfüllt
  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col)
  }

  // Prüft ob eine Spalte voll ist
  // board[0] ist die oberste Reihe
  const isColumnFull = (col: number) => {
    return board[0][col] !== null
  }

  // ---------------------------------------------------------------------------
  // JSX / RENDERING
  // ---------------------------------------------------------------------------
  
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
      {/* --------------------------------------------------------------------- */}
      {/* SPALTEN-INDIKATOREN (Pfeile oben) */}
      {/* --------------------------------------------------------------------- */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '4px',
        }}
      >
        {/* 
          Array.from() erstellt ein Array aus einem Array-ähnlichen Objekt.
          { length: COLS } ist ein Objekt mit einer length-Eigenschaft.
          Das Ergebnis ist ein Array mit COLS (7) undefined Elementen.
          
          .map() transformiert jedes Element.
          Der erste Parameter (_) ist das Element (wir brauchen es nicht, daher _)
          Der zweite Parameter (col) ist der Index.
        */}
        {Array.from({ length: COLS }).map((_, col) => (
          <div
            // KEY PROP - WICHTIG FÜR REACT!
            // Bei Listen muss jedes Element einen eindeutigen key haben.
            // React verwendet den key um zu wissen welche Elemente sich geändert haben.
            key={`indicator-${col}`}
            
            onClick={() => handleColumnClick(col)}
            
            style={{
              width: '52px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              
              // Bedingter Cursor
              cursor: status === 'playing' && !isColumnFull(col) ? 'pointer' : 'not-allowed',
              
              // Bedingte Opacity
              opacity: status === 'playing' && !isColumnFull(col) ? 1 : 0.3,
            }}
          >
            {/* Pfeil-Indikator (CSS Triangle) */}
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                
                // Template Literal für dynamische Farbe
                borderTop: `12px solid ${currentPlayer === 'red' ? '#f5222d' : '#fadb14'}`,
                
                opacity: status === 'playing' && !isColumnFull(col) ? 0.6 : 0,
                transition: 'opacity 0.2s ease',
              }}
            />
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* DAS SPIELBRETT (6 Reihen x 7 Spalten) */}
      {/* --------------------------------------------------------------------- */}
      {/* 
        Verschachtelte .map() für 2D-Rendering:
        Äußere map für Reihen, innere map für Spalten
      */}
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
            // KOMPONENTEN-VERWENDUNG
            // <Cell /> ist unsere Cell-Komponente
            // Die Props werden wie HTML-Attribute übergeben
            <Cell
              key={`cell-${row}-${col}`}
              
              // board[row][col] holt den Wert aus dem 2D-Array
              value={board[row][col]}
              
              isWinning={isWinningCell(row, col)}
              
              // Arrow Function als onClick Handler
              // () => handleColumnClick(col) erstellt eine neue Funktion
              // die col "einschließt" (Closure)
              onClick={() => handleColumnClick(col)}
              
              // Mehrere Bedingungen mit ||
              disabled={status !== 'playing' || isColumnFull(col)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
