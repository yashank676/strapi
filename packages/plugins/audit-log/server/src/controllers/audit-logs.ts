import { getService } from '../utils';

const controller = {
  /**
   * GET /audit-log/logs
   * List audit logs with filters and pagination
   */
  async find(ctx: any) {
    try {
      const { query } = ctx.request;

      // Extract filters
      const filters = {
        contentType: query.contentType as string,
        userId: query.userId ? parseInt(query.userId as string, 10) : undefined,
        action: query.action as string,
        dateFrom: query.dateFrom as string,
        dateTo: query.dateTo as string,
        documentId: query.documentId as string,
      };

      // Extract pagination
      const pagination = {
        page: query.page ? parseInt(query.page as string, 10) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize as string, 10) : 25,
      };

      // Extract sorting
      const sort = {
        sortBy: query.sortBy as string || 'timestamp',
        sortOrder: (query.sortOrder as string || 'desc').toLowerCase() as 'asc' | 'desc',
      };

      const auditLogService = getService('audit-log');
      const result = await auditLogService.findLogs(filters, pagination, sort);

      ctx.body = result;
    } catch (error: any) {
      ctx.throw(500, `Failed to fetch audit logs: ${error.message}`);
    }
  },

  /**
   * GET /audit-log/logs/:id
   * Get a single audit log by ID
   */
  async findOne(ctx: any) {
    try {
      const { id } = ctx.params;
      const auditLogService = getService('audit-log');

      const log = await auditLogService.findOne(parseInt(id, 10));

      if (!log) {
        return ctx.notFound('Audit log not found');
      }

      ctx.body = { data: log };
    } catch (error: any) {
      ctx.throw(500, `Failed to fetch audit log: ${error.message}`);
    }
  },

  /**
   * GET /audit-log/logs/record/:contentType/:documentId
   * Get audit logs for a specific record
   */
  async findByRecord(ctx: any) {
    try {
      const { contentType, documentId } = ctx.params;
      const auditLogService = getService('audit-log');

      const logs = await auditLogService.findByRecord(contentType, documentId);

      ctx.body = { data: logs };
    } catch (error: any) {
      ctx.throw(500, `Failed to fetch audit logs for record: ${error.message}`);
    }
  },

  /**
   * GET /audit-log/stats
   * Get audit log statistics
   */
  async getStats(ctx: any) {
    try {
      const { query } = ctx.request;
      const dateFrom = query.dateFrom as string;
      const dateTo = query.dateTo as string;

      const where: any = {};

      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom) {
          where.timestamp.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.timestamp.$lte = new Date(dateTo);
        }
      }

      // Get counts by action type
      const strapiInstance = (global as any).strapi;
      const [total, createCount, updateCount, deleteCount, publishCount, unpublishCount] = await Promise.all([
        strapiInstance.db.query('plugin::audit-log.audit-log').count({ where }),
        strapiInstance.db.query('plugin::audit-log.audit-log').count({ where: { ...where, action: 'create' } }),
        strapiInstance.db.query('plugin::audit-log.audit-log').count({ where: { ...where, action: 'update' } }),
        strapiInstance.db.query('plugin::audit-log.audit-log').count({ where: { ...where, action: 'delete' } }),
        strapiInstance.db.query('plugin::audit-log.audit-log').count({ where: { ...where, action: 'publish' } }),
        strapiInstance.db.query('plugin::audit-log.audit-log').count({ where: { ...where, action: 'unpublish' } }),
      ]);

      ctx.body = {
        data: {
          total,
          byAction: {
            create: createCount,
            update: updateCount,
            delete: deleteCount,
            publish: publishCount,
            unpublish: unpublishCount,
          },
        },
      };
    } catch (error: any) {
      ctx.throw(500, `Failed to fetch audit log stats: ${error.message}`);
    }
  },
};

export default controller;

