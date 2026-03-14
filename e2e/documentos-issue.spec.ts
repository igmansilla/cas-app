import { test, expect, type Page } from '@playwright/test';
import { ensureUserRealmRoles, getKeycloakToken, getTestUsers, type TestUser } from './helpers/keycloak';

const API_BASE_URL = (process.env.E2E_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');

type UsuarioActual = {
  id: number;
  keycloakId: string;
  email?: string | null;
  nombreMostrar?: string | null;
};

type DocumentoResumen = {
  id: number | null;
  tipoDocumentoId: number;
};

async function loginWithCredentials(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.click('button:has-text("Iniciar sesión")');
  await page.waitForURL(/.*keycloak.*/, { timeout: 15000 });

  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('input[type="submit"], button[type="submit"], button:has-text("Sign In")');
  await page.waitForURL(/\/(dashboard|documentos|onboarding)/, { timeout: 25000 });
}

async function apiGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${path} -> ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, accessToken: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} -> ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

test.describe('Documentos - issue visible en home', () => {
  test('dirigente/secretario marca issue en reportes y aparece toast/badge en dashboard', async ({ page }) => {
    test.setTimeout(120000);

    const users = getTestUsers();
    const operador: TestUser = users.padre;

    // Hace al usuario de pruebas apto para Reportes y evita redirect de onboarding por rol dirigente.
    await ensureUserRealmRoles(operador.username, ['DIRIGENTE', 'SECRETARIO']);

    const tokens = await getKeycloakToken(operador.username, operador.password);
    const operadorActual = await apiGet<UsuarioActual>('/usuarios/yo', tokens.accessToken);

    const keycloakId = operadorActual.keycloakId;
    const searchTerm = (operadorActual.email || operadorActual.nombreMostrar || '').trim();

    test.skip(!keycloakId, 'No se pudo resolver keycloakId para el usuario operador de pruebas');
    test.skip(!searchTerm, 'No hay email/nombre para filtrar al usuario en reportes');

    const docsIniciales = await apiGet<DocumentoResumen[]>(
      `/documentos/keycloak/${encodeURIComponent(keycloakId)}`,
      tokens.accessToken,
    );

    test.skip(docsIniciales.length === 0, 'No hay tipos de documento aplicables para el operador de pruebas');

    // Prepara un documento real para que exista el boton "Marcar issue" en reportes.
    const tipoDocumentoId = docsIniciales[0].tipoDocumentoId;
    await apiPost('/documentos', tokens.accessToken, {
      tipoDocumentoId,
      usuarioId: operadorActual.id,
      respuestas: {},
      finalizar: false,
    });

    const docsActualizados = await apiGet<DocumentoResumen[]>(
      `/documentos/keycloak/${encodeURIComponent(keycloakId)}`,
      tokens.accessToken,
    );
    const documentoConId = docsActualizados.find((doc) => doc.tipoDocumentoId === tipoDocumentoId && doc.id !== null);

    test.skip(!documentoConId, 'No se pudo crear un documento iniciable para marcar issue');

    await loginWithCredentials(page, operador.username, operador.password);
    await page.goto('/documentos');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /Reportes/i }).click();
    await page.getByPlaceholder('Buscar por nombre o email...').fill(searchTerm);

    const filaUsuario = page.locator('tbody tr', { hasText: searchTerm }).first();
    await expect(filaUsuario).toBeVisible({ timeout: 15000 });
    await filaUsuario.locator('td').first().click();

    await expect(page.getByText(/Documentos de/i)).toBeVisible({ timeout: 10000 });

    const btnIssue = page.getByRole('button', { name: /Marcar issue|Editar issue/i }).first();
    await expect(btnIssue).toBeVisible({ timeout: 10000 });
    await btnIssue.click();

    const observacion = `E2E Issue ${Date.now()} - volver a subir el documento con mejor legibilidad.`;
    const dialogIssue = page.getByRole('dialog').filter({ hasText: /Marcar documento con issue/i }).first();
    await expect(dialogIssue).toBeVisible();
    await dialogIssue.locator('textarea').fill(observacion);
    await dialogIssue.getByRole('button', { name: 'Guardar observación' }).click();

    const toastSuccess = page
      .locator('[data-sonner-toast][data-type="success"]')
      .filter({ hasText: /Observación registrada/i })
      .first();
    await expect(toastSuccess).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /^Cerrar$/ }).last().click();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const toastIssueHome = page
      .locator('[data-sonner-toast][data-type="error"]')
      .filter({ hasText: /issue/i })
      .first();
    await expect(toastIssueHome).toBeVisible({ timeout: 10000 });

    const seccionDocumentacion = page.locator('section', { hasText: /Documentación/i }).first();
    await expect(seccionDocumentacion.getByText(/issue/i)).toBeVisible();

    const tarjetaDocumentos = seccionDocumentacion.locator('a[href="/documentos"]').first();
    await expect(tarjetaDocumentos).toContainText(/Mis Documentos/i);
    await expect(tarjetaDocumentos).toContainText(/issue/i);
  });
});
