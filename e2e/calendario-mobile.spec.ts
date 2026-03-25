import { expect, test, type Page } from "@playwright/test";
import { ensureUserRealmRoles, getTestUsers, type TestUser } from "./helpers/keycloak";

const isAppRoute = (pathname: string) => /^\/(dashboard|calendario|onboarding)/.test(pathname);
const isKeycloakUrl = (url: string) => /\/realms\/[^/]+\//.test(url);

async function submitKeycloakLogin(page: Page, user: TestUser) {
  const usernameInput = page.locator("#username").first();
  const passwordInput = page.locator("#password").first();
  const submitButton = page.locator('input[type="submit"], button[type="submit"], button:has-text("Sign In"), button:has-text("Iniciar sesión")').first();

  await expect(usernameInput).toBeVisible({ timeout: 15000 });
  await passwordInput.fill(user.password);

  await usernameInput.fill(user.username);
  await submitButton.click();

  const loggedIn = await page.waitForURL((url) => isAppRoute(url.pathname), { timeout: 15000 }).then(() => true).catch(() => false);

  if (!loggedIn) {
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await usernameInput.fill(user.email);
    await passwordInput.fill(user.password);
    await submitButton.click();
    await page.waitForURL((url) => isAppRoute(url.pathname), { timeout: 30000 });
  }
}

async function goToProtectedRoute(page: Page, user: TestUser, path: string) {
  for (let intento = 0; intento < 3; intento++) {
    await page.goto(path);

    const redirectedToKeycloak = await page
      .waitForURL(/realms\/[^/]+\//, { timeout: 7000 })
      .then(() => true)
      .catch(() => false);

    if (redirectedToKeycloak || isKeycloakUrl(page.url())) {
      await submitKeycloakLogin(page, user);
      continue;
    }

    if (isAppRoute(new URL(page.url()).pathname)) {
      return;
    }

    const loginButton = page.getByRole("button", { name: /Iniciar sesi[oó]n|Sign In/i }).first();
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await Promise.all([
        page.waitForURL(/realms\/[^/]+\//, { timeout: 15000 }),
        loginButton.click(),
      ]);
      await submitKeycloakLogin(page, user);
      continue;
    }

    await page.waitForTimeout(1000);
  }

  throw new Error(`No se pudo navegar autenticado a ${path}. URL final: ${page.url()}`);
}

async function swipeCalendar(page: Page, direction: "left" | "right") {
  const container = page.locator(".touch-pan-y").first();
  await expect(container).toBeVisible();

  const startX = direction === "left" ? 320 : 70;
  const endX = direction === "left" ? 70 : 320;
  const y = 260;

  await container.evaluate((element, payload) => {
    const touchStart = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(touchStart, "changedTouches", {
      value: [{ clientX: payload.startX, clientY: payload.y }],
    });
    Object.defineProperty(touchStart, "touches", {
      value: [{ clientX: payload.startX, clientY: payload.y }],
    });
    element.dispatchEvent(touchStart);

    const touchEnd = new Event("touchend", { bubbles: true, cancelable: true });
    Object.defineProperty(touchEnd, "changedTouches", {
      value: [{ clientX: payload.endX, clientY: payload.y }],
    });
    element.dispatchEvent(touchEnd);
  }, { startX, endX, y });
}

test.describe("Calendario Mobile", () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = getTestUsers().padre;
    await ensureUserRealmRoles(user.email, ["DIRIGENTE"]);
  });

  test("muestra toolbar mobile compacta y quick actions", async ({ page }) => {
    test.setTimeout(120000);

    await page.setViewportSize({ width: 390, height: 844 });
    await goToProtectedRoute(page, user, "/calendario");
    await page.waitForLoadState("networkidle");

    const toolbarLabel = page.locator(".cas-toolbar-label").first();
    await expect(toolbarLabel).toBeVisible();

    const currentLabel = (await toolbarLabel.innerText()).trim();

    await swipeCalendar(page, "left");
    await expect(toolbarLabel).not.toHaveText(currentLabel);

    await swipeCalendar(page, "right");
    await expect(toolbarLabel).toHaveText(currentLabel);

    await page.getByRole("button", { name: "Período siguiente" }).click();
    await expect(toolbarLabel).not.toHaveText(currentLabel);

    await page.getByRole("button", { name: "Período anterior" }).click();
    await page.getByRole("button", { name: "Hoy" }).click();

    await expect(page.getByRole("tab", { name: "Mes" })).toBeVisible();
    await page.getByRole("tab", { name: "Semana" }).click();
    await expect(page.getByRole("tab", { name: "Semana" })).toHaveAttribute("aria-selected", "true");

    const fab = page.getByRole("button", { name: "Acciones rápidas de calendario" });
    await expect(fab).toBeVisible();
    await fab.click();

    await expect(page.getByRole("heading", { name: "Acciones" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Evento/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reunión/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hoy" })).toBeVisible();

    await page.getByRole("button", { name: /Evento/i }).click();
    await expect(page.getByRole("heading", { name: /Crear evento del departamento/i })).toBeVisible();
    await page.keyboard.press("Escape");

    await fab.click();
    await page.getByRole("button", { name: /Reunión/i }).click();
    await expect(page.getByRole("heading", { name: /Nueva reunión/i })).toBeVisible();
  });
});
