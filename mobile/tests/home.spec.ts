import { Browser } from "webdriverio";
import { createCleanDriver } from "./helpers/driver";

// Verifica que la app arranca correctamente y llega a login.
// Si este test falla, todos los demás también fallarían.
describe("App boot", () => {
  let driver: Browser;

  beforeAll(async () => {
    driver = await createCleanDriver();
  }, 30000);

  afterAll(async () => {
    await driver?.deleteSession();
  });

  it("boots directly into the login screen", async () => {
    expect(await (await driver.$("~title")).getText()).toBe("Sign in");
  });

  it("shows email and password inputs on boot", async () => {
    expect(await (await driver.$("~email")).isDisplayed()).toBe(true);
    expect(await (await driver.$("~password")).isDisplayed()).toBe(true);
  });

  it("shows link to register from login screen", async () => {
    expect(await (await driver.$("~go-to-register")).isDisplayed()).toBe(true);
  });
});