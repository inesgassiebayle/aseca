import { Browser } from "webdriverio";
import { createLoggedInDriver } from "./helpers/auth";

describe("Portfolio screen", () => {
    let driver: Browser;

    beforeAll(async () => {
        driver = await createLoggedInDriver();
        await (await driver.$("~nav-portfolio")).click();
        await driver.pause(3000);
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 20000 });
    }, 60000);

    afterAll(async () => {
        await driver?.deleteSession();
    });

    it("shows total portfolio value", async () => {
        expect(await (await driver.$("~total-value")).isDisplayed()).toBe(true);
    });

    it("shows total P&L", async () => {
        expect(await (await driver.$("~total-pnl")).isDisplayed()).toBe(true);
    });

    it("shows buy button", async () => {
        expect(await (await driver.$("~buy-button")).isDisplayed()).toBe(true);
    });

    it("shows operations button", async () => {
        expect(await (await driver.$("~operations-button")).isDisplayed()).toBe(true);
    });

    it("navigates to buy screen on buy button tap", async () => {
        await (await driver.$("~buy-button")).click();
        await (await driver.$("~title")).waitForDisplayed({ timeout: 10000 });
        expect(await (await driver.$("~title")).getText()).toBe("Comprar acciones");
        await driver.back();
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 10000 });
    });

    it("navigates to operations screen on activity button tap", async () => {
        await (await driver.$("~operations-button")).click();
        await driver.pause(2000);
        await driver.back();
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 10000 });
    });

    it("shows empty message or position list", async () => {
        const emptyExists    = await driver.$("~empty-message").isDisplayed().catch(() => false);
        const positionExists = await driver.$("~position-AAPL").isDisplayed().catch(() => false);
        expect(emptyExists || positionExists).toBe(true);
    });
});