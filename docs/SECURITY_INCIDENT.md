# Security Incident - Exposed Credentials

## What Happened
On commit `ad31e3d`, sensitive credentials were accidentally committed in the `.mcp.json` file:
- GitHub Personal Access Token
- Supabase Access Token

## Actions Taken
1. **Immediate Response:**
   - GitHub automatically detected and revoked the exposed GitHub PAT
   - Removed `.mcp.json` from repository in commit `dc14c87`
   - Added `.mcp.json` to `.gitignore`
   - Created secure configuration template

2. **Required Actions:**
   - ✅ Generate new GitHub Personal Access Token
   - ⚠️ Generate new Supabase Access Token (current one may still be active)
   - ✅ Update local `.mcp.json` with new tokens

## Important Note
The exposed credentials still exist in git history (commit `ad31e3d`). While the immediate threat has been mitigated by revoking tokens, consider:

### Option 1: Clean Git History (Recommended for sensitive repos)
```bash
# Using BFG Repo-Cleaner
java -jar bfg.jar --delete-files .mcp.json
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

### Option 2: Leave History (If tokens are revoked)
- Ensure all exposed tokens are revoked
- Document the incident
- Move forward with secure practices

## Prevention
- Always use `.gitignore` for sensitive files
- Use environment variables when possible
- Review commits before pushing
- Use pre-commit hooks to check for secrets

## Tokens to Regenerate
1. **GitHub PAT**: Already revoked, needs regeneration
2. **Supabase Token**: Should be regenerated as precaution

## References
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)