# Supabase Edge Functions Documentation

## Overview

This directory contains comprehensive documentation for developing, testing, and deploying Supabase Edge Functions in the LodgeTix UGLNSW project. Edge Functions are serverless functions that run on Deno Deploy, providing a scalable way to add server-side logic to your application.

## 📁 Documentation Structure

```
edge-functions/
├── README.md                           # This file - overview and navigation
├── PRD-EDGE-FUNCTIONS-SETUP.md        # Product requirements document
├── TODO-EDGE-FUNCTIONS-CHECKLIST.md   # Implementation checklist
├── DEVELOPMENT-GUIDE.md               # Local development guide
├── DEPLOYMENT-GUIDE.md                # CI/CD and deployment procedures
└── TROUBLESHOOTING.md                 # Common issues and solutions
```

## 🚀 Quick Start

1. **New to Edge Functions?** Start with [PRD-EDGE-FUNCTIONS-SETUP.md](./PRD-EDGE-FUNCTIONS-SETUP.md)
2. **Ready to develop?** Follow [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md)
3. **Setting up deployment?** See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
4. **Having issues?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 🎯 Current Edge Functions

The project currently has 4 edge functions:

| Function | Purpose | Trigger |
|----------|---------|---------|
| `generate-attendee-qr` | Creates QR codes for attendee tickets | HTTP Request |
| `generate-confirmation` | Generates confirmation numbers | Database Webhook |
| `generate-ticket-qr` | Creates QR codes for event tickets | HTTP Request |
| `send-confirmation-email` | Sends confirmation emails | Database Webhook |

## 🛠️ Technology Stack

- **Runtime**: Deno (not Node.js)
- **Language**: TypeScript (native support)
- **Deployment**: Deno Deploy (global edge network)
- **Local Dev**: Supabase CLI with Docker

## 📚 Learning Path

### For Developers New to Edge Functions

1. **Understand the Basics**
   - Read the [PRD-EDGE-FUNCTIONS-SETUP.md](./PRD-EDGE-FUNCTIONS-SETUP.md) for context
   - Learn about Deno vs Node.js differences
   - Understand serverless architecture benefits

2. **Set Up Local Environment**
   - Follow [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md) Step 1-3
   - Create your first "Hello World" function
   - Test locally with `supabase functions serve`

3. **Build Your First Function**
   - Use existing functions as templates
   - Start with a simple HTTP endpoint
   - Add database integration

4. **Deploy to Production**
   - Set up GitHub Actions ([DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md))
   - Deploy to staging first
   - Monitor logs and performance

## 🔑 Key Concepts

### Edge Function Architecture

```
Request → Edge Function → Response
           ↓        ↑
        Database/APIs
```

### Function Structure

```typescript
// Basic function structure
Deno.serve(async (req) => {
  // Parse request
  const { data } = await req.json()
  
  // Process data
  const result = await processData(data)
  
  // Return response
  return new Response(
    JSON.stringify(result),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### Environment Variables

Edge functions have access to:
- `SUPABASE_URL` - Your project's API URL
- `SUPABASE_ANON_KEY` - Public anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access key
- Custom secrets via `Deno.env.get()`

## 🏗️ Development Workflow

1. **Create Function**
   ```bash
   supabase functions new my-function
   ```

2. **Develop Locally**
   ```bash
   supabase functions serve my-function
   ```

3. **Test Function**
   ```bash
   curl -i --location --request POST \
     'http://localhost:54321/functions/v1/my-function' \
     --header 'Authorization: Bearer [ANON_KEY]' \
     --header 'Content-Type: application/json' \
     --data '{"name":"test"}'
   ```

4. **Deploy Function**
   ```bash
   supabase functions deploy my-function
   ```

## 📋 Common Use Cases

### 1. Webhook Handler
Process external webhooks (Stripe, SendGrid, etc.)

### 2. Scheduled Tasks
Run periodic jobs with pg_cron integration

### 3. Data Processing
Transform or validate data before database insertion

### 4. Third-Party Integrations
Connect to external APIs with server-side security

### 5. Custom Authentication
Implement custom auth flows or social logins

## ⚡ Performance Tips

1. **Minimize Cold Starts**
   - Keep functions small and focused
   - Minimize dependencies
   - Use global scope for reusable resources

2. **Optimize Bundle Size**
   - Import only what you need
   - Use dynamic imports for large libraries
   - Leverage Deno's built-in APIs

3. **Database Connections**
   - Reuse Supabase client instances
   - Use connection pooling
   - Implement proper error handling

## 🔒 Security Best Practices

1. **Never expose service role key** in client-side code
2. **Validate all inputs** before processing
3. **Use environment variables** for secrets
4. **Implement rate limiting** for public endpoints
5. **Enable CORS** only for trusted domains
6. **Log security events** for monitoring

## 🐛 Debugging

### Local Debugging
```bash
# View function logs
docker logs -f supabase_deno_relay_[function-name]

# Check function status
curl http://localhost:54321/functions/v1/[function-name]/health
```

### Production Debugging
```bash
# View remote logs
supabase functions logs [function-name] --project-ref [project-id]

# Check function metrics
# Visit Supabase Dashboard > Functions
```

## 📊 Monitoring

### Key Metrics to Track
- Invocation count
- Error rate
- Average duration
- Cold start frequency
- Memory usage

### Alerting Setup
- Set up alerts for error rates > 1%
- Monitor for unusually long execution times
- Track failed invocations

## 🚧 Current Limitations

1. **No WebSocket support** - Use Realtime instead
2. **50MB payload limit** - Stream large files
3. **No persistent storage** - Use database/storage
4. **Limited CPU time** - Optimize intensive operations
5. **No binary dependencies** - Use pure JS/TS libraries

## 📖 Additional Resources

### Official Documentation
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)

### Community Resources
- [Supabase Discord](https://discord.supabase.com)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
- [Deno Third Party Modules](https://deno.land/x)

## 🤝 Contributing

When adding new edge functions:
1. Follow the existing naming conventions
2. Add comprehensive error handling
3. Include TypeScript types
4. Write unit tests
5. Update this documentation
6. Add to the functions table above

## ❓ Getting Help

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) first
2. Search existing GitHub issues
3. Ask in #edge-functions channel on Discord
4. Create a detailed bug report if needed