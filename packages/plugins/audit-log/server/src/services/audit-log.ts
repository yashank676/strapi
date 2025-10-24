import { getService } from '../utils';

export interface CreateAuditLogInput {
  contentType: string;
  targetDocumentId?: string;
  targetRecordId?: number;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  userId?: number;
  username?: string;
  payload?: any;
  oldData?: any;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogService = ({ strapi }: { strapi: any }) => ({
  /**
   * Create an audit log entry
   */
  async createLog(input: CreateAuditLogInput) {
    try {
      const diffService = getService('diff');

      let diff = null;
      let changedFields = null;

      // Calculate diff for update actions
      if (input.action === 'update' && input.oldData && input.payload) {
        const patches = diffService.calculateDiff(input.oldData, input.payload);
        diff = patches;
        changedFields = diffService.extractChangedFields(patches);
      }

      // For delete actions, store the last state as payload
      const payload = input.action === 'delete' ? input.oldData : input.payload;

      const auditLog = await strapi.db.query('plugin::audit-log.audit-log').create({
        data: {
          contentType: input.contentType,
          targetDocumentId: input.targetDocumentId || null,
          targetRecordId: input.targetRecordId || null,
          action: input.action,
          userId: input.userId || null,
          username: input.username || 'system',
          payload: payload ? diffService.cleanData(payload) : null,
          changedFields,
          diff,
          timestamp: new Date(),
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
        },
      });

      return auditLog;
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      strapi.log.error('Error creating audit log:', error);
      return null;
    }
  },

  /**
   * Find audit logs with filters
   */
  async findLogs(filters: any = {}, pagination: any = {}, sort: any = {}) {
    try {
      const { contentType, userId, action, dateFrom, dateTo, documentId } = filters;
      const { page = 1, pageSize = 25 } = pagination;
      const { sortBy = 'timestamp', sortOrder = 'desc' } = sort;

      // Build where clause
      const where: any = {};

      if (contentType) {
        where.contentType = contentType;
      }

      if (documentId) {
        where.targetDocumentId = documentId;
      }

      if (userId) {
        where.userId = userId;
      }

      if (action) {
        where.action = action;
      }

      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom) {
          where.timestamp.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.timestamp.$lte = new Date(dateTo);
        }
      }

      // Query logs with pagination
      const [logs, total] = await Promise.all([
        strapi.db.query('plugin::audit-log.audit-log').findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        strapi.db.query('plugin::audit-log.audit-log').count({ where }),
      ]);

      return {
        data: logs,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
            total,
          },
        },
      };
    } catch (error) {
      strapi.log.error('Error finding audit logs:', error);
      throw error;
    }
  },

  /**
   * Get a single audit log by ID
   */
  async findOne(id: number) {
    try {
      const log = await strapi.db.query('plugin::audit-log.audit-log').findOne({
        where: { id },
      });

      return log;
    } catch (error) {
      strapi.log.error('Error finding audit log:', error);
      throw error;
    }
  },

  /**
   * Get audit logs for a specific record
   */
  async findByRecord(contentType: string, documentId: string) {
    try {
      const logs = await strapi.db.query('plugin::audit-log.audit-log').findMany({
        where: {
          contentType,
          targetDocumentId: documentId,
        },
        orderBy: { timestamp: 'desc' },
      });

      return logs;
    } catch (error) {
      strapi.log.error('Error finding audit logs by record:', error);
      throw error;
    }
  },
});

export default auditLogService;

