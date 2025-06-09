# Supabase Documentation

This directory contains comprehensive documentation for all Supabase-related infrastructure, deployment strategies, and development workflows for the LodgeTix UGLNSW project.

## 📁 Directory Structure

```
docs/supabase/
├── README.md                        # This file - navigation and overview
├── DEPLOYMENT-OVERVIEW.md          # General deployment concepts and strategies
├── ENVIRONMENT-MANAGEMENT.md       # Managing local, staging, and production environments
├── DATABASE-MIGRATION-GUIDE.md     # Database migration best practices
└── edge-functions/                 # Edge functions specific documentation
    ├── README.md                   # Edge functions overview
    ├── PRD-EDGE-FUNCTIONS-SETUP.md # Product requirements document
    ├── TODO-EDGE-FUNCTIONS-CHECKLIST.md # Implementation checklist
    ├── DEVELOPMENT-GUIDE.md        # Local development guide
    ├── DEPLOYMENT-GUIDE.md         # CI/CD and deployment procedures
    └── TROUBLESHOOTING.md          # Common issues and solutions
```

## 🚀 Quick Start

1. **New to Supabase?** Start with [DEPLOYMENT-OVERVIEW.md](./DEPLOYMENT-OVERVIEW.md)
2. **Setting up environments?** See [ENVIRONMENT-MANAGEMENT.md](./ENVIRONMENT-MANAGEMENT.md)
3. **Working with Edge Functions?** Jump to [edge-functions/README.md](./edge-functions/README.md)
4. **Database migrations?** Check [DATABASE-MIGRATION-GUIDE.md](./DATABASE-MIGRATION-GUIDE.md)

## 🎯 Key Concepts

### Environment Strategy
- **Local Development**: Full Supabase stack running on your machine
- **Staging/Preview**: Branch-based preview environments
- **Production**: Live environment with automated deployments

### Deployment Methods
1. **GitHub Integration**: Automated deployments on push
2. **Supabase CLI**: Manual deployments with fine control
3. **Terraform**: Infrastructure as code (advanced)

### Edge Functions
- Serverless functions running on Deno runtime
- Located in `/supabase/functions/`
- Deployed separately from database migrations

## 🔗 Related Documentation

- **Project Architecture**: See `/CLAUDE.md` for project-specific patterns
- **API Documentation**: Check `/app/api/` for API route implementations
- **Database Schema**: Review `/supabase/migrations/` for schema evolution

## 🛠️ Common Tasks

### Deploy to Production
```bash
supabase link --project-ref <project-id>
supabase db push
supabase functions deploy
```

### Create a Preview Branch
```bash
supabase branches create feature-xyz
supabase branches switch feature-xyz
```

### Run Migrations Locally
```bash
supabase start
supabase db reset
```

## 📚 Learning Path

1. **Understand Deployment** → [DEPLOYMENT-OVERVIEW.md](./DEPLOYMENT-OVERVIEW.md)
2. **Setup Environments** → [ENVIRONMENT-MANAGEMENT.md](./ENVIRONMENT-MANAGEMENT.md)
3. **Learn Edge Functions** → [edge-functions/DEVELOPMENT-GUIDE.md](./edge-functions/DEVELOPMENT-GUIDE.md)
4. **Implement CI/CD** → [edge-functions/DEPLOYMENT-GUIDE.md](./edge-functions/DEPLOYMENT-GUIDE.md)

## 🚨 Important Notes

- **Never commit `.env` files** - Use proper secret management
- **Always test locally first** - Use `supabase start` for local development
- **Follow migration order** - Migrations must be sequential
- **Check RLS policies** - Security is enforced at the database level

## 🤝 Contributing

When adding new documentation:
1. Follow the existing naming patterns
2. Update this README with new files
3. Cross-reference related documents
4. Include practical examples

## 📞 Getting Help

- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Official Docs**: [supabase.com/docs](https://supabase.com/docs)
- **GitHub Issues**: For project-specific questions