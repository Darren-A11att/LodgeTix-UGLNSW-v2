# Infrastructure Configuration TODOs for Functions Architecture Refactor

## Overview
This document outlines infrastructure tasks required to support the functions architecture refactor, including environment configuration, deployment procedures, monitoring setup, and CI/CD pipeline modifications.

---

## Environment Configuration

### IF-001: Add New Environment Variables for Functions Architecture
**Priority:** High  
**Dependencies:** None  
**Estimated Time:** 2 hours

**Configuration Changes:**
```bash
# New environment variables required
FILTER_TO=<target_filter_value>
FUNCTION_ID=<supabase_function_identifier>
ORGANISATION_ID=<org_identifier_for_stripe>
```

**Tasks:**
1. Update `.env.example` with new variables and documentation
2. Add variables to GitHub Secrets:
   - `FILTER_TO`
   - `FUNCTION_ID`
   - `ORGANISATION_ID`
3. Update Vercel/deployment platform environment variables
4. Document variable purpose and format requirements

**Deployment Procedure:**
1. Add to staging environment first
2. Validate with test deployment
3. Add to production environment
4. Update all team members' local `.env` files

**Rollback Strategy:**
- Remove variables from deployment platforms
- Revert `.env.example` changes
- Deploy previous version without new variables

**Monitoring Setup:**
- Add environment variable validation check in app startup
- Log warnings if variables are missing or malformed
- Create health check endpoint that validates env vars

---

### IF-002: Implement Feature Flags for Functions Rollout
**Priority:** High  
**Dependencies:** IF-001  
**Estimated Time:** 4 hours

**Configuration Changes:**
```typescript
// Feature flag configuration
const FEATURE_FLAGS = {
  USE_FUNCTIONS_ARCHITECTURE: process.env.NEXT_PUBLIC_USE_FUNCTIONS_ARCH === 'true',
  ENABLE_FUNCTION_MONITORING: process.env.ENABLE_FUNCTION_MONITORING === 'true',
  FUNCTIONS_PERCENTAGE_ROLLOUT: parseInt(process.env.FUNCTIONS_ROLLOUT_PERCENTAGE || '0'),
}
```

**Tasks:**
1. Create feature flag service in `lib/feature-flags.ts`
2. Implement percentage-based rollout logic
3. Add feature flag environment variables:
   ```bash
   NEXT_PUBLIC_USE_FUNCTIONS_ARCH=false
   ENABLE_FUNCTION_MONITORING=false
   FUNCTIONS_ROLLOUT_PERCENTAGE=0
   ```
4. Create admin UI for feature flag management
5. Implement user segmentation for gradual rollout

**Deployment Procedure:**
1. Deploy with flags disabled (0% rollout)
2. Enable for internal testing (5% rollout)
3. Gradual increase: 10% → 25% → 50% → 100%
4. Monitor metrics at each stage

**Rollback Strategy:**
- Set `FUNCTIONS_ROLLOUT_PERCENTAGE=0` immediately
- Deploy hotfix to disable functions
- Investigate issues before re-enabling

**Monitoring Setup:**
- Track feature flag usage metrics
- Monitor performance differences between old/new architecture
- Set up alerts for error rate spikes

---

## Database Deployment Procedures

### IF-003: Database Migration Strategy for Functions
**Priority:** High  
**Dependencies:** None  
**Estimated Time:** 3 hours

**Configuration Changes:**
```yaml
# Migration configuration
migration:
  strategy: "blue-green"
  rollback_enabled: true
  backup_before_migration: true
```

**Tasks:**
1. Create migration scripts in `supabase/migrations/`:
   ```sql
   -- 20250601_functions_architecture_tables.sql
   -- 20250601_functions_views.sql
   -- 20250601_functions_rpc.sql
   ```
2. Implement migration rollback scripts
3. Create pre-migration backup procedure
4. Set up migration health checks
5. Document migration runbook

**Deployment Procedure:**
1. **Pre-deployment:**
   - Create full database backup
   - Run migrations on staging database
   - Execute integration tests
   
2. **Production deployment:**
   - Schedule maintenance window
   - Create production backup
   - Run migrations with transaction
   - Verify migration success
   - Run post-migration validation

3. **Post-deployment:**
   - Monitor database performance
   - Check for slow queries
   - Validate data integrity

**Rollback Strategy:**
1. Immediate rollback (< 5 minutes):
   - Execute rollback migrations
   - Restore from transaction savepoint
   
2. Delayed rollback (> 5 minutes):
   - Restore from pre-migration backup
   - Replay any critical transactions
   - Notify users of potential data loss

**Monitoring Setup:**
- Database query performance monitoring
- Migration execution time tracking
- Error rate monitoring
- Connection pool utilization

---

### IF-004: Implement Database Connection Pooling Optimization
**Priority:** Medium  
**Dependencies:** IF-003  
**Estimated Time:** 2 hours

**Configuration Changes:**
```toml
# supabase/config.toml updates
[db.pooler]
enabled = true
pool_mode = "transaction"
default_pool_size = 50  # Increased for functions
max_client_conn = 200   # Increased for functions
```

**Tasks:**
1. Update Supabase pooler configuration
2. Configure connection limits per function
3. Implement connection retry logic
4. Add connection pool monitoring
5. Create alerting for pool exhaustion

**Deployment Procedure:**
1. Test new pool settings in staging
2. Monitor connection usage patterns
3. Apply to production during low-traffic period
4. Gradually increase traffic to validate

**Rollback Strategy:**
- Revert to previous pool configuration
- Restart connection pooler
- Clear connection pool cache

---

## Monitoring and Logging Updates

### IF-005: Implement Comprehensive Functions Monitoring
**Priority:** High  
**Dependencies:** IF-001, IF-002  
**Estimated Time:** 6 hours

**Configuration Changes:**
```typescript
// Monitoring configuration
const MONITORING_CONFIG = {
  metrics: {
    functionExecutionTime: true,
    functionErrorRate: true,
    databaseQueryTime: true,
    apiLatency: true,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    structured: true,
    includeStackTrace: process.env.NODE_ENV !== 'production',
  },
  tracing: {
    enabled: process.env.ENABLE_TRACING === 'true',
    sampleRate: 0.1,
  },
}
```

**Tasks:**
1. **Logging Infrastructure:**
   - Implement structured logging with correlation IDs
   - Add function execution logging
   - Create log aggregation queries
   - Set up log retention policies

2. **Metrics Collection:**
   - Function execution duration
   - Function success/failure rates
   - Database query performance
   - API endpoint latency
   - Memory and CPU usage

3. **Alerting Rules:**
   - Function error rate > 5%
   - Execution time > 3 seconds
   - Database connection failures
   - Memory usage > 80%
   - CPU usage > 90%

4. **Dashboard Creation:**
   - Real-time function performance dashboard
   - Historical trend analysis
   - Error investigation tools
   - Cost monitoring dashboard

**Deployment Procedure:**
1. Deploy monitoring agents to staging
2. Validate metric collection
3. Test alerting rules
4. Deploy to production
5. Configure alert channels (Slack, PagerDuty)

**Monitoring Setup:**
- Prometheus for metrics collection
- Grafana for visualization
- Sentry for error tracking
- CloudWatch/Datadog for infrastructure monitoring

---

### IF-006: Implement Distributed Tracing
**Priority:** Medium  
**Dependencies:** IF-005  
**Estimated Time:** 4 hours

**Configuration Changes:**
```typescript
// OpenTelemetry configuration
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
```

**Tasks:**
1. Set up OpenTelemetry SDK
2. Instrument critical code paths
3. Configure trace sampling
4. Set up trace visualization (Jaeger/Zipkin)
5. Create trace analysis queries

**Deployment Procedure:**
1. Enable tracing with 1% sampling
2. Validate trace collection
3. Increase sampling rate gradually
4. Monitor performance impact

---

## CI/CD Pipeline Modifications

### IF-007: Update CI/CD Pipeline for Functions Architecture
**Priority:** High  
**Dependencies:** IF-001  
**Estimated Time:** 4 hours

**Configuration Changes:**
```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Functions Architecture
on:
  push:
    branches: [main, develop]
    paths:
      - 'functions/**'
      - 'lib/api/**'
      - 'supabase/migrations/**'

jobs:
  test-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run function tests
        run: npm run test:functions
      
  deploy-staging:
    needs: test-functions
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to staging
        run: |
          npm run deploy:functions:staging
          npm run migrate:staging
          
  deploy-production:
    needs: test-functions
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          npm run deploy:functions:production
          npm run migrate:production
```

**Tasks:**
1. **Pipeline Updates:**
   - Add functions-specific test suite
   - Implement staged deployment (staging → production)
   - Add rollback automation
   - Include performance benchmarks
   - Add security scanning

2. **Build Optimization:**
   - Implement function bundling
   - Add tree-shaking for dependencies
   - Optimize Docker images
   - Cache build artifacts

3. **Deployment Automation:**
   - Blue-green deployment for functions
   - Automated rollback on failure
   - Health check validation
   - Smoke test execution

**Deployment Procedure:**
1. Merge to develop branch
2. Automated tests run
3. Deploy to staging
4. Run integration tests
5. Manual approval for production
6. Deploy to production with canary

**Rollback Strategy:**
- Automated rollback on health check failure
- Manual rollback via GitHub Actions
- Revert to previous Docker image
- Database migration rollback if needed

---

### IF-008: Implement Automated Performance Testing
**Priority:** Medium  
**Dependencies:** IF-007  
**Estimated Time:** 3 hours

**Configuration Changes:**
```yaml
# .github/workflows/performance-tests.yml
performance-benchmarks:
  thresholds:
    p95_latency: 200ms
    p99_latency: 500ms
    error_rate: 0.1%
    throughput: 1000rps
```

**Tasks:**
1. Set up k6/Artillery for load testing
2. Create performance test scenarios
3. Establish baseline metrics
4. Implement performance gates
5. Create performance trend reports

**Deployment Procedure:**
1. Run performance tests against staging
2. Compare against baseline
3. Block deployment if thresholds exceeded
4. Generate performance report

---

## Backup and Recovery Procedures

### IF-009: Implement Enhanced Backup Strategy
**Priority:** High  
**Dependencies:** IF-003  
**Estimated Time:** 3 hours

**Configuration Changes:**
```yaml
backup:
  schedule:
    full: "0 2 * * *"      # Daily at 2 AM
    incremental: "0 */6 * * *"  # Every 6 hours
  retention:
    daily: 7
    weekly: 4
    monthly: 12
  storage:
    primary: "s3://backup-bucket/primary"
    secondary: "s3://backup-bucket/secondary"
```

**Tasks:**
1. **Backup Implementation:**
   - Configure automated Supabase backups
   - Implement point-in-time recovery
   - Set up cross-region backup replication
   - Create backup verification jobs
   - Document recovery procedures

2. **Recovery Testing:**
   - Monthly recovery drills
   - RTO/RPO validation
   - Partial restore capabilities
   - Data integrity verification

**Deployment Procedure:**
1. Configure backup jobs in staging
2. Test full recovery process
3. Implement in production
4. Schedule regular recovery tests

**Rollback Strategy:**
- Multiple backup versions available
- Point-in-time recovery within 7 days
- Cross-region failover capability

---

### IF-010: Implement Disaster Recovery Plan
**Priority:** Medium  
**Dependencies:** IF-009  
**Estimated Time:** 4 hours

**Configuration Changes:**
```yaml
disaster_recovery:
  rto: "4 hours"
  rpo: "1 hour"
  regions:
    primary: "us-east-1"
    secondary: "us-west-2"
```

**Tasks:**
1. Document DR procedures
2. Set up cross-region replication
3. Implement automated failover
4. Create DR testing schedule
5. Train team on DR procedures

---

## Performance Tracking

### IF-011: Implement Application Performance Monitoring (APM)
**Priority:** High  
**Dependencies:** IF-005  
**Estimated Time:** 4 hours

**Configuration Changes:**
```typescript
// APM Configuration
const APM_CONFIG = {
  serviceName: 'lodgetix-functions',
  environment: process.env.NODE_ENV,
  transactionSampleRate: 0.1,
  captureBody: 'all',
  captureHeaders: true,
}
```

**Tasks:**
1. **APM Setup:**
   - Install APM agent (New Relic/DataDog/Elastic)
   - Configure transaction tracking
   - Set up custom metrics
   - Create performance dashboards

2. **Key Metrics:**
   - Transaction response time
   - Database query performance
   - External API latency
   - Error rates by function
   - Resource utilization

3. **Performance Baselines:**
   - Establish performance SLIs
   - Set up performance budgets
   - Create alerting thresholds
   - Document optimization opportunities

**Deployment Procedure:**
1. Install APM agent in staging
2. Configure metric collection
3. Validate data accuracy
4. Deploy to production
5. Set up alerting rules

---

### IF-012: Implement Cost Monitoring and Optimization
**Priority:** Medium  
**Dependencies:** IF-011  
**Estimated Time:** 3 hours

**Configuration Changes:**
```yaml
cost_monitoring:
  alerts:
    daily_spend: 100
    monthly_projection: 2000
  optimization:
    auto_scaling: true
    idle_timeout: 300
```

**Tasks:**
1. Set up cloud cost monitoring
2. Tag resources by function/feature
3. Create cost allocation reports
4. Implement auto-scaling policies
5. Set up cost anomaly detection

**Monitoring Setup:**
- Daily cost reports
- Function-level cost attribution
- Resource utilization analysis
- Cost optimization recommendations

---

## Security Configurations

### IF-013: Implement Security Monitoring for Functions
**Priority:** High  
**Dependencies:** IF-005  
**Estimated Time:** 3 hours

**Configuration Changes:**
```yaml
security:
  waf:
    enabled: true
    rules: "OWASP_TOP_10"
  api_rate_limiting:
    enabled: true
    requests_per_minute: 100
  encryption:
    at_rest: true
    in_transit: true
```

**Tasks:**
1. Configure WAF rules
2. Implement rate limiting
3. Set up security scanning
4. Create security dashboards
5. Configure SIEM integration

**Deployment Procedure:**
1. Enable in monitoring mode
2. Analyze false positives
3. Tune security rules
4. Enable blocking mode
5. Monitor for legitimate traffic impact

---

## Summary

These infrastructure tasks provide a comprehensive approach to supporting the functions architecture refactor with:
- Zero-downtime deployment capabilities
- Comprehensive monitoring and alerting
- Robust backup and recovery procedures
- Performance optimization strategies
- Security hardening measures

Each task includes specific configuration changes, deployment procedures, and rollback strategies to ensure safe and reliable infrastructure updates.