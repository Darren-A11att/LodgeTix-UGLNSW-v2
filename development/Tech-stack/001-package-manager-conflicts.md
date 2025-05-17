# Package Manager Conflicts

## Conflict Summary
Multiple package managers are present in the codebase, creating potential dependency resolution issues and build inconsistencies.

## Forensic Analysis

### Files Present
1. **Lock Files:**
   - `pnpm-lock.yaml` (22,947 lines) - PNPM
   - `bun.lock` (binary file) - Bun
   - NO `package-lock.json` - NPM (missing)

2. **package.json scripts:**
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "next lint"
   }
   ```
   - Uses generic commands without specific package manager

### Conflicting Evidence

1. **Shell Scripts Reference NPM:**
   - `/scripts/analyze-bundle.sh`:
     ```bash
     echo "Ensure you've run 'npm run build' first"
     ```
   
2. **Development Instructions (assumed NPM):**
   - Most Next.js documentation uses npm by default
   - Team members may use different package managers

3. **CI/CD Pipeline Issues:**
   - Deployment platforms may default to npm without lock file
   - Different developers may get different dependency versions

### Specific Problems

1. **Dependency Version Mismatches:**
   - PNPM uses hard links and symlinks (space efficient)
   - Bun uses its own resolution algorithm
   - NPM uses nested node_modules
   - Each creates different dependency trees

2. **Installation Failures:**
   ```bash
   # Developer A uses:
   pnpm install  # Uses pnpm-lock.yaml
   
   # Developer B uses:
   bun install   # Uses bun.lock
   
   # CI/CD uses:
   npm install   # No lock file, creates new resolution
   ```

3. **Performance Inconsistencies:**
   - Bun is faster but less mature
   - PNPM saves disk space
   - NPM is most compatible

## Recommended Remediation

### Immediate Actions

1. **Choose ONE package manager (Recommend NPM):**
   ```bash
   # Generate npm lock file from existing dependencies
   npm install
   
   # Remove other lock files
   rm pnpm-lock.yaml
   rm bun.lock
   ```

2. **Update package.json to enforce package manager:**
   ```json
   {
     "engines": {
       "npm": ">=8.0.0",
       "node": ">=18.0.0"
     },
     "packageManager": "npm@8.19.4"
   }
   ```

3. **Add .npmrc file:**
   ```
   engine-strict=true
   save-exact=true
   ```

4. **Update .gitignore:**
   ```
   # Remove other lock files
   pnpm-lock.yaml
   bun.lock
   yarn.lock
   ```

5. **Update documentation:**
   - Add clear instructions in README.md
   - Update CLAUDE.md with package manager choice

6. **Verify scripts still work:**
   ```bash
   npm run dev
   npm run build
   npm run test
   ```

### Long-term Strategy

1. **Team alignment:**
   - Document the decision
   - Ensure all developers use the same package manager
   - Add pre-commit hooks to check for wrong lock files

2. **CI/CD updates:**
   - Configure deployment to use chosen package manager
   - Cache dependencies based on lock file

3. **Migration path:**
   - If switching from PNPM/Bun, test thoroughly
   - Some packages may behave differently
   - Monitor for any peer dependency issues

## Risk Assessment

- **High Risk:** Build failures in production
- **Medium Risk:** Dependency version conflicts
- **Low Risk:** Development environment inconsistencies

## Timeline

1. Immediate: Remove conflicting lock files
2. Day 1: Update documentation and configs
3. Week 1: Ensure team alignment
4. Ongoing: Monitor for issues