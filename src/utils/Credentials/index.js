class Credentials {
  /**
   * Creates a base64 encoded string for http basic auth
   *
   * @param  {string} object.tenant the name of the user's tenant
   * @param  {string} object.username the user's name
   * @param  {string} object.password the user's password
   */
  static encode({ tenant, username, password }) {
    if (!this.validateCredentials({ tenant, username, password })) {
      return '';
    }
    const tenantname = this.getTenantName({ tenant });

    const credentials = `${tenantname}/${username}:${password}`;
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
  static validateCredentials({ tenant, username, password }) {
    if (typeof tenant !== 'string' || tenant.length === 0) return false;
    if (typeof username !== 'string' || username.length === 0) return false;
    if (typeof password !== 'string' || password.length === 0) return false;
    return true;
  }

  /**
   * Return the tenantname from the tenant url
   *
   * @param  {string} object.tenant the name of the user's tenant
   */
  static getTenantName({ tenant }) {
    if (typeof tenant !== 'string' || tenant.length === 0) return '';

    return tenant.split('.')[0];
  }
}

module.exports = Credentials;
