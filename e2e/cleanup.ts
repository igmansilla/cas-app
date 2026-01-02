/**
 * Cleanup script - deletes E2E test users and families
 * Run before tests to ensure fresh state
 * 
 * Usage: npx tsx e2e/cleanup.ts
 */

import { deleteTestUser, TEST_USERS } from './helpers/keycloak';

async function cleanup() {
  console.log('🧹 Cleaning up E2E test data...\n');

  // Delete test users from Keycloak
  console.log('Deleting Keycloak users:');
  for (const [role, user] of Object.entries(TEST_USERS)) {
    try {
      await deleteTestUser(user.username);
    } catch (error) {
      console.log(`  ⚠️ Could not delete ${user.username}: ${error}`);
    }
  }

  console.log('\n✅ Cleanup complete!');
  console.log('💡 Now run: npm run test:e2e');
}

cleanup().catch(console.error);
