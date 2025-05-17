# SOP-001: How to Write Immutable Laws

## Purpose
This Standard Operating Procedure defines the process for creating new immutable laws for the Next.js project. All new laws must follow this process to ensure consistency, necessity, and proper integration.

## Scope
This SOP applies to:
- Adding new immutable laws
- Modifying existing laws
- Creating pattern documentation
- Establishing new SOPs

## Process

### Step 1: Identify the Need

#### 1.1 Problem Definition
Document the specific problem that requires a new law:
- What issue is occurring repeatedly?
- What inconsistency needs to be addressed?
- What pattern needs to be enforced?

#### 1.2 Research Existing Laws
Before creating a new law:
- [ ] Check if existing laws already cover this area
- [ ] Identify if this should be an enhancement to an existing law
- [ ] Confirm no duplication with current laws

#### 1.3 Research External Documentation
If the law relates to a technology/framework:
- [ ] Review official documentation
- [ ] Study best practices guides
- [ ] Analyze community patterns
- [ ] Check style guides
- [ ] Review security recommendations

Document findings:
```markdown
## External Research
Technology: [Name]
Documentation reviewed:
- [Doc 1 URL]: [Key findings]
- [Doc 2 URL]: [Key findings]

Recommended patterns:
1. [Pattern 1]
2. [Pattern 2]

This research suggests:
- New law needed for [topic]
- Existing law [X] should include [addition]
```

### Step 2: Validate Necessity

#### 2.1 Apply the NECESSARY Test
A law is necessary if it meets ALL criteria:
- **N**on-negotiable - Must be followed without exception
- **E**nforceable - Can be checked in code reviews
- **C**lear - Unambiguous and specific
- **E**ssential - Core to architecture integrity
- **S**calable - Works for all team sizes
- **S**ustainable - Won't become outdated quickly
- **A**pplicable - Relevant to most developers
- **R**easonable - Doesn't hinder productivity
- **Y**ielding - Produces measurable benefits

#### 2.2 Impact Assessment
Document:
- How many developers will this affect?
- What existing code needs updating?
- What tooling changes are required?

### Step 3: Draft the Law

#### 3.1 Law Structure Template
```markdown
### Law [Number]: [Clear, Actionable Title]
- [Primary principle statement]
- [Specific requirement 1]
- [Specific requirement 2]
- [Enforcement mechanism]
- [Reference to detailed patterns if applicable]
```

#### 3.2 Writing Guidelines
- Use imperative language ("Use", "Must", "Always")
- Be specific, not vague
- Include both DO and DON'T examples
- Keep it concise (5-7 bullet points max)

### Step 4: Create Supporting Documentation

#### 4.1 Pattern Documentation
If the law requires detailed patterns:
1. Create pattern file: `[number]-[topic]-patterns.md`
2. Include:
   - Detailed examples (both good and bad)
   - Common scenarios
   - Edge cases
   - Migration guide from old patterns

#### 4.2 Update Existing Documentation
- [ ] Update the laws summary
- [ ] Modify related pattern files
- [ ] Update practical guides
- [ ] Enhance code review guides

### Step 5: Integration and Review

#### 5.1 Integration Checklist
- [ ] Law doesn't conflict with existing laws
- [ ] Law enhances rather than duplicates
- [ ] References are bidirectional
- [ ] Examples use current tech stack

#### 5.2 Peer Review Process
1. Create PR with:
   - New law in main laws file
   - Supporting documentation
   - Updated summary files
2. Require approval from:
   - At least 2 senior developers
   - Architecture team lead
   - Project manager

### Step 6: Implementation

#### 6.1 Rollout Plan
1. Team announcement
2. Training session if complex
3. Grace period for existing code
4. Enforcement start date

#### 6.2 Tooling Updates
- [ ] Update linting rules
- [ ] Modify code templates
- [ ] Update CI/CD checks
- [ ] Enhance IDE configurations

## Templates

### New SOP Template
```markdown
# SOP-[XXX]: [Title]

## Purpose
[Why this SOP exists]

## Scope
[What this covers and doesn't cover]

## Process
### Step 1: [Action]
#### 1.1 [Sub-action]
[Details]

## Accountability
- Owner: [Role]
- Reviewers: [Roles]
- Update Frequency: [Timeline]
```

### Law Documentation Structure
```
.development/nextjs-refactor/
├── 01-immutable-architecture-laws.md  # Main laws
├── 00-immutable-laws-summary.md       # Quick reference
├── [XX]-[topic]-patterns.md          # Detailed patterns
├── [XX]-practical-guide-[topic].md   # How-to guide
├── SOP-[XXX]-[title].md             # Process documents
└── 00-guide-summary.md              # Documentation index
```

## Decision Matrix

### When to Create a Law vs Pattern vs Guideline

| Criteria | Law | Pattern | Guideline |
|----------|-----|---------|-----------|
| Violations break the system | ✓ | ✗ | ✗ |
| Has exceptions | ✗ | Sometimes | Often |
| Enforcement | Mandatory | Recommended | Optional |
| Scope | Architecture-wide | Feature-specific | Team preference |
| Review requirement | Always enforced | Usually checked | Best effort |

## Common Pitfalls to Avoid

1. **Too Specific**: Laws should be principles, not implementations
2. **Too Vague**: "Write good code" is not a law
3. **Unenforceable**: Can't be checked in reviews
4. **Trendy**: Based on current fads vs timeless principles
5. **Premature**: Creating laws for problems that don't exist yet

## Review Criteria

### Good Law Example
```
### Law X: Server Components by Default
- Always use Server Components unless client interactivity is required
- Client Components marked with 'use client' only when necessary
- Minimize JavaScript bundle by keeping components on server
```
✓ Clear principle
✓ Specific requirement
✓ Enforceable
✓ Measurable benefit

### Bad Law Example
```
### Law X: Write Clean Code
- Code should be clean and readable
- Follow best practices
- Make it maintainable
```
✗ Vague terms
✗ Not enforceable
✗ No specific requirements
✗ Subjective interpretation

## Maintenance

### Quarterly Review Process
1. Review all laws for:
   - Continued relevance
   - Technology updates
   - Team feedback
   - Enforcement success
2. Archive obsolete laws
3. Update patterns for new versions

### Change Control
- Major law changes require full team approval
- Minor clarifications need 2 reviewers
- Pattern updates can be merged with 1 review

## Accountability

- **Owner**: Lead Architect
- **Reviewers**: Senior Development Team
- **Update Frequency**: Quarterly
- **Last Updated**: [Current Date]

## Related Documents

- [01-immutable-architecture-laws.md](./01-immutable-architecture-laws.md)
- [11-application-of-laws.md](./11-application-of-laws.md)
- [13-code-review-guide.md](./13-code-review-guide.md)