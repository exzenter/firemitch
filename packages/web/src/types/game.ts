// =============================================================================
// TYPESCRIPT TYPEN & INTERFACES
// =============================================================================
// TypeScript erweitert JavaScript um statische Typisierung.
// Das bedeutet: Wir definieren, welche Datentypen Variablen haben dürfen.
// Der Compiler prüft dann, ob wir diese Typen korrekt verwenden.

// -----------------------------------------------------------------------------
// TYPE ALIASES (Typ-Aliase)
// -----------------------------------------------------------------------------
// Mit 'type' erstellen wir eigene Typnamen für bessere Lesbarkeit.
// Union Types (|) bedeuten "entweder das eine ODER das andere"

// Player kann nur 'red' oder 'yellow' sein - nichts anderes!
// Das verhindert Tippfehler wie 'Red' oder 'gelb'
export type Player = 'red' | 'yellow'

// Cell ist entweder ein Spieler ODER null (leeres Feld)
// 'null' ist ein eigener Typ in TypeScript für "kein Wert"
export type Cell = Player | null

// Board ist ein 2D-Array: Array von Arrays von Cells
// Cell[][] bedeutet: "Array von (Array von Cell)"
export type Board = Cell[][]

// Literal Union Type: Status kann nur einer dieser 4 Strings sein
export type GameStatus = 'waiting' | 'playing' | 'won' | 'draw'

// -----------------------------------------------------------------------------
// INTERFACES
// -----------------------------------------------------------------------------
// Interfaces definieren die "Form" eines Objekts.
// Sie sagen: "Ein Objekt dieses Typs MUSS diese Eigenschaften haben"

export interface GameState {
  id: string                        // Eindeutige Spiel-ID
  board: Board                      // Das Spielbrett (unser Board-Typ von oben)
  currentPlayer: Player             // Wer ist dran? (unser Player-Typ)
  winner: Player | null             // Gewinner oder null wenn noch keiner
  winningCells: [number, number][]  // Tuple-Array: Koordinaten der Gewinnzellen
  status: GameStatus                // Aktueller Spielstatus
  players: {                        // Verschachteltes Objekt für Spieler-IDs
    red: string | null
    yellow: string | null
  }
  createdAt: Date                   // Date ist ein eingebauter TypeScript-Typ
  updatedAt: Date
}

// -----------------------------------------------------------------------------
// KONSTANTEN
// -----------------------------------------------------------------------------
// 'const' Variablen können nicht neu zugewiesen werden.
// Wir exportieren sie, damit andere Dateien sie importieren können.

export const ROWS = 6        // Spielbrett hat 6 Reihen
export const COLS = 7        // Spielbrett hat 7 Spalten
export const WIN_LENGTH = 4  // 4 in einer Reihe zum Gewinnen

// -----------------------------------------------------------------------------
// FUNKTIONEN MIT RÜCKGABETYP
// -----------------------------------------------------------------------------
// (): Board bedeutet: Diese Funktion gibt einen Board-Typ zurück
// Arrow Function Syntax: const name = (): ReturnType => { ... }

export const createEmptyBoard = (): Board => {
  // Array(ROWS) erstellt Array mit 6 leeren Slots
  // .fill(null) füllt alle Slots mit null
  // .map() transformiert jedes Element
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(null))  // Für jede Reihe: Array mit 7 nulls
}

// -----------------------------------------------------------------------------
// SERIALISIERUNG FÜR FIRESTORE
// -----------------------------------------------------------------------------
// Firestore (Firebase Datenbank) unterstützt keine verschachtelten Arrays.
// Daher müssen wir 2D-Arrays in 1D-Arrays umwandeln (serialisieren)
// und beim Lesen wieder zurück (deserialisieren).

// Funktion mit Parameter-Typ und Rückgabe-Typ
// (board: Board): Cell[] bedeutet:
// - Parameter 'board' hat Typ 'Board'
// - Rückgabewert hat Typ 'Cell[]' (Array von Cells)
export const serializeBoard = (board: Board): Cell[] => {
  // .flat() macht aus [[a,b], [c,d]] => [a,b,c,d]
  return board.flat()
}

export const deserializeBoard = (flat: Cell[]): Board => {
  const board: Board = []  // Explizite Typ-Annotation für die Variable
  for (let row = 0; row < ROWS; row++) {
    // .slice() extrahiert einen Teil des Arrays
    board.push(flat.slice(row * COLS, (row + 1) * COLS))
  }
  return board
}

// Erstellt direkt ein flaches leeres Board für Firestore
export const createEmptyBoardFlat = (): Cell[] => {
  return Array(ROWS * COLS).fill(null)
}

// -----------------------------------------------------------------------------
// TUPLE TYPES
// -----------------------------------------------------------------------------
// [number, number] ist ein Tuple: Array mit genau 2 Zahlen
// [number, number][] ist ein Array von solchen Tuples

// Serialisiert Gewinnzellen-Koordinaten für Firestore
export const serializeWinningCells = (cells: [number, number][]): number[] => {
  // .flatMap() ist wie .map() + .flat() kombiniert
  // Destructuring: ([row, col]) extrahiert die beiden Werte aus dem Tuple
  return cells.flatMap(([row, col]) => [row, col])
}

export const deserializeWinningCells = (flat: number[]): [number, number][] => {
  const cells: [number, number][] = []
  // i += 2 bedeutet: Springe immer 2 Schritte (weil Paare)
  for (let i = 0; i < flat.length; i += 2) {
    // 'as' ist Type Assertion: Wir sagen TypeScript "vertrau mir, das ist ein Tuple"
    cells.push([flat[i], flat[i + 1]] as [number, number])
  }
  return cells
}
