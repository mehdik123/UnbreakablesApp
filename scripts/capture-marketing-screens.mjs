/**
 * Capture marketing UI screenshots from the DEV marketing preview.
 * Run: npx playwright install chromium && node scripts/capture-marketing-screens.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing-assets', 'screens');
const base = process.env.MARKETING_URL || 'http://localhost:5173/?marketing=1';

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: file, type: 'png' });
  console.log('saved', file);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, '01-home');

  // Open workouts
  const workoutBtn = page.getByRole('button', { name: /workout|تمارين|séance|Open workouts|فتح|Ouvrir/i }).first();
  if (await workoutBtn.count()) {
    await workoutBtn.click();
  } else {
    await page.locator('button.home-start-btn').click().catch(() => {});
    await page.getByText(/Workouts|تمارين|Séances/i).first().click().catch(() => {});
  }
  await page.waitForTimeout(1200);
  await shot(page, '02-workout');

  // Back home if possible
  const back = page.locator('button').filter({ hasText: /back|منزل|accueil|Home/i }).first();
  if (await back.count()) await back.click().catch(() => {});
  // Try navigate via bottom or header home - look for home tile grid
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Nutrition tile
  await page.getByText(/Nutrition|التغذية|Nutrition/i).first().click().catch(async () => {
    await page.locator('.home-tile').nth(2).click();
  });
  await page.waitForTimeout(1200);
  await shot(page, '03-nutrition');

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByText(/Cardio|كارديو/i).first().click().catch(async () => {
    await page.locator('.home-tile').nth(1).click();
  });
  await page.waitForTimeout(1200);
  await shot(page, '04-cardio');

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByText(/Progress|التقدم|Progrès/i).first().click().catch(async () => {
    await page.locator('.home-tile.wide, .home-tile').last().click();
  });
  await page.waitForTimeout(1500);
  // Prefer charts if hub
  await page.getByText(/Muscle|Charts|Focus|رسوم/i).first().click().catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, '05-progress');

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByText(/Progress|التقدم|Progrès/i).first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.getByText(/Weight|الوزن|Poids/i).first().click().catch(() => {});
  await page.waitForTimeout(1200);
  await shot(page, '06-weight');

  await browser.close();
  console.log('Done. Screenshots in', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
