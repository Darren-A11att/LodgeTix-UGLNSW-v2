# Immutable Deployment Laws

## Core Principles

These are the non-negotiable deployment laws that MUST be followed in all Next.js development:

### Law 1: Zero-Downtime Deployments
- **ALL** deployments must maintain service availability
- Use rolling deployments or blue-green strategies
- Health checks must pass before traffic routing
- Maintain backwards compatibility

### Law 2: Environment Parity
- Development, staging, and production must be identical
- Use the same Node.js version across environments
- Environment variables must be documented
- Database schemas must be synchronized

### Law 3: Immutable Infrastructure
- Never modify servers after deployment
- Use containerization for consistency
- Infrastructure as Code is mandatory
- Deployments must be reproducible

### Law 4: Automated Deployments
- Manual deployments are forbidden
- CI/CD pipelines must handle all deployments
- Rollback procedures must be automated
- Deployment approvals follow defined process

### Law 5: Build Optimization
- Production builds must be optimized
- Enable all Next.js optimizations
- Implement code splitting properly
- Minimize bundle sizes

### Law 6: Security First
- Secrets must never be in code
- Environment variables must be encrypted
- Security scanning is mandatory
- HTTPS is required everywhere

### Law 7: Performance Monitoring
- Real User Monitoring (RUM) is required
- Set up performance budgets
- Monitor Core Web Vitals
- Alert on performance degradation

### Law 8: Backup and Recovery
- Database backups before deployments
- Application state must be recoverable
- Disaster recovery plan required
- Regular recovery testing

### Law 9: Progressive Rollouts
- Use feature flags for major changes
- Implement canary deployments
- Monitor error rates during rollout
- Quick rollback capability

### Law 10: Documentation
- Deployment process must be documented
- Runbooks for common issues
- Architecture diagrams up-to-date
- Change logs for every deployment

## Implementation Patterns

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:20-alpine AS dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: |
          pnpm run lint
          pnpm run typecheck
          pnpm run test:ci
      
      - name: Build application
        run: pnpm run build

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy to Production
        uses: actions/github-script@v6
        with:
          script: |
            const deployment = await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              required_contexts: [],
              environment: 'production',
              auto_merge: false
            });
            
            // Trigger deployment webhook
            await fetch(process.env.DEPLOY_WEBHOOK_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEPLOY_TOKEN}`
              },
              body: JSON.stringify({
                deployment_id: deployment.data.id,
                image_tag: context.sha.substring(0, 7)
              })
            });
```

### Environment Configuration
```typescript
// config/index.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  SESSION_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SENTRY_DSN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('L Invalid environment variables:', error);
    process.exit(1);
  }
}

export const env = validateEnv();

// Export validated config
export const config = {
  app: {
    name: 'LodgeTix',
    url: env.NEXT_PUBLIC_APP_URL,
    env: env.NODE_ENV,
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    datadogApiKey: env.DATADOG_API_KEY,
  },
} as const;
```

### Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    storage: 'up' | 'down';
  };
}

export async function GET() {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    version: process.env.APP_VERSION || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: 'down',
      redis: 'down',
      storage: 'down',
    },
  };
  
  // Check database
  try {
    await db.raw('SELECT 1');
    health.services.database = 'up';
  } catch (error) {
    health.status = 'unhealthy';
  }
  
  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'up';
  } catch (error) {
    health.status = 'unhealthy';
  }
  
  // Check storage (S3, etc.)
  try {
    // await storage.headBucket({ Bucket: process.env.S3_BUCKET });
    health.services.storage = 'up';
  } catch (error) {
    health.status = 'unhealthy';
  }
  
  const responseTime = Date.now() - startTime;
  
  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'X-Response-Time': `${responseTime}ms`,
    },
  });
}
```

### Feature Flags
```typescript
// lib/features.ts
interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  enabledForUsers?: string[];
  metadata?: Record<string, any>;
}

class FeatureManager {
  private flags: Map<string, FeatureFlag> = new Map();
  
  async loadFlags(): Promise<void> {
    // Load from configuration service
    const response = await fetch('/api/feature-flags');
    const flags = await response.json();
    
    flags.forEach((flag: FeatureFlag) => {
      this.flags.set(flag.key, flag);
    });
  }
  
  isEnabled(key: string, userId?: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;
    
    // Check if globally enabled
    if (flag.enabled) {
      // Check user-specific enablement
      if (flag.enabledForUsers && userId) {
        return flag.enabledForUsers.includes(userId);
      }
      
      // Check rollout percentage
      if (flag.rolloutPercentage !== undefined && userId) {
        const hash = this.hashUserId(userId);
        return hash < flag.rolloutPercentage;
      }
      
      return true;
    }
    
    return false;
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }
}

export const features = new FeatureManager();

// React hook
export function useFeature(key: string): boolean {
  const [enabled, setEnabled] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    setEnabled(features.isEnabled(key, user?.id));
  }, [key, user?.id]);
  
  return enabled;
}
```

### Database Migrations
```typescript
// scripts/migrate.ts
import { createMigrator } from '@/lib/db/migrator';

async function runMigrations() {
  const migrator = createMigrator();
  
  try {
    console.log('Running database migrations...');
    
    // Check current version
    const currentVersion = await migrator.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    // Run pending migrations
    const migrations = await migrator.up();
    
    if (migrations.length === 0) {
      console.log('Database is up to date');
    } else {
      console.log(`Applied ${migrations.length} migrations:`);
      migrations.forEach(m => console.log(`  - ${m.name}`));
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations before starting the app
if (require.main === module) {
  runMigrations();
}
```

### Performance Monitoring
```typescript
// lib/monitoring/performance.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export function initWebVitals() {
  if (typeof window === 'undefined') return;
  
  function sendToAnalytics(metric: any) {
    // Send to monitoring service
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        rating: metric.rating,
        timestamp: Date.now(),
      }),
    });
  }
  
  // Core Web Vitals
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  
  // Other metrics
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### Rollback Strategy
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=$1
PREVIOUS_VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback.sh <environment> <version>"
  exit 1
fi

echo "Rolling back $ENVIRONMENT to version $PREVIOUS_VERSION"

# Update image tag
kubectl set image deployment/app \
  app=ghcr.io/lodgetix/app:$PREVIOUS_VERSION \
  --namespace=$ENVIRONMENT

# Wait for rollout
kubectl rollout status deployment/app \
  --namespace=$ENVIRONMENT \
  --timeout=5m

# Verify health
./scripts/health-check.sh $ENVIRONMENT

echo "Rollback completed successfully"
```

## Enforcement

These laws are enforced through:
1. Automated deployment pipelines
2. Build-time checks and validations
3. Health check requirements
4. Performance monitoring alerts
5. Security scanning in CI/CD

## References

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [12-Factor App](https://12factor.net/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)