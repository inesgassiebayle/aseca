import { remote } from "webdriverio";

const CAPS = {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": "emulator-5554",
    "appium:appPackage": "com.aseca.mobile",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": true,
};

describe("Portfolio screen", () => {
    let driver: Awaited<ReturnType<typeof remote>>;

    before(async () => {
        driver = await remote({ hostname: "localhost", port: 4723, capabilities: CAPS });

        // Login primero
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

    it("muestra el valor total del portfolio", async () => {
        const totalValue = await driver.$("~total-value");
        await expect(totalValue).toBeDisplayed();
    });

    it("muestra el P&L total", async () => {
        const totalPnl = await driver.$("~total-pnl");
        await expect(totalPnl).toBeDisplayed();
    });

    it("muestra boton de compra", async () => {
        const buyButton = await driver.$("~buy-button");
        await expect(buyButton).toBeDisplayed();
    });

    it("navega a la pantalla de compra", async () => {
        const buyButton = await driver.$("~buy-button");
        await buyButton.click();

        const title = await driver.$("~title");
        await expect(title).toHaveText("Comprar acciones");

        await driver.back();
    });

    it("navega al historial de operaciones", async () => {
        const operationsButton = await driver.$("~operations-button");
        await operationsButton.click();

        const title = await driver.$("~title");
        await expect(title).toHaveText("Activity");

        await driver.back();
    });
});