import { Browser } from "webdriverio";
import { createLoggedInDriver } from "./helpers/auth";

describe("Buy screen", () => {
    let driver: Browser;

    beforeAll(async () => {
        driver = await createLoggedInDriver();
        await (await driver.$("~nav-portfolio")).click();
        await driver.pause(3000);
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 20000 });
        await (await driver.$("~buy-button")).click();
        await (await driver.$("~title")).waitForDisplayed({ timeout: 10000 });
    }, 60000);

    afterAll(async () => {
        await driver?.deleteSession();
    });

    it("shows buy form title", async () => {
        expect(await (await driver.$("~title")).getText()).toBe("Comprar acciones");
    });

    it("shows ticker and quantity inputs", async () => {
        expect(await (await driver.$("~ticker-input")).isDisplayed()).toBe(true);
        expect(await (await driver.$("~quantity-input")).isDisplayed()).toBe(true);
    });

    it("shows error on empty fields", async () => {
        await (await driver.$("~submit")).click();
        await (await driver.$("~error")).waitForDisplayed({ timeout: 5000 });
        expect(await (await driver.$("~error")).isDisplayed()).toBe(true);
    });

    it("shows error on unknown ticker", async () => {
        await (await driver.$("~ticker-input")).setValue("XYZNOTEXIST");
        await (await driver.$("~quantity-input")).setValue("10");
        await (await driver.$("~submit")).click();
        await (await driver.$("~error")).waitForDisplayed({ timeout: 10000 });
        expect(await (await driver.$("~error")).isDisplayed()).toBe(true);
    });

    it("cancel goes back to portfolio", async () => {
        await (await driver.$("~cancel")).click();
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 10000 });
        expect(await (await driver.$("~total-value")).isDisplayed()).toBe(true);
    });

    it("successful buy goes back to portfolio", async () => {
        await (await driver.$("~buy-button")).click();
        await (await driver.$("~title")).waitForDisplayed({ timeout: 10000 });

        const tickerInput = await driver.$("~ticker-input");
        await tickerInput.clearValue();
        await tickerInput.setValue("AAPL");

        const quantityInput = await driver.$("~quantity-input");
        await quantityInput.clearValue();
        await quantityInput.setValue("1");

        await (await driver.$("~submit")).click();
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 15000 });
        expect(await (await driver.$("~total-value")).isDisplayed()).toBe(true);
    });
});