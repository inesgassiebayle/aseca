import { Browser } from "webdriverio";
import { createCleanDriver } from "./helpers/driver";
import { TEST_USER } from "./helpers/auth";

const SEARCH_TIMEOUT = 20000;
const COLD_SEARCH_TIMEOUT = 35000;

describe("Auth → Search → Company (full flow)", () => {
  let driver: Browser;

  beforeAll(async () => {
    driver = await createCleanDriver();
  }, 60000);

  afterAll(async () => {
    await driver?.deleteSession();
  });


  it("shows error on wrong credentials", async () => {
    await (await driver.$("~email")).setValue("wrong@mail.com");
    await (await driver.$("~password")).setValue("wrongpass");
    await (await driver.$("~submit")).click();
    await (await driver.$("~error")).waitForDisplayed({ timeout: 8000 });
    expect(await (await driver.$("~error")).isDisplayed()).toBe(true);
  });

  it("logs in with valid credentials and reaches search", async () => {
    await (await driver.$("~email")).setValue(TEST_USER.email);
    await (await driver.$("~password")).setValue(TEST_USER.password);
    await (await driver.$("~submit")).click();
    await (await driver.$("~search-title")).waitForDisplayed({ timeout: 15000 });
    expect(await (await driver.$("~search-title")).isDisplayed()).toBe(true);
  });


  it("shows search input and button", async () => {
    expect(await (await driver.$("~search-input")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~search-button")).isDisplayed()).toBe(true);
  });

  it("returns results when searching by exact ticker", async () => {
    const input = await driver.$("~search-input");
    await input.clearValue();
    await input.setValue("AAPL");
    await (await driver.$("~search-button")).click();
    await (await driver.$("~result-0")).waitForDisplayed({ timeout: COLD_SEARCH_TIMEOUT });
    expect(await (await driver.$("~result-0")).isDisplayed()).toBe(true);
  });

  it("shows ticker, company name and CIK in results", async () => {
    expect(await (await driver.$("~ticker-0")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~company-name-0")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~cik-0")).isDisplayed()).toBe(true);
  });

  it("returns results when searching by partial name", async () => {
    const input = await driver.$("~search-input");
    await input.clearValue();
    await input.setValue("Microsoft");
    await (await driver.$("~search-button")).click();
    await (await driver.$("~result-0")).waitForDisplayed({ timeout: SEARCH_TIMEOUT });
    expect(await (await driver.$("~result-0")).isDisplayed()).toBe(true);
  });

  it("shows no-results message for unknown ticker", async () => {
    const input = await driver.$("~search-input");
    await input.clearValue();
    await input.setValue("XYZNOTEXIST");
    await (await driver.$("~search-button")).click();
    await (await driver.$("~no-results")).waitForDisplayed({ timeout: SEARCH_TIMEOUT });
    expect(await (await driver.$("~no-results")).isDisplayed()).toBe(true);
  });

  it("navigates to company detail on result tap", async () => {
    const input = await driver.$("~search-input");
    await input.clearValue();
    await input.setValue("AAPL");
    await (await driver.$("~search-button")).click();
    await (await driver.$("~result-0")).waitForDisplayed({ timeout: SEARCH_TIMEOUT });
    await (await driver.$("~result-0")).click();
    await driver.pause(5000);
    await (await driver.$("~company-name")).waitForDisplayed({ timeout: 15000 });
    expect(await (await driver.$("~company-name")).isDisplayed()).toBe(true);
  });


  it("company: shows name and ticker", async () => {
    expect(await (await driver.$("~company-name")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~ticker")).isDisplayed()).toBe(true);
  });

  it("company: shows CIK", async () => {
    expect(await (await driver.$("~cik")).isDisplayed()).toBe(true);
  });

  it("company: shows price or unavailable indicator", async () => {
    await driver.pause(2000);
    const priceExists   = await driver.$("~price").isDisplayed().catch(() => false);
    const unavailExists = await driver.$("~price-unavailable").isDisplayed().catch(() => false);
    expect(priceExists || unavailExists).toBe(true);
  });

  it("company: shows financial data section", async () => {
    await driver.pause(3000);
    const cardExists  = await driver.$("~financials-card").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-financials").isDisplayed().catch(() => false);
    expect(cardExists || emptyExists).toBe(true);
  });

  it("company: shows filings section", async () => {
    await driver.pause(2000);
    const listExists  = await driver.$("~filings-list").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-filings").isDisplayed().catch(() => false);
    expect(listExists || emptyExists).toBe(true);
  });

  it("company: shows metric tabs for revenue, net_income and eps", async () => {
    expect(await (await driver.$("~metric-tab-revenue")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~metric-tab-net_income")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~metric-tab-eps")).isDisplayed()).toBe(true);
  });

  it("company: shows revenue history data or empty message", async () => {
    await driver.pause(3000);
    const dataExists  = await driver.$("~metric-data").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-metric-data").isDisplayed().catch(() => false);
    expect(dataExists || emptyExists).toBe(true);
  });

  it("company: switches to net_income metric on tab tap", async () => {
    await (await driver.$("~metric-tab-net_income")).click();
    await driver.pause(2000);
    const dataExists  = await driver.$("~metric-data").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-metric-data").isDisplayed().catch(() => false);
    expect(dataExists || emptyExists).toBe(true);
  });

  it("company: switches to eps metric on tab tap", async () => {
    await (await driver.$("~metric-tab-eps")).click();
    await driver.pause(2000);
    const dataExists  = await driver.$("~metric-data").isDisplayed().catch(() => false);
    const emptyExists = await driver.$("~no-metric-data").isDisplayed().catch(() => false);
    expect(dataExists || emptyExists).toBe(true);
  });
});