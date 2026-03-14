import { test, expect, type Page } from '@playwright/test';
import { ensureUserRealmRoles, getTestUsers, type TestUser } from './helpers/keycloak';

const isAppRoute = (pathname: string) => /^\/(dashboard|documentos|onboarding)/.test(pathname);
const isKeycloakUrl = (url: string) => /\/realms\/[^/]+\//.test(url);

async function submitKeycloakLogin(page: Page, user: TestUser) {
  const usernameInput = page.locator('#username').first();
  const passwordInput = page.locator('#password').first();
  const submitButton = page.locator('input[type="submit"], button[type="submit"], button:has-text("Sign In"), button:has-text("Iniciar sesión")').first();

  await expect(usernameInput).toBeVisible({ timeout: 15000 });
  await passwordInput.fill(user.password);

  // Some Keycloak realms use username, others normalize to email as username.
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

    const loginButton = page.getByRole('button', { name: /Iniciar sesi[oó]n|Sign In/i }).first();
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

async function loginWithCredentials(page: Page, user: TestUser) {
  await goToProtectedRoute(page, user, '/dashboard');
}

test.describe('Documentos - issue visible en home', () => {
  test('dirigente/secretario marca issue en reportes y aparece toast/badge en dashboard', async ({ page }) => {
    test.setTimeout(180000);

    const users = getTestUsers();
    const operador: TestUser = users.padre;

    // Hace al usuario de pruebas apto para Reportes y evita redirect de onboarding por rol dirigente.
    await ensureUserRealmRoles(operador.email, ['DIRIGENTE', 'SECRETARIO']);

    await loginWithCredentials(page, operador);
    await goToProtectedRoute(page, operador, '/documentos');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1, name: 'Documentación' })).toBeVisible({ timeout: 15000 });

    // Prepara un documento con ID para habilitar "Marcar issue" en reportes.
    const primerDocumento = page.locator('div.divide-y.divide-gray-100 h4').first();
    await expect(primerDocumento).toBeVisible({ timeout: 20000 });
    await primerDocumento.click();

    const guardarBorradorBtn = page.getByRole('button', { name: 'Guardar borrador' });
    await expect(guardarBorradorBtn).toBeVisible({ timeout: 10000 });
    await guardarBorradorBtn.click();

    await expect(guardarBorradorBtn).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('tab', { name: /Reportes/i }).click();
    const buscadorUsuarios = page.getByPlaceholder('Buscar por nombre o email...');
    await buscadorUsuarios.fill(operador.email);

    let filaUsuario = page.locator('tbody tr', { hasText: operador.email }).first();
    if (!(await filaUsuario.isVisible({ timeout: 5000 }).catch(() => false))) {
      await buscadorUsuarios.fill(operador.username);
      filaUsuario = page.locator('tbody tr', { hasText: operador.username }).first();
    }
    await expect(filaUsuario).toBeVisible({ timeout: 15000 });
    await filaUsuario.locator('td').first().click();

    await expect(page.getByText(/Documentos de/i)).toBeVisible({ timeout: 10000 });

    const btnIssue = page.locator('button[title="Solicitar nueva carga con aclaración"]').first();
    await expect(btnIssue).toBeVisible({ timeout: 10000 });
    await btnIssue.evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

    const observacion = `E2E Issue ${Date.now()} - volver a subir el documento con mejor legibilidad.`;
    const dialogIssue = page.getByRole('dialog').filter({ hasText: /Marcar documento con issue/i }).first();
    await expect(dialogIssue).toBeVisible();
    await dialogIssue.locator('textarea').fill(observacion);

    const respuestaObservacionPromise = page.waitForResponse((response) => {
      return response.request().method() === 'POST' && /\/documentos\/\d+\/observaciones$/.test(new URL(response.url()).pathname);
    });
    await dialogIssue.getByRole('button', { name: 'Guardar observación' }).click();
    const respuestaObservacion = await respuestaObservacionPromise;
    const cuerpoObservacion = await respuestaObservacion.text();
    expect(
      respuestaObservacion.ok(),
      `Fallo POST observaciones (${respuestaObservacion.status()}): ${cuerpoObservacion}`,
    ).toBeTruthy();

    await expect(dialogIssue).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('button', { name: /^Cerrar$/ }).last().click();

    await goToProtectedRoute(page, operador, '/dashboard');
    await page.waitForLoadState('networkidle');

    const firmaToastIssue = await page.evaluate(() => window.sessionStorage.getItem('cas.documentos.issue.toast.v1'));
    expect(firmaToastIssue).toBeTruthy();

    const seccionDocumentacion = page.locator('section', { hasText: /Documentación/i }).first();
    await expect(seccionDocumentacion.getByText(/Tenes\s+\d+\s+issue/i)).toBeVisible();

    const tarjetaDocumentos = seccionDocumentacion.locator('a[href="/documentos"]').first();
    await expect(tarjetaDocumentos).toContainText(/Mis Documentos/i);
    await expect(tarjetaDocumentos).toContainText(/issue/i);
  });
});
