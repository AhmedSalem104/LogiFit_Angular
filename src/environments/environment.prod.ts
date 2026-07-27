export const environment = {
  production: true,
  // Production API base. Vercel rewrites /api requests to this backend via vercel.json.
  // Keep browser requests same-origin; vercel.json rewrites /api to the current backend.
  apiUrl: '/api',
  platformUrl: 'https://logicfit-saas-model.runasp.net',
  platformDashboardUrl: 'https://logi-fit-platform-admin-dashboard.vercel.app',
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
