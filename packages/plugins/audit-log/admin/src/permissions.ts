import { PLUGIN_ID } from './pluginId';

export const pluginPermissions = {
  main: [{ action: `plugin::${PLUGIN_ID}.read`, subject: null }],
};

