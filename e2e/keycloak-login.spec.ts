import { test, expect } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';

const KEYCLOAK_URL = process.env.E2E_KEYCLOAK_URL || process.env.VITE_KEYCLOAK_URL || 'http://localhost:8181';
const REALM = process.env.E2E_KEYCLOAK_REALM || process.env.VITE_KEYCLOAK_REALM || 'cas';
const CLIENT_ID = process.env.E2E_KEYCLOAK_CLIENT_ID || process.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend-app';

const ADMIN_CLIENT_ID = process.env.E2E_KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const ADMIN_USERNAME = process.env.E2E_KEYCLOAK_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.E2E_KEYCLOAK_ADMIN_PASSWORD || 'admin';

const PREFERRED_USER_EMAIL = process.env.E2E_PREFERRED_USER_EMAIL || 'igmansilla98@gmail.com';
const PREFERRED_USER_PASSWORD = process.env.E2E_PREFERRED_USER_PASSWORD || 'IgmansillaE2E123!';
const PREPARE_USER = process.env.E2E_PREPARE_PREFERRED_USER !== 'false';

function toBase64Url(value: Buffer): string {
  return value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildPkcePair(): { verifier: string; challenge: string } {
  const verifier = toBase64Url(randomBytes(32));
  const challenge = toBase64Url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

async function getAdminToken(): Promise<string> {
  const response = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: ADMIN_CLIENT_ID,
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo obtener token admin de Keycloak: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

async function getUserByEmail(adminToken: string, email: string): Promise<{ id: string; username: string; email: string; firstName?: string; lastName?: string } | null> {
  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${encodeURIComponent(email)}&exact=true`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );

  if (!response.ok) {
    throw new Error(`No se pudo buscar usuario por email en Keycloak: ${response.status} ${await response.text()}`);
  }

  const users = await response.json() as Array<{ id: string; username: string; email: string; firstName?: string; lastName?: string }>;
  if (users.length === 0) {
    return null;
  }

  return users[0];
}

async function setUserPassword(adminToken: string, userId: string, password: string): Promise<void> {
  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/reset-password`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'password',
        value: password,
        temporary: false,
      }),
    },
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`No se pudo resetear password del usuario preferido: ${response.status} ${await response.text()}`);
  }
}

async function preparePreferredUser(): Promise<{ username: string; email: string; firstName: string; lastName: string }> {
  const adminToken = await getAdminToken();
  const user = await getUserByEmail(adminToken, PREFERRED_USER_EMAIL);

  if (!user) {
    throw new Error(
      `No existe el usuario preferido (${PREFERRED_USER_EMAIL}) en realm ${REALM}. ` +
      'Podés crearlo manualmente o cambiar E2E_PREFERRED_USER_EMAIL.',
    );
  }

  if (PREPARE_USER) {
    await setUserPassword(adminToken, user.id, PREFERRED_USER_PASSWORD);
  }

  return {
    username: user.username || user.email,
    email: user.email,
    firstName: (user.firstName || 'Ignacio').trim(),
    lastName: (user.lastName || 'Mansilla').trim(),
  };
}

async function completeUpdateAccountInfoIfNeeded(
  page: import('@playwright/test').Page,
  preferredUser: { firstName: string; lastName: string },
): Promise<void> {
  const heading = page.getByRole('heading', { name: /Update Account Information/i }).first();
  const isRequiredAction = await heading.isVisible({ timeout: 3000 }).catch(() => false);
  if (!isRequiredAction) {
    return;
  }

  const firstNameInput = page.locator('#firstName').first();
  const lastNameInput = page.locator('#lastName').first();

  await expect(firstNameInput).toBeVisible({ timeout: 10000 });
  await expect(lastNameInput).toBeVisible({ timeout: 10000 });

  const firstNameValue = (await firstNameInput.inputValue()).trim();
  const lastNameValue = (await lastNameInput.inputValue()).trim();

  if (!firstNameValue) {
    await firstNameInput.fill(preferredUser.firstName);
  }
  if (!lastNameValue) {
    await lastNameInput.fill(preferredUser.lastName);
  }

  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  await submit.click();
}

test.describe('Keycloak Login - usuario preferido', () => {
  test('permite loguear en Keycloak con usuario preferido', async ({ page }) => {
    test.setTimeout(120000);

    const preferredUser = await preparePreferredUser();

    const redirectUri = process.env.E2E_REDIRECT_URI || 'http://localhost:5173/';
    const pkce = buildPkcePair();
    const authUrl = new URL(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`);
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile');
    authUrl.searchParams.set('code_challenge', pkce.challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Probamos login en Keycloak directamente vía Authorization Code + PKCE del cliente frontend-app.
    await page.goto(authUrl.toString());
    const alreadyRedirectedWithCode = await page
      .waitForURL((url) => {
        return url.origin + url.pathname === redirectUri && url.searchParams.has('code');
      }, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!alreadyRedirectedWithCode) {
      const usernameInput = page.locator('#username').first();
      const passwordInput = page.locator('#password').first();
      const submitButton = page.locator('input[type="submit"], button[type="submit"]').first();

      await expect(usernameInput).toBeVisible({ timeout: 20000 });
      await expect(passwordInput).toBeVisible({ timeout: 20000 });

      await usernameInput.fill(preferredUser.username || preferredUser.email);
      await passwordInput.fill(PREFERRED_USER_PASSWORD);
      await submitButton.click();

      await completeUpdateAccountInfoIfNeeded(page, preferredUser);

      await page.waitForURL((url) => {
        return url.origin + url.pathname === redirectUri && url.searchParams.has('code');
      }, { timeout: 30000 });
    }

    const currentUrl = new URL(page.url());
    expect(currentUrl.searchParams.get('code')).toBeTruthy();
  });
});
