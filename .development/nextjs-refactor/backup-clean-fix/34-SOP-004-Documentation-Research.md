# SOP-004: Documentation Research Process

## Purpose
This SOP defines how to research official documentation and best practices when creating laws, adopting technologies, or solving architectural challenges.

## Scope
This process applies to:
- Creating new immutable laws
- Evaluating new technologies
- Resolving architectural decisions
- Updating existing patterns
- Learning framework updates

## Process

### Step 1: Identify Research Scope

#### 1.1 Define Research Goals
Document what you're researching:
```markdown
Research Topic: [Technology/Pattern/Framework]
Version: [X.X.X]
Purpose: [Why researching]
Questions to answer:
1. [Question 1]
2. [Question 2]
3. [Question 3]
```

#### 1.2 Identify Primary Sources
Locate official resources:
- [ ] Official documentation site
- [ ] GitHub repository
- [ ] Release notes
- [ ] Migration guides
- [ ] API reference
- [ ] Security advisories

### Step 2: Systematic Documentation Review

#### 2.1 Core Documentation
Read and document:
```markdown
## Core Concepts
Source: [URL]
Key findings:
- [Finding 1]
- [Finding 2]

Relevant to our laws:
- [Law/Pattern impact]
```

#### 2.2 Best Practices Guide
Extract recommendations:
```markdown
## Best Practices
Source: [URL]

### Recommended Patterns
1. [Pattern]: [Description]
   - Why: [Reasoning]
   - Example: [Code snippet]

2. [Pattern]: [Description]
   - Why: [Reasoning]
   - Example: [Code snippet]

### Anti-patterns to Avoid
1. [Anti-pattern]: [Why bad]
2. [Anti-pattern]: [Why bad]
```

#### 2.3 Architecture Guidance
Document architectural recommendations:
```markdown
## Architecture Patterns
Source: [URL]

File structure:
- [Recommendation]

Component patterns:
- [Recommendation]

State management:
- [Recommendation]

Performance:
- [Recommendation]
```

### Step 3: Community Research

#### 3.1 Trusted Sources
Research from:
- [ ] Framework authors' blogs
- [ ] Core team members
- [ ] Official examples
- [ ] Conference talks
- [ ] Reputable tutorials

#### 3.2 Community Patterns
Document common patterns:
```markdown
## Community Patterns
Source: [Author/URL]
Credibility: [Why trusted]

Pattern: [Name]
Usage: [When to use]
Example: [Code]
Adoption: [How widespread]
```

### Step 4: Compatibility Analysis

#### 4.1 Framework Compatibility
Check compatibility with:
- [ ] Current Next.js version
- [ ] TypeScript requirements
- [ ] Build tools
- [ ] Testing frameworks
- [ ] Other dependencies

#### 4.2 Law Compatibility
Analyze against laws:
```markdown
## Law Compatibility Analysis

Law 1 (Server Components):
- Compatible: [Yes/No]
- Concerns: [Details]
- Adaptations needed: [Changes]

Law 2 (File-based Routing):
- Compatible: [Yes/No]
- Concerns: [Details]
- Adaptations needed: [Changes]

[Continue for all laws...]
```

### Step 5: Synthesis and Recommendations

#### 5.1 Key Findings Summary
Create executive summary:
```markdown
## Research Summary

### Primary Findings
1. [Most important finding]
2. [Second finding]
3. [Third finding]

### Recommended Actions
1. [Action 1]: [Why]
2. [Action 2]: [Why]

### Law Impacts
- Create new law for: [Topic]
- Modify Law [X] to include: [Change]
- No changes needed for: [Laws]

### Risks/Concerns
1. [Risk]: [Mitigation]
2. [Risk]: [Mitigation]
```

#### 5.2 Documentation Package
Compile research package:
- Executive summary
- Detailed findings
- Code examples
- Migration strategies
- Risk assessment

### Step 6: Peer Review

#### 6.1 Research Review
Have reviewed by:
- [ ] Senior developer
- [ ] Architecture team member
- [ ] Subject matter expert

#### 6.2 Validation Questions
Reviewers should verify:
- Are sources authoritative?
- Is research comprehensive?
- Are conclusions sound?
- Are risks identified?

## Research Templates

### Quick Research Template
```markdown
# Quick Research: [Topic]
Date: [YYYY-MM-DD]
Researcher: [Name]

## Question
[What we're trying to answer]

## Sources Consulted
1. [URL]: [Key finding]
2. [URL]: [Key finding]

## Answer
[Concise answer]

## Recommendation
[Action to take]
```

### Deep Research Template
```markdown
# Research Report: [Topic]
Date: [YYYY-MM-DD]
Researcher: [Name]
Reviewers: [Names]

## Executive Summary
[1-2 paragraphs]

## Research Goals
1. [Goal 1]
2. [Goal 2]

## Methodology
[How research was conducted]

## Findings

### Official Documentation
[Detailed findings]

### Best Practices
[Patterns and recommendations]

### Community Consensus
[Common approaches]

## Analysis

### Compatibility
[With our architecture]

### Risks
[Identified risks]

### Benefits
[Expected benefits]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Appendices
### A. Code Examples
### B. References
### C. Raw Notes
```

## Research Checklist

### Pre-Research
- [ ] Clear goals defined
- [ ] Time boxed (max 4 hours initial)
- [ ] Sources identified

### During Research
- [ ] Official docs reviewed
- [ ] Best practices documented
- [ ] Examples collected
- [ ] Compatibility checked
- [ ] Notes organized

### Post-Research
- [ ] Summary created
- [ ] Recommendations clear
- [ ] Package compiled
- [ ] Review scheduled

## Quality Indicators

### Good Research
✅ Multiple authoritative sources
✅ Clear recommendations
✅ Practical examples
✅ Risk assessment
✅ Compatibility analysis

### Poor Research
❌ Single source only
❌ No concrete examples
❌ Missing risk analysis
❌ Unclear recommendations
❌ No peer review

## Time Management

### Research Time Boxes
- Initial research: 2-4 hours
- Deep dive: 1-2 days
- Peer review: 1-2 hours
- Documentation: 2-4 hours

### When to Stop
Stop researching when:
- Questions answered
- Diminishing returns
- Time box exceeded
- Consensus found

## Common Research Areas

### 1. State Management
Sources:
- React docs
- Next.js docs
- Library docs
- Performance guides

### 2. Data Fetching
Sources:
- Next.js data fetching
- SWR/React Query docs
- GraphQL/REST patterns
- Caching strategies

### 3. Authentication
Sources:
- NextAuth documentation
- Auth provider docs
- Security best practices
- OWASP guidelines

### 4. Testing
Sources:
- Testing library docs
- Jest/Vitest guides
- E2E frameworks
- Coverage strategies

## Accountability

- **Owner**: Tech Lead
- **Reviewers**: Architecture Team
- **Update Frequency**: Quarterly
- **Last Updated**: [Date]

## Related Documents

- [SOP-001-How-To-Write-Laws.md](./SOP-001-How-To-Write-Laws.md)
- [SOP-003-New-Technology-Adoption.md](./SOP-003-New-Technology-Adoption.md)
- [01-immutable-architecture-laws.md](./01-immutable-architecture-laws.md)