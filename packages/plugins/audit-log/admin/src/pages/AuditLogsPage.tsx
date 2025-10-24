import React, { useState, useEffect } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Box,
  Flex,
  Button,
  EmptyStateLayout,
} from '@strapi/design-system';
import { Page, Layouts, useNotification } from '@strapi/strapi/admin';
import { useFetchClient } from '@strapi/strapi/admin';
import { ArrowClockwise, File } from '@strapi/icons';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 });

  const { get } = useFetchClient();
  const { toggleNotification } = useNotification();

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
        sortBy: 'timestamp',
        sortOrder: 'desc',
      });

      const { data }: any = await get(`/audit-log/logs?${params.toString()}`);

      setLogs(data.data || []);
      setPagination({
        page: data.meta?.pagination?.page || 1,
        pageSize: data.meta?.pagination?.pageSize || 25,
        total: data.meta?.pagination?.total || 0,
      });
    } catch (error: any) {
      toggleNotification({
        type: 'danger',
        message: error?.message || 'Failed to fetch audit logs',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, any> = {
      create: 'success700',
      update: 'primary700',
      delete: 'danger700',
      publish: 'success700',
      unpublish: 'warning700',
    };
    return colors[action] || 'neutral700';
  };

  return (
    <Page.Main>
      <Page.Title>Audit Logs</Page.Title>
      <Layouts.Header
        title="Audit Logs"
        subtitle="View all content changes in your application"
        primaryAction={
          <Button
            startIcon={<ArrowClockwise />}
            onClick={() => fetchLogs(pagination.page)}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      <Layouts.Content>
        <Box padding={8} background="neutral0" hasRadius shadow="filterShadow">
          {logs.length === 0 && !loading ? (
            <EmptyStateLayout
              content="No audit logs found. Audit logs will appear here when content is created, updated, or deleted."
              icon={<File width="10rem" height="10rem" />}
            />
          ) : (
            <>
              <Table colCount={6} rowCount={logs.length}>
                <Thead>
                  <Tr>
                    <Th>
                      <Typography variant="sigma">Date</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Action</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Content Type</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">User</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">Record ID</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">IP Address</Typography>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {logs.map((log) => (
                    <Tr key={log.id}>
                      <Td>
                        <Typography textColor="neutral800" variant="omega">
                          {formatDate(log.timestamp)}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography textColor={getActionColor(log.action)} fontWeight="bold">
                          {log.action.toUpperCase()}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography textColor="neutral600" variant="omega">
                          {log.contentType}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography textColor="neutral800">
                          {log.username || 'System'}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography textColor="neutral600" variant="omega">
                          {log.targetDocumentId || log.targetRecordId || '-'}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography textColor="neutral600" variant="omega">
                          {log.ipAddress || '-'}
                        </Typography>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {/* Pagination */}
              {pagination.total > pagination.pageSize && (
                <Flex justifyContent="center" paddingTop={4} gap={2}>
                  <Button
                    variant="secondary"
                    disabled={pagination.page === 1}
                    onClick={() => fetchLogs(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Box paddingLeft={2} paddingRight={2} paddingTop={2}>
                    <Typography>
                      Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                      ({pagination.total} total)
                    </Typography>
                  </Box>
                  <Button
                    variant="secondary"
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                    onClick={() => fetchLogs(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Layouts.Content>
    </Page.Main>
  );
};
