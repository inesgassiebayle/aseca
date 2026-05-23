import { remote } from "webdriverio";

const CAPS = {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": "emulator-5554",
    "appium:appPackage": "com.aseca.mobile",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": true,
};

describe("Buy screen", () => {
    let driver: Awaited<ReturnType<typeof remote>>;

    before(async () => {
        driver = await remote({ hostname: "localhost", port: 4723, capabilities: CAPS });

        // Login
        const goToLogin = await driver.$("~go-to-login");
        await goToLogin.click();

        const email = await driver.$("~email");
        await email.setValue("usuario@mail.com");

        const password = await driver.$("~password");
        await password.setValue("password123");

        const submit = await driver.$("~submit");
        await submit.click();

        await driver.pause(2000);

        // Ir a compra
        const buyButton = await driver.$("~buy-button");
        await buyButton.click();
    });

    after(async () => {
        await driver?.deleteSession();
    });

    it("muestra el formulario de compra", async () => {
        const title = await driver.$("~title");
        await expect(title).toHaveText("Comprar acciones");

        const tickerInput = await driver.$("~ticker-input");
        await expect(tickerInput).toBeDisplayed();

        const quantityInput = await driver.$("~quantity-input");
        await expect(quantityInput).toBeDisplayed();
    });

    it("muestra error si el ticker no tiene precio", async () => {
        const tickerInput = await driver.$("~ticker-input");
        await tickerInput.setValue("XYZ");

        const quantityInput = await driver.$("~quantity-input");
        await quantityInput.setValue("10");

        const submit = await driver.$("~submit");
        await submit.click();

        await driver.pause(1000);

        const error = await driver.$("~error");
        await expect(error).toBeDisplayed();
    });

    it("compra exitosa y vuelve al portfolio", async () => {
        const tickerInput = await driver.$("~ticker-input");
        await tickerInput.clearValue();
        await tickerInput.setValue("AAPL");

        const quantityInput = await driver.$("~quantity-input");
        await quantityInput.clearValue();
        await quantityInput.setValue("1");

        const submit = await driver.$("~submit");
        await submit.click();

        await driver.pause(2000);

        const totalValue = await driver.$("~total-value");
        await expect(totalValue).toBeDisplayed();
    });

    it("cancelar vuelve al portfolio", async () => {
        const buyButton = await driver.$("~buy-button");
        await buyButton.click();

        const cancel = await driver.$("~cancel");
        await cancel.click();

        const totalValue = await driver.$("~total-value");
        await expect(totalValue).toBeDisplayed();
    });
});