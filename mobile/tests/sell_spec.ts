import { remote } from "webdriverio";

const CAPS = {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": "emulator-5554",
    "appium:appPackage": "com.aseca.mobile",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": true,
};

describe("Sell screen", () => {
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
    });

    after(async () => {
        await driver?.deleteSession();
    });

    it("navega a venta desde una posicion", async () => {
        const position = await driver.$("~position-AAPL");
        await position.click();

        const title = await driver.$("~title");
        await expect(title).toHaveText("Vender AAPL");
    });

    it("muestra error si cantidad mayor a la disponible", async () => {
        const quantityInput = await driver.$("~quantity-input");
        await quantityInput.setValue("99999");

        const submit = await driver.$("~submit");
        await submit.click();

        await driver.pause(1000);

        const error = await driver.$("~error");
        await expect(error).toBeDisplayed();
    });

    it("cancelar vuelve al portfolio", async () => {
        const cancel = await driver.$("~cancel");
        await cancel.click();

        const totalValue = await driver.$("~total-value");
        await expect(totalValue).toBeDisplayed();
    });
});