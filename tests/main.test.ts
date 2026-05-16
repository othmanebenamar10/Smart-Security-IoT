import { validateIPCRequest } from '../security/validate';

describe('Secure IPC validation', () => {
  it('accepts a plain object payload', () => {
    expect(validateIPCRequest({ command: 'fetch' })).toEqual({ command: 'fetch' });
  });

  it('rejects invalid payloads', () => {
    expect(() => validateIPCRequest(null)).toThrow('Invalid IPC payload');
  });
});
