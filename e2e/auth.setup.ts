import { test as setup } from '@playwright/test';
import { ensureTestUsersExist } from './helpers/keycloak';

/**
 * Global setup - runs before all tests
 * Creates test users in Keycloak if they don't exist
 */
setup('Create Keycloak test users', async () => {
  await ensureTestUsersExist();
});
