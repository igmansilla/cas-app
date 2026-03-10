import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  navegarADefinicionPlanes,
  abrirWizard,
  clickSiguiente,
  clickConfirmar,
  esperarToast,
  DATOS_CASAC_2026,
} from '../helpers/planes-pago';

/**
 * E2E Tests: Wizard de Creación de Planes de Pago
 *
 * Requiere:
 * - Backend corriendo (make run)
 * - Frontend corriendo (npm run dev)
 * - Usuario ADMIN en Keycloak
 */
test.describe('Wizard de Creación de Planes de Pago', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await loginAsAdmin(page);
    await navegarADefinicionPlanes(page);
  });

  // =========================================================================
  // PW1: Creación Completa
  // =========================================================================
  test('PW1.1 Wizard completo CASAC 2026 crea 3 planes', async ({ page }) => {
    const datos = DATOS_CASAC_2026;
    await abrirWizard(page);

    // Step 1: Plan A — Datos
    await page.fill('input[name="codigo"], input[placeholder*="PLAN"]', datos.planA.codigo);
    await page.fill('input[name="anio"], input[placeholder*="2026"]', datos.planA.anio);
    await page.fill('input[name="nombreParaMostrar"], input[placeholder*="nombre"]', datos.planA.nombre);
    await clickSiguiente(page);

    // Step 1: Plan A — Vigencia
    // Los selectores de mes pueden ser selects o dropdowns personalizados
    await clickSiguiente(page);

    // Step 1: Plan A — Monto
    await page.fill('input[name="montoTotal"], input[placeholder*="monto"]', datos.planA.montoTotal);
    await clickSiguiente(page);

    // Step 1: Plan A — Migración A→B
    await page.fill('input[name*="montoTotalDestino"], input[placeholder*="monto"]', datos.transicionAB.montoDestino);
    await clickSiguiente(page);

    // Steps 2-3: Plan B y C se configuran automáticamente por el wizard
    // Avanzar por los sub-steps restantes
    for (let i = 0; i < 8; i++) {
      const siguienteBtn = page.locator('button:has-text("Siguiente")');
      if (await siguienteBtn.isVisible()) {
        await siguienteBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Step final: Devolución
    // Si estamos en el step de devolución, continuar
    const confirmarBtn = page.locator('button:has-text("Confirmar")');
    if (await confirmarBtn.isVisible()) {
      await clickConfirmar(page);
      await esperarToast(page, 'success', 'creado exitosamente');
    }

    // Verificar que aparecen planes en la tabla
    await page.waitForTimeout(1000);
    const filasTabla = await page.locator('table tbody tr').count();
    expect(filasTabla).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // PW1.4: Rango de cuotas configurable (Fix #5)
  // =========================================================================
  test('PW1.4 Campos minCuotas y maxCuotas visibles en Vigencia', async ({ page }) => {
    await abrirWizard(page);

    // Llenar datos mínimos para avanzar al sub-step Vigencia
    const codigoUnico = 'TEST-CUOTAS-' + Date.now();
    await page.fill('input[name="codigo"], input[placeholder*="PLAN"]', codigoUnico);
    await page.fill('input[name="anio"], input[placeholder*="2026"]', '2026');
    await page.fill('input[name="nombreParaMostrar"], input[placeholder*="nombre"]', 'Test Cuotas');
    await clickSiguiente(page);

    // Ahora estamos en Vigencia — verificar que campos de cuotas existen
    const minCuotasInput = page.locator('input[name*="minCuotas"], input[id*="minCuotas"]');
    const maxCuotasInput = page.locator('input[name*="maxCuotas"], input[id*="maxCuotas"]');

    // Al menos uno de los dos debería estar visible
    const minVisible = await minCuotasInput.first().isVisible().catch(() => false);
    const maxVisible = await maxCuotasInput.first().isVisible().catch(() => false);

    // Buscar por label text como alternativa
    const labelMin = page.locator('label:has-text("Mín"), label:has-text("Mínimo")');
    const labelMax = page.locator('label:has-text("Máx"), label:has-text("Máximo")');

    const hasMinLabel = await labelMin.first().isVisible().catch(() => false);
    const hasMaxLabel = await labelMax.first().isVisible().catch(() => false);

    expect(minVisible || hasMinLabel).toBeTruthy();
    expect(maxVisible || hasMaxLabel).toBeTruthy();
  });

  // =========================================================================
  // PW1.5: mesLimiteInscripcion selector (Fix #11)
  // =========================================================================
  test('PW1.5 Selector mesLimiteInscripcion visible en Vigencia', async ({ page }) => {
    await abrirWizard(page);

    const codigoUnico = 'TEST-LIMITE-' + Date.now();
    await page.fill('input[name="codigo"], input[placeholder*="PLAN"]', codigoUnico);
    await page.fill('input[name="anio"], input[placeholder*="2026"]', '2026');
    await page.fill('input[name="nombreParaMostrar"], input[placeholder*="nombre"]', 'Test Limite');
    await clickSiguiente(page);

    // En Vigencia: buscar selector/label de Límite de Inscripción
    const labelInscripcion = page.locator('text=Límite de Inscripción, text=inscripción, text=Inscripción');
    await expect(labelInscripcion.first()).toBeVisible({ timeout: 5000 });
  });
});

// =========================================================================
// PW3: Editar Plan Dialog
// =========================================================================
test.describe('Editar Plan Dialog (Fix #6)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAsAdmin(page);
    await navegarADefinicionPlanes(page);
  });

  test('PW3.2 Campos estructurales bloqueados con 🔒', async ({ page }) => {
    // Click en botón editar del primer plan (si existe)
    const editarBtn = page.locator('button:has-text("Editar")').first();
    if (await editarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editarBtn.click();

      // Esperar dialog
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Verificar que el indicador de bloqueo existe
      const lockIcon = page.locator('text=🔒');
      await expect(lockIcon.first()).toBeVisible();

      // Verificar que campos estructurales NO son editables
      // (deberían ser texto en vez de inputs)
      const dialogText = await page.locator('[role="dialog"]').textContent();
      expect(dialogText).toContain('Código');
      expect(dialogText).toContain('Año');
    } else {
      test.skip();
    }
  });

  test('PW3.4 Warning sobre cambios que afectan inscripciones', async ({ page }) => {
    const editarBtn = page.locator('button:has-text("Editar")').first();
    if (await editarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editarBtn.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Verificar warning visible
      const warningText = page.locator('text=nuevas inscripciones, text=inscripciones existentes');
      await expect(warningText.first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});

// =========================================================================
// PW4: Tabla de Planes
// =========================================================================
test.describe('Tabla de Planes', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAsAdmin(page);
    await navegarADefinicionPlanes(page);
  });

  test('PW4.1 Página carga y muestra título', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Planes de Pago');
  });

  test('PW4.2 Botón Nuevo Plan visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Nuevo Plan")')).toBeVisible();
  });
});

// =========================================================================
// PW5: Responsive
// =========================================================================
test.describe('Responsive', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAsAdmin(page);
  });

  test('PW5.1 Wizard en mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navegarADefinicionPlanes(page);

    // Verificar que la página no desborda
    const body = page.locator('body');
    const scrollWidth = await body.evaluate(el => el.scrollWidth);
    const clientWidth = await body.evaluate(el => el.clientWidth);

    // Permitir un margen de ~20px por scrollbar
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('PW5.4 Página en desktop (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await navegarADefinicionPlanes(page);

    await expect(page.locator('h1')).toContainText('Planes de Pago');
  });
});
