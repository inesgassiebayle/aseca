import { remote } from "webdriverio";

describe("Home screen", () => {
  let driver: Awaited<ReturnType<typeof remote>>;

  before(async () => {
    driver = await remote({
      hostname: "localhost",
      port: 4723,
      capabilities: {
        platformName: "Android",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": "emulator-5554",
        "appium:appPackage": "com.aseca.mobile",
        "appium:appActivity": ".MainActivity",
        "appium:noReset": true,
      },
    });
  });

  after(async () => {
    await driver?.deleteSession();
  });

  it("shows app title", async () => {
    const el = await driver.$("~Aseca");
    await expect(el).toBeDisplayed();
  });
});