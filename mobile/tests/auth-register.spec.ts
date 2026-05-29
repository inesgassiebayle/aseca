import { Browser } from "webdriverio";
import { createCleanDriver } from "./helpers/driver";
import { TEST_USER } from "./helpers/auth";

describe("Auth – Register flow", () => {
  let driver: Browser;

  beforeAll(async () => {
    driver = await createCleanDriver();
    await (await driver.$("~go-to-register")).click();
    await (await driver.$("~confirm-password")).waitForDisplayed({ timeout: 10000 });
  }, 60000);

  afterAll(async () => {
    await driver?.deleteSession();
  });

  it("renders the register form with all fields", async () => {
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
    await (await driver.$("~email")).setValue("new@example.com");
    await (await driver.$("~password")).setValue("Password123!");
    await (await driver.$("~confirm-password")).setValue("Different123!");
    await (await driver.$("~submit")).click();
    await (await driver.$("~error")).waitForDisplayed({ timeout: 5000 });
    expect(await (await driver.$("~error")).getText()).toBe("Passwords don't match");
  });

  it("shows error when email already exists", async () => {
    await (await driver.$("~email")).setValue(TEST_USER.email);
    await (await driver.$("~password")).setValue("Password123!");
    await (await driver.$("~confirm-password")).setValue("Password123!");
    await (await driver.$("~submit")).click();
    await driver.pause(500);
    await (await driver.$("~error")).waitForDisplayed({ timeout: 8000 });
    expect(await (await driver.$("~error")).isDisplayed()).toBe(true);
  });

  it("registers successfully and redirects to search", async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    await (await driver.$("~email")).setValue(uniqueEmail);
    await (await driver.$("~password")).setValue("Password123!");
    await (await driver.$("~confirm-password")).setValue("Password123!");
    await (await driver.$("~submit")).click();
    await (await driver.$("~search-title")).waitForDisplayed({ timeout: 15000 });
    expect(await (await driver.$("~search-title")).isDisplayed()).toBe(true);
  });
});