/**
 * Register phase - register permissions and other static configurations
 */
export default async ({ strapi }: { strapi: any }) => {
  // Register permission actions for the plugin
  await strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: 'audit-log',
    },
  ]);
};

