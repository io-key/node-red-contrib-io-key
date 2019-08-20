const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const responseLoginOptions = require('./data/response_loginOptions.json');
const Credentials = require('..');

describe('Make encoded credentials', () => {
  it('should return base64 encoded credentials', () => {
    const encodedCredentiels = Credentials.encode(
      'testTenant',
      'user@name.com',
      'p4ssw0rd!'
    );

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

  it('should return the tenantId', async done => {
    const mock = new MockAdapter(axios);

    mock
      .onGet('https://myTenant.cumulocity.com/tenant/loginOptions')
      .reply(200, responseLoginOptions);

    Credentials.getTenantId('myTenant.cumulocity.com')
      .then(id => {
        expect(id).toEqual('tenantId');
        done();
      })
      .catch(e => {
        done.fail(e);
      });
  });
});
