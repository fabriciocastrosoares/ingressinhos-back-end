import { BcryptService } from './bcrypt.service';

describe('BcryptService', () => {
  let service: BcryptService;

  beforeEach(() => {
    service = new BcryptService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash a password', () => {
    const password = 'my-secret-password';
    const hash = service.hash(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  it('should generate different hashes for the same password', () => {
    const password = 'my-secret-password';

    const firstHash = service.hash(password);
    const secondHash = service.hash(password);

    expect(firstHash).not.toBe(secondHash);
  });

  it('should return true when the password matches the hash', () => {
    const password = 'my-secret-password';
    const hash = service.hash(password);

    expect(service.isMatch(password, hash)).toBe(true);
  });

  it('should return false when the password does not match the hash', () => {
    const hash = service.hash('correct-password');

    expect(service.isMatch('wrong-password', hash)).toBe(false);
  });
});
