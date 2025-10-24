const PLUGIN_ID = 'audit-log';

export const getService = <T = any>(name: string): T => {
  return (global as any).strapi.plugin(PLUGIN_ID).service(name);
};

export const getPluginConfig = () => {
  return (global as any).strapi.config.get(`plugin::${PLUGIN_ID}`, {
    enabled: true,
    excludeContentTypes: [],
  });
};

export const shouldAuditContentType = (contentTypeUid: string): boolean => {
  const config = getPluginConfig();

  if (!config.enabled) {
    return false;
  }

  // Don't audit the audit-log content type itself
  if (contentTypeUid === `plugin::${PLUGIN_ID}.audit-log`) {
    return false;
  }

  // Check if content type is in the exclude list
  if (config.excludeContentTypes && Array.isArray(config.excludeContentTypes)) {
    return !config.excludeContentTypes.includes(contentTypeUid);
  }

  return true;
};

export const getUserInfo = (ctx?: any) => {
  const user = ctx?.state?.user;

  return {
    userId: user?.id || null,
    username: user?.username || user?.email || 'system',
  };
};

export const getRequestInfo = (ctx?: any) => {
  if (!ctx || !ctx.request) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }

  return {
    ipAddress: ctx.request.ip || ctx.request.headers['x-forwarded-for'] || null,
    userAgent: ctx.request.headers['user-agent'] || null,
  };
};

