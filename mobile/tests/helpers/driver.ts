import { remote, Browser } from "webdriverio";

export const APP_PACKAGE = "com.aseca.mobile";

const CAPS = {
  hostname: "localhost",
  port: 4723,
  capabilities: {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": "emulator-5554",
    "appium:appPackage": APP_PACKAGE,
    "appium:appActivity": ".MainActivity",
    "appium:noReset": true,
  },
};

export async function createCleanDriver(): Promise<Browser> {
  const driver = await remote(CAPS);

  await driver.terminateApp(APP_PACKAGE, {});
  await driver.pause(1500);  // ← dejar que termine de cerrar
  await driver.execute("mobile: clearApp", { appId: APP_PACKAGE });
  await driver.pause(1500);  // ← dejar que limpie
  await driver.activateApp(APP_PACKAGE);
  await driver.pause(5000);  // ← tiempo para que app + instrumentation arranquen

  await (await driver.$("~email")).waitForDisplayed({ timeout: 20000 });

  return driver;
}