# Immutable Laws Summary

This is a quick reference guide to all immutable laws that MUST be followed in the LodgeTix Next.js project.

## Architecture Laws (from 01-immutable-architecture-laws.md)

1. **Server Components by Default** - Use client components only when necessary
2. **File-Based Routing is Sacred** - Never circumvent Next.js routing conventions
3. **Co-location is King** - Keep related files together
4. **Convention Over Configuration** - Follow Next.js naming conventions strictly
5. **Type Safety is Mandatory** - TypeScript with strict mode, no `any` types
6. **Data Fetching at the Right Level** - Fetch at highest component level
7. **Separation of Concerns** - Business logic in services, UI logic in components
8. **Progressive Enhancement** - Build features that work without JavaScript first
9. **Performance by Design** - Use dynamic imports, optimize images, minimize JS
10. **Consistency Above Cleverness** - Follow established patterns
11. **File Extensions Match Content** - `.tsx` for JSX, `.ts` for everything else
12. **Type Safety Patterns Must Be Followed** - Strict TypeScript configuration
13. **Law Creation Follows Process** - New laws require SOP compliance
14. **Domain-Specific Laws Are Mandatory** - All domains have their own laws

## UI Design Laws (from 02-immutable-ui-design-laws.md)

1. **Component Composition Hierarchy** - Build from single-responsibility units
2. **Mobile-First Responsive Design** - Design for mobile, extend to desktop
3. **Accessibility is Mandatory** - Keyboard accessible, ARIA labels, alt text
4. **User Feedback for Every Action** - Loading states, error messages, confirmations
5. **Consistent Design System Usage** - Use tokens only, no hardcoded values
6. **Performance-First Rendering** - Lazy load, code-split, minimize client JS
7. **State Management Proximity** - State lives close to usage
8. **Error Boundaries Required** - Every page needs error handling
9. **Separation of Concerns** - UI logic separate from business logic
10. **Testing Coverage Requirements** - Visual regression, accessibility, interaction tests

## Theme Design Laws (from 13-theme-design-laws.md)

1. **Design Tokens Only** - No raw values, semantic naming required
2. **CSS Variables Required** - Runtime switching, system preference support
3. **Type-Safe Themes** - TypeScript definitions for all themes
4. **Dark Mode Support** - All components must support dark mode
5. **Accessible Color Contrast** - WCAG AA compliance mandatory
6. **Component Theme Variants** - Use tokens, no inline styles
7. **Theme Context Usage** - Single provider, efficient updates
8. **Responsive Design Tokens** - Breakpoints, spacing, typography scales
9. **Theme Performance** - Minimize repaints, lazy load, cache preferences
10. **Theme Documentation** - Document all tokens and patterns

## Internationalization Laws (from 14-i18n-laws.md)

1. **No Hardcoded Text** - All text must use translation keys
2. **Locale-Aware Formatting** - Dates, numbers, currency per locale
3. **Translation Key Structure** - Hierarchical, consistent, contextual
4. **Bidirectional Text Support** - RTL languages, logical properties
5. **Dynamic Content Loading** - Lazy load bundles, code-split
6. **Context-Aware Translations** - Pluralization, gender, parameters
7. **Language Detection** - Auto-detect, persist choice, provide switcher
8. **Translation Workflow** - Version control, review process, audits
9. **Performance Optimization** - Minimize bundles, cache translations
10. **Accessibility in i18n** - Language tags, screen reader support

## Accessibility Laws (from 15-accessibility-laws.md)

1. **Keyboard Navigation is Mandatory** - All elements keyboard accessible
2. **Semantic HTML First** - Use proper elements, hierarchical headers
3. **ARIA Only When Necessary** - Don't change native semantics
4. **Color Independent Information** - Never use color alone
5. **WCAG AA Compliance Required** - Contrast ratios, text sizing
6. **Image Accessibility Required** - Alt text for all images
7. **Form Accessibility Mandatory** - Labels, errors, validation
8. **Time Limit Accommodations** - Extend, warn, pause capabilities
9. **Motion and Animation Control** - Respect reduced motion preference
10. **Screen Reader Compatibility** - All content accessible

## Error Handling Laws (from 17-error-handling-laws.md)

1. **Error Boundaries Mandatory** - Every page must have boundaries
2. **User-Friendly Error Messages** - No technical details to users
3. **Comprehensive Error Logging** - Log with context and stack traces
4. **Graceful Degradation Required** - Partial functionality during errors
5. **Network Error Resilience** - Retry logic, offline states
6. **Form Error Management** - Client and server validation
7. **API Error Standardization** - Consistent format and codes
8. **Type-Safe Error Handling** - Specific error types, discriminated unions
9. **Performance During Errors** - Optimize error handling performance
10. **Security in Error Handling** - Never expose sensitive data

## Logging Laws (from 18-logging-laws.md)

1. **Structured Logging Only** - JSON format, consistent fields
2. **Security First Logging** - Never log sensitive information
3. **Contextual Information Required** - Request ID, user ID, environment
4. **Appropriate Log Levels** - ERROR, WARN, INFO, DEBUG correctly used
5. **Performance Conscious Logging** - Async, sampling, buffering
6. **Error Context Mandatory** - Stack traces, conditions, browser info
7. **Client-Side Log Management** - Batch, respect privacy, handle offline
8. **Monitoring Integration** - Searchable, alerts, real-time analysis
9. **Environment-Specific Configuration** - Different levels per environment
10. **Log Retention Compliance** - Retention periods, rotation, archival

## Deployment Laws (from 20-deployment-laws.md)

1. **Zero-Downtime Deployments** - Rolling updates, health checks
2. **Environment Parity Required** - Dev, staging, prod identical
3. **Automated Deployment Pipeline** - No manual deployments
4. **Container-Based Deployment** - Immutable images, versioned
5. **Security Throughout Pipeline** - Encrypted secrets, scanning
6. **Build Optimization Mandatory** - Tree shaking, code splitting
7. **Performance Monitoring Required** - RUM, Web Vitals, budgets
8. **Error Recovery Planning** - Automated rollback, backups
9. **Documentation Requirements** - Process docs, runbooks, changelogs
10. **Progressive Rollout Strategy** - Feature flags, canary deployments

## Security Laws (from 21-security-laws.md)

1. **Zero Trust Architecture** - Validate everything, trust nothing
2. **Input Validation Mandatory** - Whitelist approach, sanitize all
3. **Authentication Standards** - MFA for admin, session expiry
4. **Data Protection Required** - Encrypt at rest and in transit
5. **Security Headers Mandatory** - CSP, X-Frame-Options, HSTS
6. **Error Handling Security** - No stack traces to users
7. **Third-Party Security** - Audit dependencies, monitor vulnerabilities
8. **API Security Standards** - Rate limiting, authentication
9. **Security Monitoring Active** - Real-time logging, scanning
10. **OWASP Compliance** - Follow Top 10, regular training

## Quick Reference

### Most Critical Laws
- Type Safety is Mandatory (Architecture #5)
- Zero Trust Architecture (Security #1)
- Accessibility is Mandatory (UI Design #3)
- No Hardcoded Text (i18n #1)
- Error Boundaries Mandatory (Error Handling #1)

### Performance Laws
- Server Components by Default (Architecture #1)
- Performance by Design (Architecture #9)
- Performance-First Rendering (UI Design #6)
- Theme Performance (Theme #9)
- Performance Optimization (i18n #9)

### Security Laws
- Security First Logging (Logging #2)
- Security Throughout Pipeline (Deployment #5)
- Error Handling Security (Security #6)
- API Security Standards (Security #8)
- OWASP Compliance (Security #10)

### Developer Experience Laws
- Convention Over Configuration (Architecture #4)
- Consistency Above Cleverness (Architecture #10)
- Type-Safe Themes (Theme #3)
- Type-Safe Error Handling (Error Handling #8)
- Documentation Requirements (Deployment #9)

## Enforcement

All laws are enforced through:
1. Code review checklists
2. Automated testing and linting
3. CI/CD pipeline checks
4. Regular audits
5. Team training

## References

For detailed implementation patterns, see:
- Pattern files (##-*-patterns.md)
- SOP documents (SOP-###-*.md)
- Practical guides (##-practical-guide-*.md)