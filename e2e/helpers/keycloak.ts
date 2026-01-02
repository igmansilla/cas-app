/**
 * Keycloak API helper for E2E tests
 * Handles user creation and token retrieval
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYCLOAK_URL = process.env.E2E_KEYCLOAK_URL || 'https://keycloak-dev-6a14.up.railway.app';
const REALM = process.env.E2E_KEYCLOAK_REALM || 'cas';
const CLIENT_ID = process.env.E2E_KEYCLOAK_CLIENT_ID || 'frontend-app';
const ADMIN_CLIENT_ID = process.env.E2E_KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
const ADMIN_USERNAME = process.env.E2E_KEYCLOAK_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.E2E_KEYCLOAK_ADMIN_PASSWORD || 'admin';

// File to store test users for consistent access across test files
const TEST_USERS_FILE = path.join(__dirname, '..', '.test-users.json');

export interface TestUser {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Get or create test users with consistent timestamp
 */
function getOrCreateTestUsers(): Record<string, TestUser> {
  // Try to read from file first (set by setup)
  if (fs.existsSync(TEST_USERS_FILE)) {
    const data = fs.readFileSync(TEST_USERS_FILE, 'utf-8');
    return JSON.parse(data);
  }

  // Generate new users if file doesn't exist (first run or setup)
  const timestamp = Date.now();
  const users: Record<string, TestUser> = {
    hijo: {
      username: `test-hijo-${timestamp}`,
      password: 'Test123!',
      email: `test-hijo-${timestamp}@e2e.local`,
      firstName: 'Test',
      lastName: 'Hijo',
    },
    padre: {
      username: `test-padre-${timestamp}`,
      password: 'Test123!',
      email: `test-padre-${timestamp}@e2e.local`,
      firstName: 'Test',
      lastName: 'Padre',
    },
  };

  // Save to file for other test files to use
  fs.writeFileSync(TEST_USERS_FILE, JSON.stringify(users, null, 2));
  
  return users;
}

// Export as lazy getter to ensure consistency
export const TEST_USERS = getOrCreateTestUsers();

/**
 * Get admin token for Keycloak operations
 */
async function getAdminToken(): Promise<string> {
  const response = await fetch(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: ADMIN_CLIENT_ID,
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get admin token: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Check if a user exists in Keycloak
 */
async function userExists(adminToken: string, username: string): Promise<boolean> {
  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}&exact=true`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to check user: ${response.status}`);
  }

  const users = await response.json();
  return users.length > 0;
}

/**
 * Create a user in Keycloak
 */
async function createUser(adminToken: string, user: TestUser): Promise<void> {
  const response = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: user.password,
            temporary: false,
          },
        ],
      }),
    }
  );

  if (!response.ok && response.status !== 409) {
    throw new Error(`Failed to create user: ${response.status} ${await response.text()}`);
  }
}

/**
 * Ensure test users exist in Keycloak
 */
export async function ensureTestUsersExist(): Promise<void> {
  console.log('🔐 Creating fresh Keycloak test users...');
  
  // Delete old users file to force regeneration
  if (fs.existsSync(TEST_USERS_FILE)) {
    fs.unlinkSync(TEST_USERS_FILE);
  }
  
  // Regenerate users with new timestamp
  const timestamp = Date.now();
  const users: Record<string, TestUser> = {
    hijo: {
      username: `test-hijo-${timestamp}`,
      password: 'Test123!',
      email: `test-hijo-${timestamp}@e2e.local`,
      firstName: 'Test',
      lastName: 'Hijo',
    },
    padre: {
      username: `test-padre-${timestamp}`,
      password: 'Test123!',
      email: `test-padre-${timestamp}@e2e.local`,
      firstName: 'Test',
      lastName: 'Padre',
    },
  };
  
  // Save to file BEFORE creating in Keycloak
  fs.writeFileSync(TEST_USERS_FILE, JSON.stringify(users, null, 2));
  console.log(`   Timestamp: ${timestamp}`);
  
  const adminToken = await getAdminToken();

  for (const [role, user] of Object.entries(users)) {
    const exists = await userExists(adminToken, user.username);
    if (exists) {
      console.log(`  ✓ User ${user.username} (${role}) already exists`);
    } else {
      await createUser(adminToken, user);
      console.log(`  ✓ Created user ${user.username} (${role})`);
    }
  }
}

/**
 * Get the saved test users (call this from test files)
 */
export function getTestUsers(): Record<string, TestUser> {
  if (!fs.existsSync(TEST_USERS_FILE)) {
    throw new Error('Test users file not found. Run setup first.');
  }
  return JSON.parse(fs.readFileSync(TEST_USERS_FILE, 'utf-8'));
}

/**
 * Get user token from Keycloak via Resource Owner Password Grant
 */
export async function getKeycloakToken(username: string, password: string): Promise<{
  accessToken: string;
  refreshToken: string;
  idToken: string;
}> {
  const response = await fetch(
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username,
        password,
        scope: 'openid profile email',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
  };
}

/**
 * Delete user from Keycloak (cleanup)
 */
export async function deleteTestUser(username: string): Promise<void> {
  const adminToken = await getAdminToken();
  
  // Find user ID
  const searchResponse = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${username}&exact=true`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  
  const users = await searchResponse.json();
  if (users.length === 0) return;
  
  // Delete user
  await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${users[0].id}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  
  console.log(`  ✓ Deleted user ${username}`);
}

/**
 * Delete all test users matching pattern
 */
export async function deleteAllTestUsers(): Promise<void> {
  const adminToken = await getAdminToken();
  
  // Search for users matching test pattern
  const searchResponse = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?search=test-&max=100`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  
  const users = await searchResponse.json();
  
  for (const user of users) {
    if (user.username.startsWith('test-hijo-') || user.username.startsWith('test-padre-')) {
      await fetch(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      console.log(`  ✓ Deleted user ${user.username}`);
    }
  }
}

/**
 * Cleanup test users file
 */
export function cleanupTestUsersFile(): void {
  if (fs.existsSync(TEST_USERS_FILE)) {
    fs.unlinkSync(TEST_USERS_FILE);
  }
}
