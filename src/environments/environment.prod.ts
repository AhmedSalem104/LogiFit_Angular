export const environment = {
  production: true,
  // Relative — proxied to the backend via vercel.json rewrites to avoid CORS.
  // The real backend is https://logicfit-platform.runasp.net/api
  apiUrl: '/api',
  platformUrl: 'https://logicfit-platform.runasp.net',
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
