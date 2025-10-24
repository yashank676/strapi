export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/logs',
      handler: 'audit-logs.find',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: {
              actions: ['plugin::audit-log.read'],
            },
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/logs/:id',
      handler: 'audit-logs.findOne',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: {
              actions: ['plugin::audit-log.read'],
            },
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/logs/record/:contentType/:documentId',
      handler: 'audit-logs.findByRecord',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: {
              actions: ['plugin::audit-log.read'],
            },
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/stats',
      handler: 'audit-logs.getStats',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'admin::hasPermissions',
            config: {
              actions: ['plugin::audit-log.read'],
            },
          },
        ],
      },
    },
  ],
};

