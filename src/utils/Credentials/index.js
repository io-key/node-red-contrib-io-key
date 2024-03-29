const axios = require('axios');

class Credentials {
  constructor({ tenant, username, password }) {
    this.hostname = tenant;
    this.username = username;
    this.password = password;
    this.tenantId = '';
  }

  /**
   * Creates a base64 encoded string for http basic auth
   *
   * @param  {string} tenant the name of the user's tenant
   * @param  {string} username the user's name
   * @param  {string} password the user's password
   */
  static encode(tenantId, username, password) {
    const credentials = `${tenantId}/${username}:${password}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return encodedCredentials;
  }

  /**
   * Checks if the credentials are valid
   *
   * @param  {string} object.tenant the name of the user's tenant
   * @param  {string} object.username the user's name
   * @param  {string} object.password the user's password
   */
  static validateCredentials(auth) {
    if (auth === null) return false;

    const { tenant, username, password } = auth;

    if (typeof tenant !== 'string' || tenant.length === 0) return false;
    if (tenant.split('.').length !== 3) return false;
    if (typeof username !== 'string' || username.length === 0) return false;
    if (typeof password !== 'string' || password.length === 0) return false;
    return true;
  }

  /**
   * Returns the tenant id
   *
   * @param  {string} tenantId the id of the user's tenant
   */
  static getTenantId(hostname) {
    return new Promise((resolve, reject) => {
      axios
        .get(`https://${hostname}/tenant/loginOptions`, {})
        .then(response => {
          const options = response.data.loginOptions[0];
          const url = options.self;

          const host = url.split('/')[2];
          const id = host.split('.')[0];

          resolve(id);
        })
        .catch(e => {
          // On some tenants this request's will fail but they could be still valid
          const id = hostname.split('.')[0];
          resolve(id);
        });
    });
  }

  /**
   * Returns encoded credentials
   */
  getEncodedCredentials() {
    return new Promise((resolve, reject) => {
      if (
        !Credentials.validateCredentials({
          tenant: this.hostname,
          username: this.username,
          password: this.password
        })
      ) {
        reject({ error: 'Invalid credentials' });
        return;
      }

      if (this.tenantId === '') {
        Credentials.getTenantId(this.hostname)
          .then(id => {
            this.tenantId = id;
            resolve(
              Credentials.encode(this.tenantId, this.username, this.password)
            );
          })
          .catch(e => {
            reject(e);
          });
      } else {
        resolve(
          Credentials.encode(this.tenantId, this.username, this.password)
        );
      }
    });
  }
}

module.exports = Credentials;
