import { remote } from "webdriverio";

const CAPS = {
  platformName: "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "emulator-5554",
  "appium:appPackage": "com.aseca.mobile",
  "appium:appActivity": ".MainActivity",
  "appium:noReset": true,
};

describe("Login screen", () => {
  let driver: Awaited<ReturnType<typeof remote>>;

  before(async () => {
    driver = await remote({ hostname: "localhost", port: 4723, capabilities: CAPS });
  });

  after(async () => {
    await driver?.deleteSession();
  });

  beforeEach(async () => {
    const goToLogin = await driver.$("~go-to-login");
    await goToLogin.click();
  });

  afterEach(async () => {
    await driver.back();
  });

  it("renders the form with all fields", async () => {
    const title = await driver.$("~title");
    await expect(title).toHaveText("Sign in");

    const email = await driver.$("~email");
    await expect(email).toBeDisplayed();

    const password = await driver.$("~password");
    await expect(password).toBeDisplayed();

    const submit = await driver.$("~submit");
    await expect(submit).toBeDisplayed();
  });

  it("shows a link to create account", async () => {
    const link = await driver.$("~go-to-register");
    await expect(link).toBeDisplayed();
  });

  it("shows error message on invalid credentials", async () => {
    const email = await driver.$("~email");
    await email.setValue("user@mail.com");

    const password = await driver.$("~password");
    await password.setValue("wrongpassword");

    const submit = await driver.$("~submit");
    await submit.click();

    const error = await driver.$("~error");
    await expect(error).toBeDisplayed();
  });

  it("navigates to register screen when tapping the link", async () => {
    const link = await driver.$("~go-to-register");
    await link.click();

    const title = await driver.$("~title");
    await expect(title).toHaveText("Create account");

    await driver.back();
  });
});