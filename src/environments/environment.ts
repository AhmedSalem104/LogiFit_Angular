export const environment = {
  production: false,
  otpDevelopmentHint: 'وضع التطوير فقط: استخدم الكود 1234',
  // Shared API base used by the deployed LogicFit backend.
  // Local development can switch to the proxy target in proxy.conf.json when needed.
  // Keep browser requests same-origin; proxy.conf.json forwards them to the current backend.
  apiUrl: '/api',
  platformUrl: 'https://logicfit-saas.runasp.net',
  platformDashboardUrl: 'http://localhost:4300',
  tokenKey: 'logicfit_token',
  userKey: 'logicfit_user',
  permissionsKey: 'logicfit_permissions',
  tenantIdKey: 'logicfit_tenant_id',
  brandingKey: 'logicfit_branding',
  themeKey: 'logicfit_theme',
  langKey: 'logicfit_lang',
  defaultLang: 'en',
};
