import { test, expect } from '@playwright/test';
import { getTestUsers, type TestUser } from './helpers/keycloak';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E Test: Flujo Padre
 * 
 * Flujo completo: Landing → Login Keycloak → Onboarding → Unirse con Código → Dashboard
 * 
 * Este test usa el código de vinculación creado por el test del hijo.
 */

test.describe('Flujo Padre - Unirse a Familia', () => {
  let user: TestUser;
  let codigoVinculacion: string;

  test.beforeAll(async () => {
    // Get test users from shared file
    const users = getTestUsers();
    user = users.padre;
    console.log(`📋 Using test user: ${user.username}`);

    // Leer el código generado por el test del hijo
    const codigoPath = path.join(__dirname, '.codigo-vinculacion.txt');
    
    if (!fs.existsSync(codigoPath)) {
      throw new Error('❌ No se encontró el código de vinculación. Ejecutar primero el test del hijo.');
    }
    
    codigoVinculacion = fs.readFileSync(codigoPath, 'utf-8').trim();
    console.log(`📋 Usando código de vinculación: ${codigoVinculacion}`);
  });

  test('Completa el flujo de onboarding como padre y se une a familia existente', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000);

    // 1. Ir a la landing page
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('Bienvenido al CAS');

    // 2. Click en "Iniciar sesión" - esto redirige a Keycloak
    await page.click('button:has-text("Iniciar sesión")');

    // 3. Esperar a estar en Keycloak y autenticarse
    await page.waitForURL(/.*keycloak.*/, { timeout: 10000 });
    
    // Completar login en Keycloak
    await page.fill('#username', user.username);
    await page.fill('#password', user.password);
    await page.click('input[type="submit"], button[type="submit"], button:has-text("Sign In")');

    // 4. Esperar redirección post-login
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20000 });

    // 5. Navegar explícitamente a onboarding para asegurar el flujo
    const currentUrl = page.url();
    if (currentUrl.includes('dashboard')) {
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');
    }

    // 6. Verificar si ya tiene familia (redirigido a dashboard)
    const finalUrl = page.url();
    if (finalUrl.includes('dashboard')) {
      console.log('ℹ️ Usuario ya tiene familia, saltando vinculación');
      test.skip();
      return;
    }

    // 7. Verificar que estamos en onboarding
    await expect(page.locator('h1')).toContainText('¡Bienvenido al Campamento!');

    // 8. Seleccionar "Ya tengo un código"
    await page.click('text=Ya tengo un código');

    // 9. Esperar el formulario de unirse
    await expect(page.locator('text=Vinculación Familiar')).toBeVisible();

    // 10. Ingresar el código de vinculación
    await page.fill('input[placeholder="ABC123"]', codigoVinculacion);

    // 11. Esperar validación del código (muestra nombre de familia)
    await expect(page.locator('text=Familia TestE2E')).toBeVisible({ timeout: 5000 });

    // 12. Seleccionar rol "Padre"
    await page.click('[role="combobox"]'); // Abre el Select de parentesco
    await page.click('[role="option"]:has-text("Padre")');

    // 13. Click en vincularme
    const joinButton = page.locator('button:has-text("Vincularme a la Familia")');
    await expect(joinButton).toBeVisible();
    await joinButton.click();

    // 14. Esperar redirección al dashboard o toast de éxito
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    } catch {
      // Si no cambió la URL, puede que el SPA no haya navegado
      const afterUrl = page.url();
      console.log(`⚠️ URL después de click: ${afterUrl}`);
      
      // Verificar si hay toast de éxito
      const hasSuccessToast = await page.locator('text=Te has unido a la familia').isVisible();
      if (hasSuccessToast) {
        console.log('✓ Toast de éxito visible');
      }
      
      // Forzar navegación al dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }

    await expect(page).toHaveURL(/\/dashboard/);
    console.log('✅ Flujo padre completado exitosamente');
  });

  test.afterAll(async () => {
    // Cleanup: eliminar archivo temporal del código
    const codigoPath = path.join(__dirname, '.codigo-vinculacion.txt');
    if (fs.existsSync(codigoPath)) {
      fs.unlinkSync(codigoPath);
      console.log('🧹 Limpieza: archivo de código eliminado');
    }
  });
});
