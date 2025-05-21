# Summary Column Components

## Overview
This directory contains components for building consistent summary columns across all registration wizard steps. The summary column provides contextual information, status updates, and user assistance in the right column of the TwoColumnStepLayout.

## Core Components

### `SummaryColumn`
The main container component that provides consistent structure and styling for summary content. It supports:
- Custom sections specific to each step
- Default sections that appear across multiple steps
- Optional progress tracking
- Common action buttons

### `SummarySection`
A section component for organizing content within the summary column. Features:
- Consistent section styling with title
- Optional icon support
- Collapsible sections with expand/collapse functionality
- Customizable spacing and styling

### `SummaryItem`
A component for displaying key-value pairs within summary sections. Includes:
- Label and value display with consistent styling
- Optional icon support
- Optional action button/link
- Customizable styling

### `StatusIndicator`
A component for displaying status information with consistent styling:
- Multiple status types (success, warning, error, pending, info)
- Icon + text or icon-only variants
- Color-coded for quick recognition
- Accessible design with appropriate contrast

## Usage

1. Import the components:
```tsx
import { SummaryColumn, SummarySection, SummaryItem, StatusIndicator } from '../Summary';
```

2. Create step-specific summary content:
```tsx
const stepSpecificContent = (
  <>
    <SummarySection title="Section Title" icon={<Icon />}>
      <SummaryItem label="Item Label" value="Item Value" />
      {/* More items */}
    </SummarySection>
    {/* More sections */}
  </>
);
```

3. Use SummaryColumn in your step component:
```tsx
<TwoColumnStepLayout
  summaryContent={
    <SummaryColumn
      title="Summary Title"
      customSections={stepSpecificContent}
      showProgress={true}
    />
  }
  summaryTitle="Summary"
>
  {/* Step content */}
</TwoColumnStepLayout>
```

## Examples
See the `/examples` directory for sample implementations for different registration steps.

## Best Practices
- Keep summary content concise and focused on helping the user
- Use consistent icons across all summary sections
- Prioritize the most important information at the top
- Use status indicators to show completion/validation
- Ensure all content is accessible and readable
- Test the mobile collapse/expand behavior thoroughly