import { Browser } from "webdriverio";
import { createLoggedInDriver } from "./helpers/auth";

describe("Watchlist screen", () => {
    let driver: Browser;

    beforeAll(async () => {
        driver = await createLoggedInDriver();
        await (await driver.$("~nav-watchlist")).click();
        await (await driver.$("~watchlist-title")).waitForDisplayed({ timeout: 15000 });
    }, 60000);

    afterAll(async () => {
        await driver?.deleteSession();
    });

    it("shows watchlist title", async () => {
        expect(await (await driver.$("~watchlist-title")).isDisplayed()).toBe(true);
    });

    it("shows add input", async () => {
        expect(await (await driver.$("~watchlist-input")).isDisplayed()).toBe(true);
    });

    it("shows add button", async () => {
        expect(await (await driver.$("~watchlist-add-btn")).isDisplayed()).toBe(true);
    });

    it("shows empty message or item list", async () => {
        const emptyExists = await driver.$("~watchlist-empty").isDisplayed().catch(() => false);
        const itemExists = await driver.$("~watchlist-item-AAPL").isDisplayed().catch(() => false);
        expect(emptyExists || itemExists).toBe(true);
    });

    it("adds a ticker to watchlist", async () => {
        const input = await driver.$("~watchlist-input");
        await input.setValue("AAPL");
        await (await driver.$("~watchlist-add-btn")).click();
        await driver.pause(3000);
        const item = await driver.$("~watchlist-item-AAPL");
        await item.waitForDisplayed({ timeout: 10000 });
        expect(await item.isDisplayed()).toBe(true);
    });

    it("shows price for ticker", async () => {
        const price = await driver.$("~watchlist-price-AAPL");
        await price.waitForDisplayed({ timeout: 10000 });
        expect(await price.isDisplayed()).toBe(true);
    });

    it("shows compare button", async () => {
        expect(await (await driver.$("~compare-btn")).isDisplayed()).toBe(true);
    });

    it("removes a ticker from watchlist", async () => {
        await (await driver.$("~watchlist-remove-AAPL")).click();
        await driver.pause(2000);
        const itemGone = await driver.$("~watchlist-item-AAPL").isDisplayed().catch(() => false);
        expect(itemGone).toBe(false);
    });
});

describe("Watchlist compare screen", () => {
    let driver: Browser;

    beforeAll(async () => {
        driver = await createLoggedInDriver();
        await (await driver.$("~nav-watchlist")).click();
        await (await driver.$("~watchlist-title")).waitForDisplayed({ timeout: 15000 });

        // Asegurar que AAPL y MSFT están en watchlist
        for (const t of ["AAPL", "MSFT"]) {
            const exists = await driver.$(`~watchlist-item-${t}`).isDisplayed().catch(() => false);
            if (!exists) {
                await (await driver.$("~watchlist-input")).setValue(t);
                await (await driver.$("~watchlist-add-btn")).click();
                await driver.pause(2000);
            }
        }

        await (await driver.$("~compare-btn")).click();
        await (await driver.$("~compare-title")).waitForDisplayed({ timeout: 15000 });
    }, 120000);

    afterAll(async () => {
        await driver?.deleteSession();
    });

    it("shows compare title", async () => {
        expect(await (await driver.$("~compare-title")).isDisplayed()).toBe(true);
    });

    it("shows ticker buttons", async () => {
        expect(await (await driver.$("~ticker-btn-AAPL")).isDisplayed()).toBe(true);
        expect(await (await driver.$("~ticker-btn-MSFT")).isDisplayed()).toBe(true);
    });

    it("shows compare metrics button", async () => {
        expect(await (await driver.$("~compare-metrics-btn")).isDisplayed()).toBe(true);
    });

    it("shows metrics table after comparing", async () => {
        await (await driver.$("~ticker-btn-AAPL")).click();
        await (await driver.$("~ticker-btn-MSFT")).click();
        await (await driver.$("~compare-metrics-btn")).click();
        // Esperar que el botón deje de decir "Loading..."
        await driver.pause(2000);
        const table = await driver.$("~compare-table");
        await table.waitForDisplayed({ timeout: 30000 }); // más tiempo
        expect(await table.isDisplayed()).toBe(true);
    });

    it("shows revenue metric for AAPL", async () => {
        const metric = await driver.$("~metric-revenue-AAPL");
        await metric.waitForDisplayed({ timeout: 15000 }); // más tiempo
        expect(await metric.isDisplayed()).toBe(true);
    });
});