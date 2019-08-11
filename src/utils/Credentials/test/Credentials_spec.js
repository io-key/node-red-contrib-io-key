const Credentials = require('..');

describe('Make encoded credentials', () => {
  it('should return base64 encoded credentials', () => {
    const auth = {
      tenant: 'testTenant.cumulocity.com',
      username: 'user@name.com',
      password: 'p4ssw0rd!'
    };
    const encodedCredentiels = Credentials.encode(auth);

    expect(encodedCredentiels).toBe(
      'dGVzdFRlbmFudC91c2VyQG5hbWUuY29tOnA0c3N3MHJkIQ=='
    );
  });

  it('should validate bad credentials', () => {
    expect(
      Credentials.validateCredentials({
        tenant: '',
        username: 'user@name.com',
        password: 'p4ssw0rd!'
      })
    ).toBeFalsy();

    expect(
      Credentials.validateCredentials({
        tenant: 'tenant',
        username: '',
        password: 'p4ssw0rd!'
      })
    ).toBeFalsy();

    expect(
      Credentials.validateCredentials({
        tenant: 'tenant',
        username: 'hello@1234.com',
        password: ''
      })
    ).toBeFalsy();
  });
  it('should validate good credentials', () => {
    const auth = {
      tenant: 'testTenant.cumulocity.com',
      username: 'user@name.com',
      password: 'p4ssw0rd!'
    };
    expect(Credentials.validateCredentials(auth)).toBe(true);
  });
  it('should return the tenantname', () => {
    expect(
      Credentials.getTenantName({
        tenant: 'name.hostname.com'
      })
    ).toBe('name');
    expect(
      Credentials.getTenantName({
        tenant: undefined
      })
    ).toBe('');
    expect(
      Credentials.getTenantName({
        tenant: ''
      })
    ).toBe('');
  });
});
