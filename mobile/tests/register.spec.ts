import { remote } from "webdriverio";

const CAPS = {
  platformName: "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "emulator-5554",
  "appium:appPackage": "com.aseca.mobile",
  "appium:appActivity": ".MainActivity",
  "appium:noReset": true,
};

describe("Register screen", () => {
  let driver: Awaited<ReturnType<typeof remote>>;

  before(async () => {
    driver = await remote({ hostname: "localhost", port: 4723, capabilities: CAPS });
  });

  after(async () => {
    await driver?.deleteSession();
  });

  beforeEach(async () => {
    const goToRegister = await driver.$("~go-to-register");
    await goToRegister.click();
  });

  afterEach(async () => {
    await driver.back();
  });

  it("renders the form with all fields", async () => {
    const title = await driver.$("~title");
    await expect(title).toHaveText("Create account");

    const email = await driver.$("~email");
    await expect(email).toBeDisplayed();

    const password = await driver.$("~password");
    await expect(password).toBeDisplayed();

    const confirmPassword = await driver.$("~confirm-password");
    await expect(confirmPassword).toBeDisplayed();

    const submit = await driver.$("~submit");
    await expect(submit).toBeDisplayed();
  });

  it("shows a link to sign in", async () => {
    const link = await driver.$("~go-to-login");
    await expect(link).toBeDisplayed();
  });

  it("shows error when passwords don't match", async () => {
    const email = await driver.$("~email");
    await email.setValue("test@example.com");

    const password = await driver.$("~password");
    await password.setValue("Password123!");

    const confirmPassword = await driver.$("~confirm-password");
    await confirmPassword.setValue("Different123!");

    const submit = await driver.$("~submit");
    await submit.click();

    const error = await driver.$("~error");
    await expect(error).toHaveText("Passwords don't match");
  });

  it("shows error message on failed registration", async () => {
    const email = await driver.$("~email");
    await email.setValue("existing@example.com");

    const password = await driver.$("~password");
    await password.setValue("Password123!");

    const confirmPassword = await driver.$("~confirm-password");
    await confirmPassword.setValue("Password123!");

    const submit = await driver.$("~submit");
    await submit.click();

    const error = await driver.$("~error");
    await expect(error).toBeDisplayed();
  });

  it("navigates to login screen when tapping the link", async () => {
    const link = await driver.$("~go-to-login");
    await link.click();

    const title = await driver.$("~title");
    await expect(title).toHaveText("Sign in");

    await driver.back();
  });
});