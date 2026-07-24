export const environment = {
  production: false,
  // Relative — proxied to the backend (proxy.conf.json in dev, vercel.json in prod)
  // to avoid CORS. The real backend is https://logicfit.runasp.net/api
  apiUrl: 'https://logicfit-saas.runasp.net/api',
  platformUrl: 'https://logicfit-saas.runasp.net',
  platformDashboardUrl: 'http://localhost:4300',
  tokenKey: 'logicfit_token',
  refreshTokenKey: 'logicfit_refresh_token',
  userKey: 'logicfit_user',
  permissionsKey: 'logicfit_permissions',
  tenantIdKey: 'logicfit_tenant_id',
  brandingKey: 'logicfit_branding',
  themeKey: 'logicfit_theme',
  langKey: 'logicfit_lang',
  defaultLang: 'en',
};
