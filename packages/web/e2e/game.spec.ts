import { test, expect } from '@playwright/test'

test.describe('4 Gewinnt Game', () => {
  // Helper function to navigate to game
  async function navigateToGame(page: any) {
    await page.goto('/')
    
    // Wait for mode selection to be visible
    await expect(page.getByText('Waehle einen Spielmodus')).toBeVisible()
    
    // Click on "Lokal" mode card - the card is clickable and contains unique text
    // Click on the unique text "2 Spieler, 1 Geraet" which is only in the Lokal card
    await page.getByText('2 Spieler, 1 Geraet').click()
    
    // Wait for player setup to appear
    await expect(page.getByText('Neues Spiel starten')).toBeVisible()
    
    // Start the game (default player names will be used: "Spieler 1" and "Spieler 2")
    await page.getByRole('button', { name: /Spiel starten/i }).click()
    
    // Wait for the game board to appear
    await expect(page.locator('[data-testid="cell"]').first()).toBeVisible()
  }

  test.beforeEach(async ({ page }) => {
    await navigateToGame(page)
  })

  test('should display the game title', async ({ page }) => {
    // The title is in the header
    await expect(page.getByText('4 GEWINNT')).toBeVisible()
  })

  test('should show red player as starting player', async ({ page }) => {
    // Check that "Am Zug:" is visible
    await expect(page.getByText('Am Zug:')).toBeVisible()
    // Check that the default red player name "Spieler 1" is visible
    await expect(page.getByText('Spieler 1')).toBeVisible()
  })

  test('should allow dropping a piece in a column', async ({ page }) => {
    const cells = page.locator('[data-testid="cell"]')
    
    // Initial state - all cells should be empty
    await expect(cells.first()).toHaveAttribute('data-value', 'empty')
    
    // The board has 6 rows x 7 columns = 42 cells total
    // Board structure: row 0 (top) = cells 0-6, row 1 = cells 7-13, ..., row 5 (bottom) = cells 35-41
    // First column (col 0): cells at indices 0, 7, 14, 21, 28, 35 (top to bottom)
    // Any cell in a column triggers dropPiece for that column, piece falls to bottom
    
    // Click on any cell in the first column (we'll use the top cell)
    // Index calculation: row * 7 + col = 0 * 7 + 0 = 0
    const firstColumnCell = cells.nth(0)
    await firstColumnCell.click()
    
    // Wait a bit for the piece to drop
    await page.waitForTimeout(500)
    
    // After click, the bottom cell of first column should be red
    // Bottom cell is at row 5, col 0 = index 35
    const firstColumnBottomCell = cells.nth(35)
    await expect(firstColumnBottomCell).toHaveAttribute('data-value', 'red')
    
    // And the turn should switch to yellow (Spieler 2)
    await expect(page.getByText('Spieler 2')).toBeVisible()
  })

  test('should allow resetting the game', async ({ page }) => {
    const cells = page.locator('[data-testid="cell"]')
    
    // Make a move first - click any cell in first column
    const firstColumnCell = cells.nth(0) // top cell of column 0
    await firstColumnCell.click()
    await page.waitForTimeout(500)
    
    // Verify it's now yellow's turn
    await expect(page.getByText('Spieler 2')).toBeVisible()
    
    // Click "Nächste Runde" button to reset
    await page.getByRole('button', { name: /Nächste Runde/i }).click()
    
    // Wait for game to reset
    await page.waitForTimeout(500)
    
    // Should be back to red's turn (Spieler 1)
    await expect(page.getByText('Spieler 1')).toBeVisible()
    await expect(page.getByText('Am Zug:')).toBeVisible()
    
    // The bottom cell of first column should be empty again
    const firstColumnBottomCell = cells.nth(35) // row 5, col 0
    await expect(firstColumnBottomCell).toHaveAttribute('data-value', 'empty')
  })

  test('should detect a vertical win', async ({ page }) => {
    const cells = page.locator('[data-testid="cell"]')
    
    // Simulate a vertical win for red (Spieler 1)
    // Red drops in column 0, Yellow in column 1 (alternating)
    // After 4 red pieces in column 0, red wins!
    
    // Column 0: any cell in that column will drop to the bottom
    // Column 1: any cell in that column will drop to the bottom
    // We'll click the top cell of each column repeatedly
    
    for (let i = 0; i < 4; i++) {
      // Red's turn - click any cell in column 0
      await cells.nth(0).click() // top cell of column 0
      await page.waitForTimeout(400)
      
      if (i < 3) {
        // Yellow's turn - click any cell in column 1 (except last round)
        await cells.nth(1).click() // top cell of column 1
        await page.waitForTimeout(400)
      }
    }
    
    // Should show winner message with "hat gewonnen!"
    await expect(page.getByText('hat gewonnen!')).toBeVisible({ timeout: 5000 })
    
    // Winner should be Spieler 1 (red)
    await expect(page.getByText('Spieler 1')).toBeVisible()
  })

  test('should have correct board dimensions', async ({ page }) => {
    // Verify board dimensions by counting cells
    const cells = page.locator('[data-testid="cell"]')
    const cellCount = await cells.count()
    
    // Board should have 6 rows x 7 columns = 42 cells
    expect(cellCount).toBe(42)
  })
})
