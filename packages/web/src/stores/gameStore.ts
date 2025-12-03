// =============================================================================
// ZUSTAND STORE - GLOBALER STATE MANAGEMENT
// =============================================================================
// Zustand ist eine leichtgewichtige State-Management-Bibliothek für React.
// Anders als Redux braucht Zustand weniger Boilerplate-Code.
// 
// KONZEPT: Ein "Store" ist ein zentraler Ort für Daten, die von mehreren
// Komponenten geteilt werden müssen. Ohne Store müssten wir Daten durch
// viele Komponenten-Ebenen durchreichen ("Prop Drilling").

import { create } from 'zustand'  // Die Hauptfunktion von Zustand
import { 
  Board, 
  Cell,
  Player, 
  GameStatus, 
  createEmptyBoard, 
  ROWS, 
  COLS, 
  WIN_LENGTH 
} from '../types/game'

// -----------------------------------------------------------------------------
// INTERFACE FÜR SPIELER-INFO
// -----------------------------------------------------------------------------
// TypeScript Interface für die Struktur der Spieler-Namen
interface PlayerInfo {
  red: string
  yellow: string
}

// Interface für die Session-Statistik
interface SessionStats {
  red: number      // Siege von Rot
  yellow: number   // Siege von Gelb
  draws: number    // Unentschieden
}

// -----------------------------------------------------------------------------
// STORE INTERFACE
// -----------------------------------------------------------------------------
// Dieses Interface definiert ALLES was unser Store enthält:
// - State (Daten)
// - Actions (Funktionen die den State ändern)

interface GameStore {
  // === STATE (Daten) ===
  board: Board                      // Das Spielbrett
  currentPlayer: Player             // Wer ist am Zug
  winner: Player | null             // Gewinner (null = noch keiner)
  winningCells: [number, number][]  // Koordinaten der Gewinnzellen
  status: GameStatus                // Spielstatus
  players: PlayerInfo               // Spielernamen
  stats: SessionStats               // Session-Statistik
  gameStarted: boolean              // Wurde das Spiel gestartet?
  
  // === ACTIONS (Funktionen) ===
  // In TypeScript definieren wir Funktionstypen so:
  // name: (parameter: Typ) => Rückgabetyp
  setPlayers: (redName: string, yellowName: string) => void  // void = kein Rückgabewert
  startGame: () => void
  dropPiece: (col: number) => boolean  // Gibt true zurück wenn erfolgreich
  resetGame: () => void
  resetSession: () => void
  checkWin: (row: number, col: number, player: Player) => [number, number][] | null
}

// -----------------------------------------------------------------------------
// ORIGINALE DROP PIECE FUNKTION SPEICHERN
// -----------------------------------------------------------------------------
// Diese Funktion wird außerhalb des Stores definiert, damit wir sie
// wiederherstellen können, falls sie von OnlineGame überschrieben wurde
const createLocalDropPiece = (set: any, get: any): ((col: number) => boolean) => {
  return (col: number) => {
    // get() holt den aktuellen State
    const { board, currentPlayer, status } = get()
    
    // Guard Clause: Früh abbrechen wenn Spiel nicht läuft
    if (status !== 'playing') return false
    
    // Finde die unterste freie Reihe in der Spalte
    // Wir gehen von unten (ROWS-1) nach oben (0)
    let targetRow = -1
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        targetRow = row
        break  // Gefunden! Schleife beenden
      }
    }
    
    // Spalte ist voll
    if (targetRow === -1) return false
    
    // Neues Board erstellen (IMMUTABILITY!)
    // In React/Zustand ändern wir State nie direkt, sondern erstellen Kopien
    // .map() erstellt ein neues Array
    const newBoard = board.map((row: Cell[], rowIndex: number) =>
      row.map((cell: Cell, colIndex: number) =>
        // Ternary Operator: condition ? ifTrue : ifFalse
        rowIndex === targetRow && colIndex === col ? currentPlayer : cell
      )
    )
    
    // Gewinn prüfen
    const winningCells = get().checkWin(targetRow, col, currentPlayer)
    
    if (winningCells) {
      // GEWONNEN!
      const { stats } = get()
      set({
        board: newBoard,
        winner: currentPlayer,
        winningCells,
        status: 'won',
        // Spread Operator (...): Kopiert alle Eigenschaften von stats
        // und überschreibt dann nur eine
        stats: {
          ...stats,
          [currentPlayer]: stats[currentPlayer] + 1,  // Computed Property Name
        },
      })
      return true
    }
    
    // Unentschieden prüfen: Ist die oberste Reihe voll?
    const isDraw = newBoard[0].every((cell: Cell) => cell !== null)
    
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
    
    // Spiel geht weiter - Spieler wechseln
    set({
      board: newBoard,
      // Ternary: Wenn rot, dann gelb, sonst rot
      currentPlayer: currentPlayer === 'red' ? 'yellow' : 'red',
    })
    
    return true
  }
}

// -----------------------------------------------------------------------------
// STORE ERSTELLEN MIT ZUSTAND
// -----------------------------------------------------------------------------
// create<GameStore>() ist ein GENERIC: Wir sagen Zustand welchen Typ der Store hat.
// Die Funktion bekommt zwei Parameter:
// - set: Funktion um den State zu ändern
// - get: Funktion um den aktuellen State zu lesen

export const useGameStore = create<GameStore>((set, get) => {
  // Originale dropPiece Funktion erstellen
  const localDropPiece = createLocalDropPiece(set, get)
  
  return {
    // === INITIALER STATE ===
    // Diese Werte werden beim App-Start gesetzt
    board: createEmptyBoard(),
    currentPlayer: 'red',
    winner: null,
    winningCells: [],
    status: 'waiting',
    players: { red: '', yellow: '' },
    stats: { red: 0, yellow: 0, draws: 0 },
    gameStarted: false,
    
    // === ACTION: Spielernamen setzen ===
    setPlayers: (redName: string, yellowName: string) => {
      // set() aktualisiert den State
      // Wir übergeben ein Objekt mit den zu ändernden Werten
      set({
        players: { red: redName, yellow: yellowName },
      })
    },
    
    // === ACTION: Spiel starten ===
    startGame: () => {
      // Stelle die originale dropPiece Funktion wieder her
      // (falls sie von OnlineGame überschrieben wurde)
      const currentLocalDropPiece = createLocalDropPiece(set, get)
      set({
        gameStarted: true,
        status: 'playing',
        board: createEmptyBoard(),
        currentPlayer: 'red',
        winner: null,
        winningCells: [],
        dropPiece: currentLocalDropPiece,
      })
    },
    
    // === ACTION: Spielstein einwerfen ===
    // Dies ist die Hauptlogik des Spiels
    // Die Funktion wird von createLocalDropPiece erstellt
    dropPiece: localDropPiece,
  
  // === ACTION: Gewinn prüfen ===
  // Diese Funktion prüft ob der letzte Zug zum Sieg geführt hat
  checkWin: (row: number, col: number, player: Player) => {
    const { board } = get()
    
    // Die 4 Richtungen in denen man gewinnen kann:
    // [deltaRow, deltaCol]
    const directions = [
      [0, 1],   // horizontal (rechts)
      [1, 0],   // vertikal (runter)
      [1, 1],   // diagonal (rechts-runter)
      [1, -1],  // diagonal (links-runter)
    ]
    
    // Für jede Richtung prüfen
    for (const [dRow, dCol] of directions) {
      // Array mit Startposition
      const cells: [number, number][] = [[row, col]]
      
      // In positive Richtung suchen
      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row + dRow * i
        const newCol = col + dCol * i
        
        // Prüfen: Im Spielfeld UND gleiche Farbe?
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          board[newRow][newCol] === player
        ) {
          cells.push([newRow, newCol])
        } else {
          break  // Kette unterbrochen
        }
      }
      
      // In negative Richtung suchen
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
      
      // 4 oder mehr in einer Reihe? GEWONNEN!
      if (cells.length >= WIN_LENGTH) {
        return cells
      }
    }
    
    return null  // Kein Gewinn
  },
  
  // === ACTION: Neue Runde (behält Statistik) ===
  resetGame: () => {
    // Stelle die originale dropPiece Funktion wieder her
    // (falls sie von OnlineGame überschrieben wurde)
    const currentLocalDropPiece = createLocalDropPiece(set, get)
    set({
      board: createEmptyBoard(),
      currentPlayer: 'red',
      winner: null,
      winningCells: [],
      status: 'playing',
      dropPiece: currentLocalDropPiece,
    })
  },
  
  // === ACTION: Neue Session (reset alles) ===
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
  }
})
