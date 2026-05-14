import { isStrictEmail, isStrongPassword } from './auth-validation';

describe('auth validation', () => {
  it('accepts emails with a domain and top-level domain', () => {
    expect(isStrictEmail('student@example.com')).toBe(true);
  });

  it('rejects emails without a top-level domain', () => {
    expect(isStrictEmail('hhfh@mail')).toBe(false);
  });

  it('accepts passwords with uppercase, lowercase and a number', () => {
    expect(isStrongPassword('Password1')).toBe(true);
  });

  it('rejects weak passwords', () => {
    expect(isStrongPassword('password')).toBe(false);
  });
});
