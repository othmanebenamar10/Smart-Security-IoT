import crypto from 'crypto';

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

export function verifyAdmin(username: string, password: string, storedHash: string) {
  if (username !== process.env.ADMIN_USERNAME) {
    return false;
  }
  const candidateHash = hashPassword(password);
  return candidateHash === storedHash;
}
