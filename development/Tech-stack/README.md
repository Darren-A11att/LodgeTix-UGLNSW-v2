# Tech Stack Conflict Documentation

This directory contains forensic analysis of technology conflicts found in the LodgeTix codebase. Each conflict is documented with detailed analysis and remediation steps.

## File Naming Convention

### Active Issues
- `[seq#]-[issue-name].md` - Issues that still need to be resolved
- Example: `001-package-manager-conflicts.md`

### Resolved Issues
- `DONE-[issue-name].md` - Issues that have been successfully resolved
- Example: `DONE-icon-library-conflicts.md`

### Special Files
- `000-summary-tech-stack-conflicts.md` - Master summary of all conflicts
- `QUICK-WINS-COMPLETED.md` - Implementation report for quick wins
- `README.md` - This file

## Process Flow

1. **Discovery**: Conflicts are identified and documented with sequential numbers
2. **Analysis**: Each conflict gets detailed forensic analysis
3. **Implementation**: Changes are made following remediation steps
4. **Completion**: File is renamed from `###-name.md` to `DONE-name.md`
5. **Documentation**: Resolution status and date are added to the file

## Current Status

### ✅ Resolved (3)
- Icon Library Conflicts
- Duplicate Hook Files  
- React Router vs Next.js Router

### 🔄 Active (6)
- Package Manager Conflicts
- Duplicate Supabase Clients
- UI Component Library Conflicts
- Conflicting CSS Files
- Environment Variable Conflicts
- Version Pinning Issues

## Tech Stack Documentation

### Standards & Guidelines
- [`TECH-STACK-STANDARD.md`](./TECH-STACK-STANDARD.md) - Official technology choices and implementation guidelines
- [`TECH-STACK-DIAGRAM.md`](./TECH-STACK-DIAGRAM.md) - Visual architecture and data flow
- [`TECH-STACK-QUICK-REFERENCE.md`](./TECH-STACK-QUICK-REFERENCE.md) - Quick lookup for developers

### Conflict Resolution
- [`000-summary-tech-stack-conflicts.md`](./000-summary-tech-stack-conflicts.md) - Overview of all conflicts
- Individual conflict analyses in numbered/DONE files

## Quick Reference

The tech stack is built on:
- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand + Context API
- **Payments**: Stripe
- **Icons**: Lucide React (exclusively)

See the standard documentation above for complete details.