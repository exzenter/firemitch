// =============================================================================
// LAMPORT TIMESTAMP MANAGER
// =============================================================================
// Manages Lamport timestamps for CRDT conflict resolution
// Each client maintains a local counter that increments with each operation

class LamportTimestampManager {
  private counter: number = 0

  // Get the next timestamp for a new operation
  getNextTimestamp(): number {
    this.counter++
    return this.counter
  }

  // Update timestamp when receiving an operation from another client
  // Takes the max of local and received timestamp, then increments
  updateTimestamp(receivedTimestamp: number): number {
    this.counter = Math.max(this.counter, receivedTimestamp) + 1
    return this.counter
  }

  // Get current timestamp without incrementing
  getCurrentTimestamp(): number {
    return this.counter
  }

  // Reset counter (useful for testing or new sessions)
  reset(): void {
    this.counter = 0
  }
}

// Create singleton instance per client
let timestampManager: LamportTimestampManager | null = null

export const getLamportTimestampManager = (): LamportTimestampManager => {
  if (!timestampManager) {
    timestampManager = new LamportTimestampManager()
  }
  return timestampManager
}

// Helper functions for convenience
export const getNextTimestamp = (): number => {
  return getLamportTimestampManager().getNextTimestamp()
}

export const updateTimestamp = (receivedTimestamp: number): number => {
  return getLamportTimestampManager().updateTimestamp(receivedTimestamp)
}

export const getCurrentTimestamp = (): number => {
  return getLamportTimestampManager().getCurrentTimestamp()
}

export const resetTimestamp = (): void => {
  getLamportTimestampManager().reset()
}

