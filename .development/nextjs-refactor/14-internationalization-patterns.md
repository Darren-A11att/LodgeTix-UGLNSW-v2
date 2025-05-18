# Immutable Internationalization Laws

## Core i18n Requirements

These are the non-negotiable internationalization laws that MUST be followed in all Next.js development:

### Law 1: No Hardcoded Text
- All user-facing text must use translation keys
- Developer messages must be translatable
- Error messages require translation
- Button labels must be externalized
- No string concatenation for messages

### Law 2: Locale-Aware Formatting
- Dates formatted per locale rules
- Numbers use locale separators
- Currency displays with locale format
- Time zones handled properly
- Relative time calculations supported

### Law 3: Translation Key Structure
- Hierarchical key organization required
- Consistent naming conventions
- Context included in key names
- No duplicate keys allowed
- Namespace separation mandatory

### Law 4: Bidirectional Text Support
- RTL languages must be supported
- Use logical CSS properties only
- Mirror UI layouts for RTL
- Test with RTL languages
- Icons flipped when needed

### Law 5: Dynamic Content Loading
- Lazy load translation bundles
- Code-split by language
- Cache translations effectively
- Fallback language required
- Missing translation handling

### Law 6: Context-Aware Translations
- Support pluralization rules
- Gender-aware translations
- Parameterized messages supported
- Rich text formatting allowed
- Variable interpolation safe

### Law 7: Language Detection
- Auto-detect user preference
- Respect browser language
- Allow manual language selection
- Persist language choice
- Provide language switcher

### Law 8: Translation Workflow
- Extracted keys for translators
- Version control for translations
- Translation status tracking
- Review process required
- Regular translation audits

### Law 9: Performance Optimization
- Minimize translation bundle size
- Efficient key lookup system
- Avoid runtime translation generation
- Cache translated content
- Preload common translations

### Law 10: Accessibility in i18n
- Language tags in HTML required
- Screen reader pronunciation hints
- Translated alt text for images
- ARIA labels must be translated
- Language change announcements

## Enforcement

These laws are enforced through:
1. ESLint rules for hardcoded strings
2. Build-time translation validation
3. Missing translation detection
4. Bundle size monitoring
5. RTL testing requirements

## References

- [14-internationalization-patterns.md](./14-internationalization-patterns.md) - Implementation patterns
- [Next.js i18n Docs](https://nextjs.org/docs/advanced-features/i18n-routing)
- [CLDR Internationalization](http://cldr.unicode.org/)