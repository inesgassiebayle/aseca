import { Browser } from "webdriverio";
import { createCleanDriver } from "./helpers/driver";

describe("Login screen", () => {
  let driver: Browser;

  beforeAll(async () => {
    driver = await createCleanDriver();
    // Ya en login screen — sin navigate
  }, 30000);

  afterAll(async () => {
    await driver?.deleteSession();
  });

  // Sin beforeEach: los tests 1-3 no navegan, se quedan en login.
  // El test 4 navega a register y vuelve explícitamente.

  it("renders the form with all fields", async () => {
    expect(await (await driver.$("~title")).getText()).toBe("Sign in");
    expect(await (await driver.$("~email")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~password")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~submit")).isDisplayed()).toBe(true);
  });

  it("shows a link to create account", async () => {
    expect(await (await driver.$("~go-to-register")).isDisplayed()).toBe(true);
  });

  it("shows error message on invalid credentials", async () => {
    await (await driver.$("~email")).setValue("user@mail.com");
    await (await driver.$("~password")).setValue("wrongpassword");
    await (await driver.$("~submit")).click();
    await (await driver.$("~error")).waitForDisplayed({ timeout: 5000 });
    expect(await (await driver.$("~error")).isDisplayed()).toBe(true);
    // Sigue en login screen con error visible — OK para el test siguiente
  });

  it("navigates to register screen when tapping the link", async () => {
    await (await driver.$("~go-to-register")).click();
    await (await driver.$("~title")).waitForDisplayed({ timeout: 5000 });
    expect(await (await driver.$("~title")).getText()).toBe("Create account");
    await driver.back(); // register → login
    await (await driver.$("~email")).waitForDisplayed({ timeout: 5000 });
  });
});