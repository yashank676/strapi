import { File } from '@strapi/icons';

import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { pluginPermissions } from './permissions';

export default {
  register(app: any) {
    // Register the plugin
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: any) {
    // Add link to Settings menu
    app.addSettingsLink('global', {
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Audit Logs',
      },
      id: 'audit-logs',
      to: `${PLUGIN_ID}`,
      Component: async () => {
        const { AuditLogsPage } = await import('./pages/AuditLogsPage');
        return AuditLogsPage;
      },
      permissions: pluginPermissions.main,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data,
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};

