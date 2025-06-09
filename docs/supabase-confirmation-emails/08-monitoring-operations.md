# Monitoring & Operations Guide

## Overview

This guide covers monitoring, alerting, and operational procedures for the confirmation email system in production.

## Key Metrics to Monitor

### 1. System Health Metrics

| Metric | Target | Alert Threshold | Query |
|--------|--------|-----------------|-------|
| Confirmation Rate | > 99% | < 95% | See "Confirmation Success Rate" query |
| Email Delivery Rate | > 98% | < 95% | See "Email Delivery Rate" query |
| Average Processing Time | < 3s | > 5s | See "Processing Time" query |
| Error Rate | < 1% | > 5% | See "Error Rate" query |
| Backlog Size | 0 | > 10 | See "Pending Confirmations" query |

### 2. Confirmation Success Rate
```sql
-- Real-time confirmation success rate
WITH recent_registrations AS (
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN confirmation_number IS NOT NULL THEN 1 END) as with_confirmation
  FROM registrations
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND status = 'completed'
    AND payment_status = 'completed'
)
SELECT 
  total as total_registrations,
  with_confirmation as confirmations_generated,
  ROUND(100.0 * with_confirmation / NULLIF(total, 0), 2) as success_rate_percent
FROM recent_registrations;
```

### 3. Email Delivery Rate
```sql
-- Email delivery success rate
WITH email_stats AS (
  SELECT 
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced
  FROM confirmation_emails
  WHERE sent_at > NOW() - INTERVAL '1 hour'
)
SELECT 
  total_attempts,
  successful,
  failed,
  bounced,
  ROUND(100.0 * successful / NULLIF(total_attempts, 0), 2) as delivery_rate_percent
FROM email_stats;
```

### 4. Processing Time
```sql
-- Average confirmation generation time
SELECT 
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time) as median_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time) as p95_seconds,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY processing_time) as p99_seconds,
  MAX(processing_time) as max_seconds
FROM (
  SELECT 
    EXTRACT(EPOCH FROM (confirmation_generated_at - updated_at)) as processing_time
  FROM registrations
  WHERE confirmation_generated_at IS NOT NULL
    AND confirmation_generated_at > NOW() - INTERVAL '1 hour'
) t;
```

### 5. Error Rate
```sql
-- Function error rate
WITH function_calls AS (
  SELECT 
    webhook_name,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN status_code != 200 THEN 1 END) as errors
  FROM webhook_logs
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY webhook_name
)
SELECT 
  webhook_name,
  total_calls,
  errors,
  ROUND(100.0 * errors / NULLIF(total_calls, 0), 2) as error_rate_percent
FROM function_calls;
```

### 6. Pending Confirmations
```sql
-- Registrations awaiting confirmation
SELECT 
  COUNT(*) as backlog_size,
  MIN(updated_at) as oldest_pending,
  MAX(updated_at) as newest_pending,
  EXTRACT(EPOCH FROM (NOW() - MIN(updated_at)))/60 as oldest_minutes_ago
FROM registrations
WHERE status = 'completed'
  AND payment_status = 'completed'
  AND confirmation_number IS NULL;
```

## Monitoring Dashboard

### Create Monitoring Views
```sql
-- Create comprehensive monitoring view
CREATE OR REPLACE VIEW email_system_monitoring AS
WITH stats AS (
  SELECT 
    -- Totals
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as registrations_1h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as registrations_24h,
    
    -- Confirmations
    COUNT(*) FILTER (WHERE confirmation_number IS NOT NULL AND created_at > NOW() - INTERVAL '1 hour') as confirmations_1h,
    COUNT(*) FILTER (WHERE confirmation_number IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours') as confirmations_24h,
    
    -- Pending
    COUNT(*) FILTER (WHERE status = 'completed' AND payment_status = 'completed' AND confirmation_number IS NULL) as pending_confirmations,
    
    -- Email status
    COUNT(*) FILTER (WHERE email_status = 'sent' AND created_at > NOW() - INTERVAL '1 hour') as emails_sent_1h,
    COUNT(*) FILTER (WHERE email_status = 'failed' AND created_at > NOW() - INTERVAL '1 hour') as emails_failed_1h
    
  FROM registrations
),
webhook_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as webhook_calls_1h,
    COUNT(*) FILTER (WHERE status_code != 200 AND created_at > NOW() - INTERVAL '1 hour') as webhook_errors_1h
  FROM webhook_logs
)
SELECT 
  s.*,
  w.*,
  ROUND(100.0 * s.confirmations_1h / NULLIF(s.registrations_1h, 0), 2) as confirmation_rate_1h,
  ROUND(100.0 * s.confirmations_24h / NULLIF(s.registrations_24h, 0), 2) as confirmation_rate_24h,
  ROUND(100.0 * s.emails_sent_1h / NULLIF(s.confirmations_1h, 0), 2) as email_success_rate_1h
FROM stats s, webhook_stats w;

-- Usage
SELECT * FROM email_system_monitoring;
```

### Grafana Dashboard Configuration

Create a Grafana dashboard with these panels:

1. **System Overview**
   - Confirmation rate gauge (target: 99%)
   - Email delivery rate gauge (target: 98%)
   - Current backlog counter
   - Active alerts list

2. **Time Series Graphs**
   - Registrations per hour
   - Confirmations per hour
   - Email sends per hour
   - Error rate over time

3. **Performance Metrics**
   - Processing time histogram
   - P95 latency trend
   - Function execution duration

4. **Error Analysis**
   - Error types breakdown
   - Failed email reasons
   - Webhook failure causes

## Alerting Rules

### 1. PagerDuty Alerts (Critical)

#### No Confirmations Generated
```yaml
alert: NoConfirmationsGenerated
expr: |
  (sum(rate(registrations_completed[5m])) > 0) 
  AND 
  (sum(rate(confirmations_generated[5m])) == 0)
for: 10m
labels:
  severity: critical
annotations:
  summary: "No confirmation numbers generated in 10 minutes"
  description: "Registrations completing but no confirmations generated"
```

#### High Error Rate
```yaml
alert: HighConfirmationErrorRate
expr: |
  (
    sum(rate(webhook_errors[5m])) / 
    sum(rate(webhook_calls[5m]))
  ) > 0.1
for: 5m
labels:
  severity: critical
annotations:
  summary: "Confirmation system error rate > 10%"
```

### 2. Slack Alerts (Warning)

#### Growing Backlog
```yaml
alert: ConfirmationBacklog
expr: pending_confirmations > 20
for: 15m
labels:
  severity: warning
  channel: "#ops-alerts"
annotations:
  summary: "{{ $value }} registrations awaiting confirmation"
```

#### Slow Processing
```yaml
alert: SlowConfirmationProcessing
expr: confirmation_p95_latency > 5
for: 10m
labels:
  severity: warning
annotations:
  summary: "P95 confirmation time > 5 seconds"
```

### 3. Email Alerts (Info)

#### Daily Summary
```sql
-- Daily summary query
CREATE OR REPLACE FUNCTION daily_email_summary()
RETURNS TABLE (
  metric TEXT,
  value TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Total Registrations', COUNT(*)::TEXT
  FROM registrations
  WHERE created_at > NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 'Confirmations Generated', COUNT(*)::TEXT
  FROM registrations
  WHERE confirmation_generated_at > NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 'Emails Sent', COUNT(*)::TEXT
  FROM confirmation_emails
  WHERE sent_at > NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 'Average Processing Time', 
    ROUND(AVG(EXTRACT(EPOCH FROM (confirmation_generated_at - updated_at))), 2)::TEXT || ' seconds'
  FROM registrations
  WHERE confirmation_generated_at > NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 'Current Backlog', COUNT(*)::TEXT
  FROM registrations
  WHERE status = 'completed'
    AND payment_status = 'completed'
    AND confirmation_number IS NULL;
END;
$$ LANGUAGE plpgsql;
```

## Operational Procedures

### 1. Daily Health Check
```bash
#!/bin/bash
# daily-health-check.sh

echo "=== Email System Daily Health Check ==="
echo "Date: $(date)"
echo ""

# Check function status
echo "1. Edge Function Status:"
supabase functions list | grep -E "(generate-confirmation|send-confirmation-email)"

# Check recent logs for errors
echo -e "\n2. Recent Errors (last 24h):"
supabase functions logs generate-confirmation --limit 100 | grep -i error | tail -5
supabase functions logs send-confirmation-email --limit 100 | grep -i error | tail -5

# Database metrics
echo -e "\n3. Database Metrics:"
psql $DATABASE_URL -t -c "SELECT * FROM email_system_monitoring"

# Pending confirmations
echo -e "\n4. Pending Confirmations:"
psql $DATABASE_URL -t -c "
  SELECT COUNT(*) as pending 
  FROM registrations 
  WHERE status = 'completed' 
    AND payment_status = 'completed' 
    AND confirmation_number IS NULL
"

echo -e "\n=== Health Check Complete ==="
```

### 2. Weekly Performance Review
```sql
-- Weekly performance report
CREATE OR REPLACE FUNCTION weekly_performance_report()
RETURNS TABLE (
  day DATE,
  registrations BIGINT,
  confirmations BIGINT,
  emails_sent BIGINT,
  avg_processing_seconds NUMERIC,
  error_count BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('day', created_at)::DATE as day,
    COUNT(*) as registrations,
    COUNT(confirmation_number) as confirmations,
    COUNT(CASE WHEN email_status = 'sent' THEN 1 END) as emails_sent,
    ROUND(AVG(EXTRACT(EPOCH FROM (confirmation_generated_at - updated_at))), 2) as avg_processing_seconds,
    (
      SELECT COUNT(*) 
      FROM webhook_logs wl 
      WHERE wl.created_at::DATE = date_trunc('day', r.created_at)::DATE 
        AND wl.status_code != 200
    ) as error_count,
    ROUND(100.0 * COUNT(confirmation_number) / COUNT(*), 2) as success_rate
  FROM registrations r
  WHERE created_at > NOW() - INTERVAL '7 days'
    AND status = 'completed'
  GROUP BY date_trunc('day', created_at)
  ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql;
```

### 3. Incident Response

#### Runbook: Email System Down
```markdown
## Incident: Email System Down

### Detection
- Alert: NoConfirmationsGenerated fired
- Multiple user reports of missing emails

### Immediate Actions
1. Check Edge Function status:
   ```bash
   supabase functions list
   supabase functions logs generate-confirmation --limit 50
   ```

2. Check database trigger:
   ```sql
   SELECT tgname, tgenabled 
   FROM pg_trigger 
   WHERE tgname = 'registration_payment_webhook_trigger';
   ```

3. Verify environment variables:
   ```bash
   supabase secrets list
   ```

### Diagnosis
1. Function deployment issue? → Redeploy
2. Database trigger disabled? → Re-enable
3. Environment variables missing? → Reset
4. Rate limiting? → Check Resend dashboard

### Recovery
1. Fix root cause
2. Process backlog:
   ```sql
   UPDATE registrations
   SET updated_at = NOW()
   WHERE status = 'completed'
     AND payment_status = 'completed'
     AND confirmation_number IS NULL;
   ```
3. Monitor recovery
4. Send incident report
```

## Capacity Planning

### Growth Projections
```sql
-- Monthly growth analysis
WITH monthly_stats AS (
  SELECT 
    date_trunc('month', created_at) as month,
    COUNT(*) as registrations,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)) as cumulative_registrations
  FROM registrations
  WHERE created_at > NOW() - INTERVAL '12 months'
  GROUP BY date_trunc('month', created_at)
)
SELECT 
  month,
  registrations,
  unique_customers,
  cumulative_registrations,
  LAG(registrations) OVER (ORDER BY month) as prev_month,
  ROUND(100.0 * (registrations - LAG(registrations) OVER (ORDER BY month)) / 
    NULLIF(LAG(registrations) OVER (ORDER BY month), 0), 2) as growth_rate_percent
FROM monthly_stats
ORDER BY month DESC;
```

### Resource Requirements
- **Edge Functions**: Auto-scaling, monitor cold starts
- **Database**: Monitor connection pool usage
- **Email Service**: Check Resend plan limits
- **Storage**: Monitor webhook_logs table size

### Scaling Thresholds
| Metric | Current Limit | Scale At | Action |
|--------|---------------|----------|--------|
| Registrations/hour | 1000 | 800 | Increase function concurrency |
| Email sends/day | 10,000 | 8,000 | Upgrade Resend plan |
| Database connections | 100 | 80 | Increase pool size |
| Log retention | 30 days | 10GB | Archive old logs |

## Maintenance Windows

### Monthly Maintenance Tasks
1. Archive old webhook_logs entries
2. Vacuum analyze large tables
3. Review and update monitoring thresholds
4. Test disaster recovery procedures

### Maintenance Script
```sql
-- Monthly maintenance procedure
CREATE OR REPLACE PROCEDURE monthly_maintenance()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Archive old logs
  INSERT INTO webhook_logs_archive
  SELECT * FROM webhook_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM webhook_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Vacuum tables
  VACUUM ANALYZE registrations;
  VACUUM ANALYZE webhook_logs;
  VACUUM ANALYZE confirmation_emails;
  
  -- Update statistics
  ANALYZE;
  
  -- Log maintenance completion
  INSERT INTO maintenance_log (task, completed_at)
  VALUES ('monthly_maintenance', NOW());
END;
$$;
```