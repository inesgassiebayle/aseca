import { Browser } from "webdriverio";
import { createCleanDriver } from "./driver";

export const TEST_USER = {
  email: "admin@gmail.com",
  password: "admin123",
};

export async function createLoggedInDriver(): Promise<Browser> {
  const driver = await createCleanDriver();
  // Ya estamos en login — sin necesidad de clickear go-to-login

  await (await driver.$("~email")).setValue(TEST_USER.email);
  await (await driver.$("~password")).setValue(TEST_USER.password);
  await (await driver.$("~submit")).click();

  await (await driver.$("~search-title")).waitForDisplayed({
    timeout: 15000,
    timeoutMsg: "createLoggedInDriver: login falló o Search no cargó. Verificá TEST_USER y que el backend esté corriendo.",
  });

  return driver;
  // Driver posicionado en: Search screen (home post-login)
}