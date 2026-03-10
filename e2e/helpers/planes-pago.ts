/**
 * Playwright helpers para tests de Planes de Pago.
 * Funciones reutilizables para login como admin, navegar a la pantalla,
 * y completar el wizard con datos CASAC 2026.
 */
import { type Page, expect } from '@playwright/test';

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin';

/**
 * Login via Keycloak como ADMIN y esperar a llegar al dashboard.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/');

  // Click Iniciar sesión
  await page.click('button:has-text("Iniciar sesión")');

  // Esperar Keycloak
  await page.waitForURL(/.*keycloak.*/, { timeout: 15000 });

  await page.fill('#username', ADMIN_USERNAME);
  await page.fill('#password', ADMIN_PASSWORD);
  await page.click('input[type="submit"], button[type="submit"]');

  // Esperar redirección post-login
  await page.waitForURL(/\/(dashboard|onboarding|definicion)/, { timeout: 20000 });
}

/**
 * Navegar a la pantalla de Definición de Planes de Pago.
 */
export async function navegarADefinicionPlanes(page: Page) {
  await page.goto('/departamentos/economia/planes');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 2, name: 'Planes de Pago' })).toBeVisible();
}

/**
 * Abrir el wizard de creación de planes.
 */
export async function abrirWizard(page: Page) {
  await page.click('button:has-text("Nuevo Plan")');
  // Esperar que el dialog/wizard aparezca
  await page.waitForSelector('[role="dialog"], .wizard-container', { timeout: 5000 });
}

/**
 * Click en "Siguiente" dentro del wizard.
 */
export async function clickSiguiente(page: Page) {
  await page.click('button:has-text("Siguiente")');
  await page.waitForTimeout(300); // Esperar transición
}

/**
 * Click en "Anterior" dentro del wizard.
 */
export async function clickAnterior(page: Page) {
  await page.click('button:has-text("Anterior")');
  await page.waitForTimeout(300);
}

/**
 * Click "Confirmar" para enviar el plan.
 */
export async function clickConfirmar(page: Page) {
  await page.click('button:has-text("Confirmar")');
}

/**
 * Datos de Plan A por defecto (CASAC 2026).
 */
export const DATOS_CASAC_2026 = {
  planA: {
    codigo: 'PLAN-A-E2E-' + Date.now(),
    nombre: 'Plan A E2E Test',
    anio: '2026',
    montoTotal: '1375000',
    diaVencimiento: '10',
    mesInicio: '3',  // Marzo
    mesFin: '1',     // Enero
    minCuotas: '11',
    maxCuotas: '11',
    mesLimiteInscripcion: '10', // Octubre
    mesLimiteDev100: '9',  // Septiembre
    mesLimiteDev50: '10',  // Octubre
  },
  transicionAB: {
    montoDestino: '1856200',
    mesControl: '8',   // Agosto
    cuotasMin: '5',
    mesesAtraso: '2',
  },
  transicionBC: {
    montoDestino: '2000000',
    mesControl: '12',  // Diciembre
    cuotasMin: '1',
    mesesAtraso: '2',
  },
};

/**
 * Espera a que aparezca un toast del tipo especificado.
 */
export async function esperarToast(page: Page, tipo: 'success' | 'error', textoParcial?: string) {
  const toastSelector = `[data-sonner-toast][data-type="${tipo}"]`;
  const toast = page.locator(toastSelector).first();
  await expect(toast).toBeVisible({ timeout: 10000 });
  if (textoParcial) {
    await expect(toast).toContainText(textoParcial);
  }
}

/**
 * Cuenta cuántos planes hay en la tabla.
 */
export async function contarPlanesEnTabla(page: Page): Promise<number> {
  const filas = page.locator('table tbody tr, [data-testid="plan-row"]');
  return filas.count();
}

/**
 * Limpia planes de test creados en esta sesión (por código).
 */
export async function limpiarPlanesTest(_page: Page) {
  // TODO: Implementar limpieza vía API directa al backend
  // Por ahora los planes de test se identifican por el prefijo "PLAN-A-E2E-"
}
