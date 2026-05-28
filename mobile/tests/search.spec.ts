import { Browser } from "webdriverio";
import { createLoggedInDriver } from "./helpers/auth";

const SEARCH_TIMEOUT = 20000;
const FIRST_SEARCH_TIMEOUT = 35000; // ← AAPL primera vez = cold start del backend

describe("Search screen", () => {
  let driver: Browser;

  beforeAll(async () => {
    driver = await createLoggedInDriver();
  }, 60000);

  afterAll(async () => {
    await driver?.deleteSession();
  });

  it("shows the search screen title", async () => {
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
    await (await driver.$("~result-0")).waitForDisplayed({ timeout: FIRST_SEARCH_TIMEOUT });
    expect(await (await driver.$("~result-0")).isDisplayed()).toBe(true);
  });

  it("shows company name, ticker and CIK in results", async () => {
    // Hace su propia búsqueda — independiente del test anterior
    const input = await driver.$("~search-input");
    await input.clearValue();
    await input.setValue("AAPL");
    await (await driver.$("~search-button")).click();
    await (await driver.$("~result-0")).waitForDisplayed({ timeout: SEARCH_TIMEOUT });
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

  it("shows no-results message when nothing found", async () => {
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
});