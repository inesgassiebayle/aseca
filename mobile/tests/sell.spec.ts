import { Browser } from "webdriverio";
import { createLoggedInDriver } from "./helpers/auth";

describe("Sell screen", () => {
    let driver: Browser;

    beforeAll(async () => {
        driver = await createLoggedInDriver();
        await (await driver.$("~nav-portfolio")).click();
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 10000 });
    }, 60000);

    afterAll(async () => {
        await driver?.deleteSession();
    });

    it("shows empty message or AAPL position in portfolio", async () => {
        const emptyExists    = await driver.$("~empty-message").isDisplayed().catch(() => false);
        const positionExists = await driver.$("~position-AAPL").isDisplayed().catch(() => false);
        expect(emptyExists || positionExists).toBe(true);
    });

    it("navigates to sell screen on position tap", async () => {
        const positionExists = await driver.$("~position-AAPL").isDisplayed().catch(() => false);
        if (!positionExists) {
            console.warn("No AAPL position found, skipping sell navigation test");
            return;
        }
        await (await driver.$("~position-AAPL")).click();
        await (await driver.$("~title")).waitForDisplayed({ timeout: 10000 });
        expect(await (await driver.$("~title")).getText()).toBe("Vender AAPL");
    });

    it("shows quantity input", async () => {
        const onSellScreen = await driver.$("~quantity-input").isDisplayed().catch(() => false);
        if (!onSellScreen) {
            const positionExists = await driver.$("~position-AAPL").isDisplayed().catch(() => false);
            if (!positionExists) {
                console.warn("No AAPL position found, skipping");
                return;
            }
            await (await driver.$("~position-AAPL")).click();
            await (await driver.$("~title")).waitForDisplayed({ timeout: 10000 });
        }
        expect(await (await driver.$("~quantity-input")).isDisplayed()).toBe(true);
    });

    it("shows error on quantity exceeding available shares", async () => {
        const quantityInput = await driver.$("~quantity-input");
        await quantityInput.clearValue();
        await quantityInput.setValue("99999");
        await (await driver.$("~submit")).click();
        await (await driver.$("~error")).waitForDisplayed({ timeout: 10000 });
        expect(await (await driver.$("~error")).isDisplayed()).toBe(true);
    });

    it("cancel goes back to portfolio", async () => {
        await (await driver.$("~cancel")).click();
        await (await driver.$("~total-value")).waitForDisplayed({ timeout: 10000 });
        expect(await (await driver.$("~total-value")).isDisplayed()).toBe(true);
    });
});