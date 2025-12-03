import { test, expect } from '@playwright/test'

test.describe('4 Gewinnt Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the game title', async ({ page }) => {
    await expect(page.getByText('4 GEWINNT')).toBeVisible()
  })

  test('should show red player as starting player', async ({ page }) => {
    await expect(page.getByText('ROT')).toBeVisible()
    await expect(page.getByText('Am Zug:')).toBeVisible()
  })

  test('should allow dropping a piece in a column', async ({ page }) => {
    // Find all cells in the first column (bottom to top)
    const cells = page.locator('[data-testid="cell"]')
    
    // Click on first column - first indicator
    const columnIndicators = page.locator('div').filter({ hasText: /^$/ }).first()
    
    // Get the first cell that's clickable
    const firstColumnCells = cells.filter({ has: page.locator('[data-value="empty"]') })
    
    // Initial state - all empty
    await expect(cells.first()).toHaveAttribute('data-value', 'empty')
    
    // Click on first column (any empty cell will work since clicking triggers column drop)
    await cells.first().click()
    
    // After click, the bottom cell of first column should be red
    // And the turn should switch to yellow
    await expect(page.getByText('GELB')).toBeVisible()
  })

  test('should allow resetting the game', async ({ page }) => {
    // Make a move first
    const cells = page.locator('[data-testid="cell"]')
    await cells.first().click()
    
    // Click reset button
    await page.getByRole('button', { name: /Neues Spiel/i }).click()
    
    // Should be back to red's turn
    await expect(page.getByText('ROT')).toBeVisible()
    await expect(page.getByText('Am Zug:')).toBeVisible()
  })

  test('should detect a vertical win', async ({ page }) => {
    const cells = page.locator('[data-testid="cell"]')
    
    // Simulate a vertical win for red
    // Red drops in column 0, Yellow in column 1
    // Red drops in column 0, Yellow in column 1
    // Red drops in column 0, Yellow in column 1
    // Red drops in column 0 - wins!
    
    // Column 0 clicks (for red)
    for (let i = 0; i < 4; i++) {
      // Red's turn - column 0
      await cells.nth(0).click()
      
      if (i < 3) {
        // Yellow's turn - column 1 (except last round)
        await cells.nth(1).click()
      }
    }
    
    // Should show winner message
    await expect(page.getByText('hat gewonnen!')).toBeVisible({ timeout: 5000 })
  })

  test('should display game rules info', async ({ page }) => {
    await expect(page.getByText('7 Spalten × 6 Reihen')).toBeVisible()
    await expect(page.getByText('4 in einer Reihe zum Gewinnen')).toBeVisible()
  })
})

