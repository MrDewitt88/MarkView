export async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright is required for this export format but not installed.\n" +
      "Install it with: npm install playwright\n" +
      "Then run: npx playwright install chromium"
    );
  }
  return chromium.launch({ headless: true });
}
