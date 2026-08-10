import client from 'prom-client';

// Register default metrics
client.collectDefaultMetrics({ prefix: 'modheshwari_' });

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const errorCounter = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type'],
});

export const notificationDlqSize = new client.Gauge({
  name: 'notification_dlq_size',
  help: 'Number of items currently in notifications DLQ (Redis list)',
});

export const outboxPendingEvents = new client.Gauge({
  name: 'outbox_pending_events',
  help: 'Number of unprocessed outbox events',
});

export const outboxPublishFailures = new client.Counter({
  name: 'outbox_publish_failures_total',
  help: 'Total number of outbox publish failures',
  labelNames: ['topic'],
});

export const outboxRetryCount = new client.Counter({
  name: 'outbox_retry_count_total',
  help: 'Total number of outbox event retries',
});

export const websocketReconciliationCount = new client.Counter({
  name: 'websocket_reconciliation_count_total',
  help: 'Total number of WebSocket reconnection reconciliations',
});

export const elasticsearchIndexFailures = new client.Counter({
  name: 'elasticsearch_index_failures_total',
  help: 'Total number of Elasticsearch indexing failures',
  labelNames: ['event_type'],
});

export const elasticsearchReconciliationCount = new client.Counter({
  name: 'elasticsearch_reconciliation_count_total',
  help: 'Total number of Elasticsearch reconciliation runs',
});

export const roleChangeAnomalyCount = new client.Counter({
  name: 'role_change_anomaly_count_total',
  help: 'Total number of role change anomalies detected',
  labelNames: ['anomaly_type'],
});

/**
 * Performs metrics handler operation.
 * @returns {Promise<Response>} Description of return value
 */
export async function metricsHandler(): Promise<Response> {
  const body = await client.register.metrics();
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': client.register.contentType },
  });
}

export default client;
