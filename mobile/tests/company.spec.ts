import { Browser } from "webdriverio";
import { createLoggedInDriver } from "./helpers/auth";

// ← Ya no necesita go-to-search porque createLoggedInDriver
//   deja el driver en la Search screen
async function navigateToCompany(driver: Browser, ticker = "AAPL"): Promise<void> {
  const input = await driver.$("~search-input");
  await input.waitForDisplayed({ timeout: 5000 });
  await input.clearValue();
  await input.setValue(ticker);
  await (await driver.$("~search-button")).click();
  await (await driver.$("~result-0")).waitForDisplayed({ timeout: 10000 });
  await (await driver.$("~result-0")).click();
  await driver.pause(5000);  // ← era 3000, subir a 5000 para que carguen las APIs
  await (await driver.$("~company-name")).waitForDisplayed({ timeout: 15000 });
}

describe("Company detail screen", () => {
  let driver: Browser;

  beforeAll(async () => {
    driver = await createLoggedInDriver();
    // Estado garantizado: logueado, en Search screen
    await navigateToCompany(driver, "AAPL");
    // Estado final: en Company detail de AAPL
  }, 60000);

  afterAll(async () => {
    await driver?.deleteSession();
  });

  it("shows company name and ticker", async () => {
    expect(await (await driver.$("~company-name")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~ticker")).isDisplayed()).toBe(true);
  });

  it("shows CIK", async () => {
    expect(await (await driver.$("~cik")).isDisplayed()).toBe(true);
  });

  it("shows price or price-unavailable indicator", async () => {
    await driver.pause(2000);
    const priceExists   = await driver.$("~price").isDisplayed().catch(() => false);
    const unavailExists = await driver.$("~price-unavailable").isDisplayed().catch(() => false);
    expect(priceExists || unavailExists).toBe(true);
  });

  it("shows financial data section", async () => {
    await driver.pause(3000);
    const cardExists  = await driver.$("~financials-card").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-financials").isDisplayed().catch(() => false);
    expect(cardExists || emptyExists).toBe(true);
  });

  it("shows filings section", async () => {
    await driver.pause(2000);
    const listExists  = await driver.$("~filings-list").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-filings").isDisplayed().catch(() => false);
    expect(listExists || emptyExists).toBe(true);
  });

  it("shows metric tabs for revenue, net_income and eps", async () => {
    expect(await (await driver.$("~metric-tab-revenue")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~metric-tab-net_income")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~metric-tab-eps")).isDisplayed()).toBe(true);
  });

  it("shows revenue history data or empty message", async () => {
    await driver.pause(3000);
    const dataExists  = await driver.$("~metric-data").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-metric-data").isDisplayed().catch(() => false);
    expect(dataExists || emptyExists).toBe(true);
  });

  it("switches to net_income metric on tab tap", async () => {
    await (await driver.$("~metric-tab-net_income")).click();
    await driver.pause(2000);
    const dataExists  = await driver.$("~metric-data").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-metric-data").isDisplayed().catch(() => false);
    expect(dataExists || emptyExists).toBe(true);
  });

  it("switches to eps metric on tab tap", async () => {
    await (await driver.$("~metric-tab-eps")).click();
    await driver.pause(2000);
    const dataExists  = await driver.$("~metric-data").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-metric-data").isDisplayed().catch(() => false);
    expect(dataExists || emptyExists).toBe(true);
  });
});