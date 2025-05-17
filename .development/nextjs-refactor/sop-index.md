# Standard Operating Procedures Index

This index provides quick access to all SOPs in the Next.js architecture documentation.

## Available SOPs

### Core Process SOPs
- **[SOP-001](./SOP-001-How-To-Write-Laws.md)**: How to Write Immutable Laws
  - Creating new architectural laws
  - Modifying existing laws
  - Validation criteria

- **[SOP-002](./SOP-002-Law-Integration-Process.md)**: Law Integration Process
  - Integrating new requirements
  - Technology adoption into laws
  - Conflict resolution

- **[SOP-003](./SOP-003-New-Technology-Adoption.md)**: New Technology Adoption
  - Evaluating new libraries/tools
  - Compatibility assessment
  - Implementation planning

- **[SOP-004](./SOP-004-Documentation-Research.md)**: Documentation Research Process
  - Researching official documentation
  - Best practices analysis
  - Compatibility assessment
  - Research templates

### Templates
- **[SOP-000](./SOP-000-Template.md)**: SOP Template
  - Standard format for new SOPs
  - Required sections
  - Best practices

## SOP Numbering Convention

```
SOP-XXX-[Descriptive-Title].md

Where XXX is:
000-099: Templates and meta-SOPs
100-199: Architecture and laws
200-299: Development processes
300-399: Technology adoption
400-499: Code review and quality
500-599: Deployment and operations
600-699: Security and compliance
700-799: Performance and optimization
800-899: Documentation and training
900-999: Reserved for future use
```

## How to Create a New SOP

1. Copy [SOP-000-Template.md](./SOP-000-Template.md)
2. Choose appropriate number range
3. Follow the template structure
4. Submit PR with:
   - New SOP file
   - Updated this index
   - Updated guide summary

## SOP Categories

### 🏛️ Architecture (100-199)
SOPs related to architectural decisions, laws, and patterns.

### 🔧 Development (200-299)
Day-to-day development processes and workflows.

### 🚀 Technology (300-399)
Adopting new technologies, libraries, and tools.

### ✅ Quality (400-499)
Code review, testing, and quality assurance processes.

### 📦 Deployment (500-599)
Build, deployment, and operational procedures.

### 🔒 Security (600-699)
Security practices and compliance requirements.

### ⚡ Performance (700-799)
Performance optimization and monitoring.

### 📚 Documentation (800-899)
Documentation standards and training materials.

## Quick Decision Tree

```
Need to create a process?
├─ About laws/architecture? → 100-199
├─ About daily development? → 200-299
├─ About new technology? → 300-399
├─ About code quality? → 400-499
├─ About deployment? → 500-599
├─ About security? → 600-699
├─ About performance? → 700-799
└─ About documentation? → 800-899
```

## Maintenance

- Review quarterly for relevance
- Archive obsolete SOPs
- Update based on team feedback
- Ensure consistency with laws

## Related Documents

- [00-guide-summary.md](./00-guide-summary.md) - Complete documentation index
- [01-immutable-architecture-laws.md](./01-immutable-architecture-laws.md) - Core laws
- [11-application-of-laws.md](./11-application-of-laws.md) - Law application guide