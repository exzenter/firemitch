// =============================================================================
// KI-ENGINE - Minimax-Algorithmus mit Alpha-Beta-Pruning
// =============================================================================
// Diese Datei enthält die KI-Logik für 4 Gewinnt.
// Der Minimax-Algorithmus simuliert alle möglichen Züge und wählt den besten.
// Alpha-Beta-Pruning optimiert die Suche durch Abschneiden von Zweigen.

import { Board, Cell, Player, ROWS, COLS, WIN_LENGTH } from '../types/game'

// -----------------------------------------------------------------------------
// KONSTANTEN
// -----------------------------------------------------------------------------
// Suchtiefe für den Minimax-Algorithmus
// Höhere Werte = stärkere KI, aber langsamer
const MAX_DEPTH = 6

// Bewertungswerte
const WIN_SCORE = 100000
const LOSE_SCORE = -100000

// Spaltenpriorität: Mittlere Spalten sind strategisch wertvoller
// Index 0-6 für die 7 Spalten
const COLUMN_PRIORITY = [3, 2, 4, 1, 5, 0, 6]

// -----------------------------------------------------------------------------
// HILFSFUNKTIONEN
// -----------------------------------------------------------------------------

/**
 * Findet die unterste freie Reihe in einer Spalte
 * @returns Reihen-Index oder -1 wenn Spalte voll
 */
const getLowestEmptyRow = (board: Board, col: number): number => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row
    }
  }
  return -1
}

/**
 * Prüft ob eine Spalte noch freie Felder hat
 */
const isColumnValid = (board: Board, col: number): boolean => {
  return board[0][col] === null
}

/**
 * Gibt alle gültigen Spalten zurück, sortiert nach Priorität
 */
const getValidColumns = (board: Board): number[] => {
  return COLUMN_PRIORITY.filter(col => isColumnValid(board, col))
}

/**
 * Erstellt eine Kopie des Boards mit einem neuen Stein
 */
const makeMove = (board: Board, col: number, player: Player): Board => {
  const row = getLowestEmptyRow(board, col)
  if (row === -1) return board
  
  // Deep Copy des Boards
  const newBoard = board.map(r => [...r])
  newBoard[row][col] = player
  return newBoard
}

/**
 * Prüft ob ein Spieler gewonnen hat
 */
const checkWinner = (board: Board, player: Player): boolean => {
  // Horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
      if (
        board[row][col] === player &&
        board[row][col + 1] === player &&
        board[row][col + 2] === player &&
        board[row][col + 3] === player
      ) {
        return true
      }
    }
  }
  
  // Vertikal
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = 0; col < COLS; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col] === player &&
        board[row + 2][col] === player &&
        board[row + 3][col] === player
      ) {
        return true
      }
    }
  }
  
  // Diagonal (rechts-runter)
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col + 1] === player &&
        board[row + 2][col + 2] === player &&
        board[row + 3][col + 3] === player
      ) {
        return true
      }
    }
  }
  
  // Diagonal (links-runter)
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = WIN_LENGTH - 1; col < COLS; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col - 1] === player &&
        board[row + 2][col - 2] === player &&
        board[row + 3][col - 3] === player
      ) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Prüft ob das Board voll ist (Unentschieden)
 */
const isBoardFull = (board: Board): boolean => {
  return board[0].every(cell => cell !== null)
}

/**
 * Bewertet eine Fenster-Sequenz von 4 Zellen
 * Gibt einen Score basierend auf Spielerpräsenz
 */
const evaluateWindow = (window: Cell[], player: Player): number => {
  const opponent: Player = player === 'red' ? 'yellow' : 'red'
  
  const playerCount = window.filter(c => c === player).length
  const opponentCount = window.filter(c => c === opponent).length
  const emptyCount = window.filter(c => c === null).length
  
  // Gewinn-Situation
  if (playerCount === 4) return WIN_SCORE
  
  // Gegner-Gewinn (sehr schlecht)
  if (opponentCount === 4) return LOSE_SCORE
  
  // 3 eigene + 1 leer = fast gewonnen
  if (playerCount === 3 && emptyCount === 1) return 100
  
  // 2 eigene + 2 leer = gute Position
  if (playerCount === 2 && emptyCount === 2) return 10
  
  // 1 eigener + 3 leer = Anfang einer Linie
  if (playerCount === 1 && emptyCount === 3) return 1
  
  // Gegner blockieren ist auch wichtig
  if (opponentCount === 3 && emptyCount === 1) return 80
  if (opponentCount === 2 && emptyCount === 2) return 5
  
  return 0
}

/**
 * Bewertet das gesamte Board aus Sicht eines Spielers
 */
const evaluateBoard = (board: Board, player: Player): number => {
  let score = 0
  
  // Mittlere Spalte bevorzugen (strategisch wichtig)
  const centerCol = Math.floor(COLS / 2)
  const centerCount = board.filter(row => row[centerCol] === player).length
  score += centerCount * 6
  
  // Horizontal bewerten
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
      const window: Cell[] = [
        board[row][col],
        board[row][col + 1],
        board[row][col + 2],
        board[row][col + 3]
      ]
      score += evaluateWindow(window, player)
    }
  }
  
  // Vertikal bewerten
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = 0; col < COLS; col++) {
      const window: Cell[] = [
        board[row][col],
        board[row + 1][col],
        board[row + 2][col],
        board[row + 3][col]
      ]
      score += evaluateWindow(window, player)
    }
  }
  
  // Diagonal (rechts-runter) bewerten
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
      const window: Cell[] = [
        board[row][col],
        board[row + 1][col + 1],
        board[row + 2][col + 2],
        board[row + 3][col + 3]
      ]
      score += evaluateWindow(window, player)
    }
  }
  
  // Diagonal (links-runter) bewerten
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = WIN_LENGTH - 1; col < COLS; col++) {
      const window: Cell[] = [
        board[row][col],
        board[row + 1][col - 1],
        board[row + 2][col - 2],
        board[row + 3][col - 3]
      ]
      score += evaluateWindow(window, player)
    }
  }
  
  return score
}

// -----------------------------------------------------------------------------
// MINIMAX-ALGORITHMUS MIT ALPHA-BETA-PRUNING
// -----------------------------------------------------------------------------

/**
 * Minimax-Algorithmus mit Alpha-Beta-Pruning
 * @param board - Aktuelles Spielbrett
 * @param depth - Verbleibende Suchtiefe
 * @param alpha - Bester Wert für Maximierer
 * @param beta - Bester Wert für Minimierer
 * @param isMaximizing - Ist der aktuelle Spieler der Maximierer?
 * @param aiPlayer - Die Farbe der KI
 * @returns [score, bestColumn]
 */
const minimax = (
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): [number, number] => {
  const humanPlayer: Player = aiPlayer === 'yellow' ? 'red' : 'yellow'
  
  // Terminale Zustände prüfen
  if (checkWinner(board, aiPlayer)) {
    return [WIN_SCORE + depth, -1] // Früher Sieg ist besser
  }
  if (checkWinner(board, humanPlayer)) {
    return [LOSE_SCORE - depth, -1] // Spätere Niederlage ist besser
  }
  if (isBoardFull(board)) {
    return [0, -1] // Unentschieden
  }
  if (depth === 0) {
    return [evaluateBoard(board, aiPlayer), -1]
  }
  
  const validColumns = getValidColumns(board)
  
  if (isMaximizing) {
    // KI am Zug - maximiere Score
    let maxScore = -Infinity
    let bestCol = validColumns[0]
    
    for (const col of validColumns) {
      const newBoard = makeMove(board, col, aiPlayer)
      const [score] = minimax(newBoard, depth - 1, alpha, beta, false, aiPlayer)
      
      if (score > maxScore) {
        maxScore = score
        bestCol = col
      }
      
      alpha = Math.max(alpha, score)
      if (beta <= alpha) {
        break // Beta-Cutoff
      }
    }
    
    return [maxScore, bestCol]
  } else {
    // Mensch am Zug - minimiere Score
    let minScore = Infinity
    let bestCol = validColumns[0]
    
    for (const col of validColumns) {
      const newBoard = makeMove(board, col, humanPlayer)
      const [score] = minimax(newBoard, depth - 1, alpha, beta, true, aiPlayer)
      
      if (score < minScore) {
        minScore = score
        bestCol = col
      }
      
      beta = Math.min(beta, score)
      if (beta <= alpha) {
        break // Alpha-Cutoff
      }
    }
    
    return [minScore, bestCol]
  }
}

// -----------------------------------------------------------------------------
// ÖFFENTLICHE API
// -----------------------------------------------------------------------------

/**
 * Findet den besten Zug für die KI
 * @param board - Aktuelles Spielbrett
 * @param aiPlayer - Die Farbe der KI (standardmäßig 'yellow')
 * @returns Spalten-Index für den besten Zug
 */
export const findBestMove = (board: Board, aiPlayer: Player = 'yellow'): number => {
  // Schnellcheck: Kann KI sofort gewinnen?
  const validColumns = getValidColumns(board)
  
  for (const col of validColumns) {
    const newBoard = makeMove(board, col, aiPlayer)
    if (checkWinner(newBoard, aiPlayer)) {
      return col // Sofort gewinnen!
    }
  }
  
  // Schnellcheck: Muss KI blockieren?
  const humanPlayer: Player = aiPlayer === 'yellow' ? 'red' : 'yellow'
  for (const col of validColumns) {
    const newBoard = makeMove(board, col, humanPlayer)
    if (checkWinner(newBoard, humanPlayer)) {
      return col // Gegner blockieren!
    }
  }
  
  // Minimax für den besten strategischen Zug
  const [, bestCol] = minimax(board, MAX_DEPTH, -Infinity, Infinity, true, aiPlayer)
  
  return bestCol
}

/**
 * Macht einen KI-Zug mit kleiner Verzögerung für bessere UX
 * @param board - Aktuelles Spielbrett
 * @param aiPlayer - Die Farbe der KI
 * @param delay - Verzögerung in Millisekunden
 * @returns Promise mit dem Spalten-Index
 */
export const makeAIMove = async (
  board: Board,
  aiPlayer: Player = 'yellow',
  delay: number = 500
): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const col = findBestMove(board, aiPlayer)
      resolve(col)
    }, delay)
  })
}

