import { getService, shouldAuditContentType, getUserInfo, getRequestInfo } from './utils';

/**
 * Store to hold old data before updates/deletes
 */
const oldDataStore = new Map<string, any>();

/**
 * Bootstrap phase - register lifecycle hooks
 */
export default async ({ strapi }: { strapi: any }) => {
  // Register document middleware for create, update, publish, unpublish operations
  strapi.documents.use(async (context: any, next: any) => {
    const contentTypeUid = context.contentType.uid;

    // Check if we should audit this content type
    if (!shouldAuditContentType(contentTypeUid)) {
      return next();
    }

    // Only track specific actions
    if (!['create', 'update', 'publish', 'unpublish'].includes(context.action)) {
      return next();
    }

    // Get current request context
    const ctx = strapi.requestContext.get();
    const userInfo = getUserInfo(ctx);
    const requestInfo = getRequestInfo(ctx);

    // For update actions, fetch old data before the update
    let oldData = null;
    if (context.action === 'update' && context.params?.documentId) {
      try {
        const entries = await strapi.documents(contentTypeUid).findMany({
          filters: { documentId: context.params.documentId },
        });
        if (entries && entries.length > 0) {
          oldData = entries[0];
          // Store old data with a unique key
          const storeKey = `${contentTypeUid}:${context.params.documentId}`;
          oldDataStore.set(storeKey, oldData);
        }
      } catch (error) {
        strapi.log.warn('Failed to fetch old data for audit log:', error);
      }
    }

    // Execute the operation
    const result = await next();

    // After the operation, create audit log
    try {
      const auditLogService = getService('audit-log');

      let documentId: string | undefined;
      let recordId: number | undefined;
      let payload: any;

      // Extract documentId and data from result
      if (context.action === 'create') {
        documentId = result?.documentId;
        recordId = result?.id;
        payload = result;
      } else if (context.action === 'update') {
        documentId = context.params?.documentId;
        recordId = result?.id;
        payload = context.params?.data;

        // Retrieve old data from store
        const storeKey = `${contentTypeUid}:${documentId}`;
        oldData = oldDataStore.get(storeKey);
        // Clean up store
        oldDataStore.delete(storeKey);
      } else if (context.action === 'publish' || context.action === 'unpublish') {
        documentId = context.params?.documentId;
        recordId = result?.id;
        payload = result;
      }

      await auditLogService.createLog({
        contentType: contentTypeUid,
        targetDocumentId: documentId,
        targetRecordId: recordId,
        action: context.action as any,
        userId: userInfo.userId,
        username: userInfo.username,
        payload,
        oldData,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });
    } catch (error) {
      // Log error but don't fail the operation
      strapi.log.error('Failed to create audit log:', error);
    }

    return result;
  });

  // Register database lifecycle hooks for delete operations
  // We need this because delete might not go through documents middleware
  strapi.db.lifecycles.subscribe({
    models: Object.keys(strapi.contentTypes).filter((uid) => shouldAuditContentType(uid)),

    async beforeDelete(event: any) {
      const contentTypeUid = event.model.uid;

      if (!shouldAuditContentType(contentTypeUid)) {
        return;
      }

      // Fetch the data before deletion
      try {
        const data = await strapi.db.query(contentTypeUid).findOne({
          where: event.params.where,
        });

        if (data) {
          // Store old data with a unique key
          const storeKey = `delete:${contentTypeUid}:${data.id}`;
          oldDataStore.set(storeKey, data);
        }
      } catch (error) {
        strapi.log.warn('Failed to fetch data before delete for audit log:', error);
      }
    },

    async afterDelete(event: any) {
      const contentTypeUid = event.model.uid;

      if (!shouldAuditContentType(contentTypeUid)) {
        return;
      }

      // Get the deleted data from store
      const deletedData = event.result;
      const storeKey = `delete:${contentTypeUid}:${deletedData?.id}`;
      const oldData = oldDataStore.get(storeKey) || deletedData;
      oldDataStore.delete(storeKey);

      // Get current request context
      const ctx = strapi.requestContext.get();
      const userInfo = getUserInfo(ctx);
      const requestInfo = getRequestInfo(ctx);

      try {
        const auditLogService = getService('audit-log');

        await auditLogService.createLog({
          contentType: contentTypeUid,
          targetDocumentId: oldData?.documentId,
          targetRecordId: oldData?.id,
          action: 'delete',
          userId: userInfo.userId,
          username: userInfo.username,
          oldData,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        });
      } catch (error) {
        strapi.log.error('Failed to create audit log for delete:', error);
      }
    },
  });

  strapi.log.info('Audit Log plugin initialized');
};

