export function validateIPCRequest(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid IPC payload');
  }
  return payload;
}

export function validateAdminCredentials(username: string, passwordHash: string) {
  if (typeof username !== 'string' || username.trim().length < 3) {
    throw new Error('Invalid username');
  }
  if (typeof passwordHash !== 'string' || passwordHash.length < 32) {
    throw new Error('Invalid password hash');
  }
  return true;
}
