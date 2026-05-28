import { Browser } from "webdriverio";
import { createCleanDriver } from "./helpers/driver";

describe("Register screen", () => {
  let driver: Browser;

  beforeAll(async () => {
    driver = await createCleanDriver();
    // Estamos en login → navegamos a register
    await (await driver.$("~go-to-register")).click();
    await (await driver.$("~confirm-password")).waitForDisplayed({ timeout: 10000 });
    // Driver posicionado en: Register screen
  }, 30000);

  afterAll(async () => {
    await driver?.deleteSession();
  });

  // Tests 1-4 se quedan en register (errores de validación no redirigen).
  // Test 5 va a login y vuelve explícitamente.

  it("renders the form with all fields", async () => {
    expect(await (await driver.$("~title")).getText()).toBe("Create account");
    expect(await (await driver.$("~email")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~password")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~confirm-password")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~submit")).isDisplayed()).toBe(true);
  });

  it("shows a link to sign in", async () => {
    expect(await (await driver.$("~go-to-login")).isDisplayed()).toBe(true);
  });

  it("shows error when passwords don't match", async () => {
    await (await driver.$("~email")).setValue("test@example.com");
    await (await driver.$("~password")).setValue("Password123!");
    await (await driver.$("~confirm-password")).setValue("Different123!");
    await (await driver.$("~submit")).click();
    await (await driver.$("~error")).waitForDisplayed({ timeout: 5000 });
    expect(await (await driver.$("~error")).getText()).toBe("Passwords don't match");
    // Sigue en register — validación client-side no redirige
  });

  it("shows error message on failed registration", async () => {
    await (await driver.$("~email")).setValue("existing@example.com");
    await (await driver.$("~password")).setValue("Password123!");
    await (await driver.$("~confirm-password")).setValue("Password123!");
    await (await driver.$("~submit")).click();
    await (await driver.$("~error")).waitForDisplayed({ timeout: 5000 });
    expect(await (await driver.$("~error")).isDisplayed()).toBe(true);
    // Sigue en register — error de servidor no redirige
  });

  it("navigates to login screen when tapping the link", async () => {
    await (await driver.$("~go-to-login")).click();
    await (await driver.$("~title")).waitForDisplayed({ timeout: 5000 });
    expect(await (await driver.$("~title")).getText()).toBe("Sign in");
    await driver.back(); // login → register
    await (await driver.$("~confirm-password")).waitForDisplayed({ timeout: 5000 });
  });
});