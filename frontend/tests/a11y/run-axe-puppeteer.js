#!/usr/bin/env node
// Minimal Puppeteer + axe-core accessibility runner.
// Usage (environment):
//  FRONTEND_URL (default http://localhost:5173)
//  API_BASE (default http://localhost:8000/api/v1)
//  A11Y_TEST_EMAIL and A11Y_TEST_PASSWORD (optional) - if provided the script will authenticate via API and set localStorage like the app
//  AXE_CDN_URL (optional) - URL to axe.min.js (defaults to a known CDN)

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const API_BASE = process.env.API_BASE || 'http://localhost:8000/api/v1'
const EMAIL = process.env.A11Y_TEST_EMAIL
const PASSWORD = process.env.A11Y_TEST_PASSWORD
const AXE_CDN = process.env.AXE_CDN_URL || 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js'
// Local axe path (preferred in CI when axe-core is installed via npm)
const LOCAL_AXE_PATH = path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js')

async function injectAxe(page) {
  try {
    if (fs.existsSync(LOCAL_AXE_PATH)) {
      await page.addScriptTag({ path: LOCAL_AXE_PATH })
      return 'local'
    }
  } catch (e) {
    // ignore and fallback to CDN
  }
  await page.addScriptTag({ url: AXE_CDN })
  return 'cdn'
}

// Routes to audit (representative, keep small)
const ROUTES = [
  '/',
  '/dashboard',
  '/inventory',
  '/borrowings',
  '/assets',
  '/users',
  '/settings',
]

async function loginAndGetSession() {
  if (!EMAIL || !PASSWORD) {
    console.warn('A11Y: No credentials provided (A11Y_TEST_EMAIL / A11Y_TEST_PASSWORD). Running unauthenticated checks where possible.')
    return null
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Login failed (${res.status}): ${text}`)
    }
    const json = await res.json()
    if (!json || !json.user || !json.token) throw new Error('Login response missing user/token')
    return { user: json.user, token: json.token }
  } catch (err) {
    console.error('A11Y: Authentication failed:', err)
    throw err
  }
}

function summarizeViolations(violations) {
  return violations.map(v => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.length,
    tags: v.tags,
  }))
}

async function runAudit() {
  const login = await (async () => {
    try { return await loginAndGetSession() } catch { return null }
  })()

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(30000)

    let hadNavigationErrors = false
    const navigationErrors = []

    if (login) {
      // Pre-seed localStorage by navigating to the frontend origin and setting items
      try {
        await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' })
        await page.evaluate((user, token) => {
          localStorage.setItem('prototype_user', JSON.stringify(user))
          localStorage.setItem('prototype_token', token)
        }, login.user, login.token)
      } catch (err) {
        console.warn('A11Y: Warning - could not reach frontend to seed localStorage:', err.message || err)
        hadNavigationErrors = true
        navigationErrors.push({ route: FRONTEND_URL, error: String(err) })
      }
    }

    const allResults = []

    // Quick smoke: test quick access and help flow on dashboard (if available)
    try {
      try {
        await page.goto(FRONTEND_URL + '/dashboard', { waitUntil: 'networkidle2' })
      } catch (err) {
        throw new Error(`Navigation error: ${String(err)}`)
      }

      // Open Quick Access
      const qaButton = await page.$('[aria-label="Open Quick Access"]')
      if (qaButton) {
        // record the currently focused element label to assert focus return later
        const preFocusLabel = await page.evaluate(el => el.getAttribute('aria-label') || el.tagName, qaButton)
        await qaButton.click()
        // wait for panel dialog
        await page.waitForSelector('[role="dialog"][aria-label="Quick Access"]', { timeout: 5000 })

        // Press Escape to ensure Quick Access closes and focus returns
        await page.keyboard.press('Escape')
        // small delay to allow UI to close
        await page.waitForTimeout(250)
        const qaDialogStill = await page.$('[role="dialog"][aria-label="Quick Access"]')
        if (qaDialogStill) {
          console.warn('A11Y: Quick Access dialog did not close on Escape')
        } else {
          const postFocusLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName)
          if (postFocusLabel && postFocusLabel === preFocusLabel) {
            console.log('A11Y: Focus returned to Quick Access launcher after Escape')
          } else {
            console.warn('A11Y: Focus did not return to Quick Access launcher after Escape - got', postFocusLabel)
          }
        }

        // Re-open to test Help flow
        await qaButton.click()
        await page.waitForSelector('[role="dialog"][aria-label="Quick Access"]', { timeout: 5000 })

        // Try to click 'Help' button inside the Quick Access panel
        const helpBtn = await page.$x('//div[@role="dialog" and @aria-label="Quick Access"]//button[normalize-space(text())="Help"]')
        if (helpBtn && helpBtn.length > 0) {
          await helpBtn[0].click()
          // Wait for Help & Accessibility modal to appear
          await page.waitForSelector('div[role="dialog"] h2', { timeout: 5000 })
          const dialogTitle = await page.$eval('div[role="dialog"] h2', el => el.textContent?.trim())
          console.log('A11Y: Help modal opened with title:', dialogTitle)
          // run axe scoped to the modal container (prefer local axe when available)
          await injectAxe(page)
          const results = await page.evaluate(async () => await window.axe.run(document.querySelector('div[role="dialog"]') || document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }))
          allResults.push({ route: 'quick-access->help-modal', results })

          // Test Escape closes Help modal and focus returns to Help button
          await page.keyboard.press('Escape')
          await page.waitForTimeout(250)
          const helpDialogStill = await page.$('div[role="dialog"]')
          if (helpDialogStill) {
            console.warn('A11Y: Help modal did not close on Escape')
          } else {
            const postHelpFocus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName)
            console.log('A11Y: After closing Help modal, activeElement is', postHelpFocus)
          }

        } else {
          console.warn('A11Y: Help button not found in Quick Access panel')
        }
      } else {
        console.warn('A11Y: Quick Access button not found on dashboard')
      }
    } catch (err) {
      console.warn('A11Y: Quick Access / Help flow error (non-fatal):', err.message || err)
      hadNavigationErrors = true
      navigationErrors.push({ route: 'quick-access-flow', error: String(err) })
    }

    // Run axe on representative routes
    for (const route of ROUTES) {
      const url = FRONTEND_URL + route
      console.log(`A11Y: Navigating to ${url}`)
      try {
        await page.goto(url, { waitUntil: 'networkidle2' })
        // ensure page has a main landmark or body
        await page.waitForSelector('main, body', { timeout: 5000 })
        // inject axe (prefer local axe when available)
        await injectAxe(page)
        // run axe with WCAG 2.0/2.1 ruleset
        const results = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }))
        console.log(`A11Y: ${route} - violations: ${results.violations.length}`)
        allResults.push({ route, results })
      } catch (err) {
        console.error(`A11Y: Error auditing ${route}:`, err.message || err)
        hadNavigationErrors = true
        navigationErrors.push({ route, error: String(err) })
        allResults.push({ route, error: String(err) })
      }
    }

    // Persist results for CI triage
    try {
      const outPath = path.join(process.cwd(), 'tests', 'a11y', 'violations.json')
      fs.writeFileSync(outPath, JSON.stringify({ generated_at: new Date().toISOString(), navigationErrors, allResults }, null, 2))
      console.log('A11Y: Wrote results to', outPath)
    } catch (e) {
      console.warn('A11Y: Failed to write violations.json:', e.message || e)
    }

    // Summarize
    let failures = []
    for (const entry of allResults) {
      if (entry.results && entry.results.violations && entry.results.violations.length > 0) {
        const critical = entry.results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
        if (critical.length > 0) {
          failures.push({ route: entry.route, violations: summarizeViolations(critical) })
        }
      }
    }

    if (hadNavigationErrors) {
      console.error('A11Y: Navigation errors occurred; check violations.json for details')
      process.exitCode = 3
    }

    if (failures.length > 0) {
      console.error('A11Y: Found serious/critical violations on the following routes:')
      console.error(JSON.stringify(failures, null, 2))
      process.exitCode = 2
    } else if (!hadNavigationErrors) {
      console.log('A11Y: No critical/serious violations found in the scanned routes (violations may still exist at lower severities).')
    }

  } finally {
    await browser.close()
  }
}

// Entrypoint
runAudit().catch((err) => {
  console.error('A11Y: Runner failed', err)
  process.exit(1)
})