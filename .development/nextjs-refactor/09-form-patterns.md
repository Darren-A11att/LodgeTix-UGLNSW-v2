# Form Handling Patterns

## Core Form Principles

These patterns ensure consistent, accessible, and performant form handling across the application.

### Law 1: Server-First Validation
- Always validate on the server for security
- Client-side validation is for UX only
- Never trust client-side data

### Law 2: Progressive Enhancement
- Forms must work without JavaScript
- Use server actions for form submission
- Enhance with client-side features when available

### Law 3: Type-Safe Forms
- Use TypeScript for form data types
- Leverage Zod for runtime validation
- Ensure type consistency from client to server

### Law 4: Accessible Form Design
- Every input must have a label
- Error messages must be associated with inputs
- Support keyboard navigation completely

## Form Architecture Patterns

### Basic Form Pattern with Server Actions
```typescript
// types/forms.ts
import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin'], {
    required_error: 'Please select a role',
  }),
});

export type UserFormData = z.infer<typeof userFormSchema>;

// app/users/create/page.tsx
import { createUser } from '@/lib/actions/users';
import { UserForm } from '@/components/forms/UserForm';

export default function CreateUserPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1>Create User</h1>
      <UserForm action={createUser} />
    </div>
  );
}

// components/forms/UserForm.tsx
'use client';

import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { createUser } from '@/lib/actions/users';

export function UserForm({ 
  action 
}: { 
  action: typeof createUser 
}) {
  const [state, formAction] = useFormState(action, null);
  
  return (
    <form action={formAction} className="space-y-4">
      <FormField
        name="name"
        label="Name"
        type="text"
        error={state?.errors?.name}
        required
      />
      
      <FormField
        name="email"
        label="Email"
        type="email"
        error={state?.errors?.email}
        required
      />
      
      <SelectField
        name="role"
        label="Role"
        options={[
          { value: 'user', label: 'User' },
          { value: 'admin', label: 'Admin' },
        ]}
        error={state?.errors?.role}
        required
      />
      
      <SubmitButton />
    </form>
  );
}

// lib/actions/users.ts
'use server';

import { userFormSchema } from '@/types/forms';
import { revalidatePath } from 'next/cache';

export async function createUser(
  prevState: any,
  formData: FormData
) {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
  };
  
  const validation = userFormSchema.safeParse(rawData);
  
  if (!validation.success) {
    return {
      errors: validation.error.flatten().fieldErrors,
    };
  }
  
  try {
    // Create user in database
    await db.user.create({
      data: validation.data,
    });
    
    revalidatePath('/users');
    redirect('/users');
  } catch (error) {
    return {
      errors: {
        _form: ['Failed to create user'],
      },
    };
  }
}
```

### Field Component Pattern
```typescript
// components/forms/FormField.tsx
interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  error?: string[];
  required?: boolean;
  placeholder?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  error,
  required,
  placeholder,
}: FormFieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  
  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="block text-sm font-medium"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        className={cn(
          "w-full px-3 py-2 border rounded-md",
          error && "border-red-500"
        )}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-500">
          {error[0]}
        </p>
      )}
    </div>
  );
}
```

### Advanced Form with Hook Form
```typescript
// components/forms/AdvancedUserForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userFormSchema, UserFormData } from '@/types/forms';

export function AdvancedUserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
  });
  
  const onSubmit = async (data: UserFormData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof UserFormData, {
              message: messages[0],
            });
          });
        }
        return;
      }
      
      // Success handling
      router.push('/users');
    } catch (error) {
      setError('root', {
        message: 'An unexpected error occurred',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          {...register('name')}
          id="name"
          className={cn(
            "w-full px-3 py-2 border rounded-md",
            errors.name && "border-red-500"
          )}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Multi-Step Form Pattern

```typescript
// components/forms/MultiStepForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Step {
  id: string;
  title: string;
  component: React.ComponentType<StepProps>;
}

interface StepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const steps: Step[] = [
  { id: 'personal', title: 'Personal Info', component: PersonalInfoStep },
  { id: 'contact', title: 'Contact Details', component: ContactDetailsStep },
  { id: 'review', title: 'Review', component: ReviewStep },
];

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const router = useRouter();
  
  const CurrentStepComponent = steps[currentStep].component;
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleUpdate = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
  };
  
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        router.push('/success');
      }
    } catch (error) {
      console.error('Submission error:', error);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator steps={steps} currentStep={currentStep} />
      
      <CurrentStepComponent
        data={formData}
        onUpdate={handleUpdate}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  );
}
```

## Dynamic Form Pattern

```typescript
// components/forms/DynamicForm.tsx
interface DynamicField {
  name: string;
  type: 'text' | 'email' | 'select' | 'checkbox';
  label: string;
  validation?: any;
  options?: { value: string; label: string }[];
  dependsOn?: {
    field: string;
    value: any;
  };
}

export function DynamicForm({ 
  fields,
  onSubmit 
}: {
  fields: DynamicField[];
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({});
  
  const visibleFields = fields.filter(field => {
    if (!field.dependsOn) return true;
    return formData[field.dependsOn.field] === field.dependsOn.value;
  });
  
  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      {visibleFields.map(field => (
        <DynamicField
          key={field.name}
          field={field}
          value={formData[field.name]}
          onChange={(value) => handleChange(field.name, value)}
        />
      ))}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Form State Management Pattern

```typescript
// hooks/useFormState.ts
import { useState, useCallback } from 'react';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => Partial<Record<keyof T, string>>
) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
  });
  
  const handleChange = useCallback((
    name: keyof T,
    value: any
  ) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
      touched: { ...prev.touched, [name]: true },
    }));
  }, []);
  
  const validateForm = useCallback(() => {
    if (!validate) return true;
    
    const errors = validate(state.values);
    setState(prev => ({ ...prev, errors }));
    
    return Object.keys(errors).length === 0;
  }, [state.values, validate]);
  
  return {
    ...state,
    handleChange,
    validateForm,
    setSubmitting: (isSubmitting: boolean) => 
      setState(prev => ({ ...prev, isSubmitting })),
  };
}
```

## Error Handling Patterns

```typescript
// components/forms/ErrorBoundary.tsx
export function FormErrorBoundary({ 
  children,
  fallback 
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}) {
  return (
    <ErrorBoundary
      fallback={fallback || DefaultErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}

// components/forms/ErrorDisplay.tsx
export function ErrorDisplay({ 
  errors,
  className 
}: {
  errors: Record<string, string[]> | null;
  className?: string;
}) {
  if (!errors) return null;
  
  const allErrors = Object.entries(errors).flatMap(([field, messages]) => 
    messages.map(message => ({ field, message }))
  );
  
  if (allErrors.length === 0) return null;
  
  return (
    <div className={cn("bg-red-50 p-4 rounded-md", className)}>
      <h3 className="text-red-800 font-medium">Please fix the following errors:</h3>
      <ul className="mt-2 text-red-700 text-sm">
        {allErrors.map(({ field, message }, index) => (
          <li key={index}>
            {field !== '_form' && <strong>{field}: </strong>}
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Form Performance Patterns

```typescript
// Debounced field validation
export function useDebouncedValidation(
  value: string,
  validator: (value: string) => string | null,
  delay = 300
) {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const validationError = validator(value);
      setError(validationError);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, validator, delay]);
  
  return error;
}

// Optimistic updates
export function useOptimisticSubmit<T>() {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  
  const submit = useCallback(async (
    data: T,
    submitFn: (data: T) => Promise<void>
  ) => {
    setOptimisticData(data);
    
    try {
      await submitFn(data);
    } catch (error) {
      setOptimisticData(null);
      throw error;
    }
  }, []);
  
  return { optimisticData, submit };
}
```

## Anti-Patterns to Avoid

### ❌ DON'T: Validate only on client
```typescript
// Insecure - never trust client validation alone
const handleSubmit = (data) => {
  if (validateClient(data)) {
    await saveToDatabase(data); // Dangerous!
  }
};
```

### ✅ DO: Always validate on server
```typescript
// Secure - server validation is mandatory
const handleSubmit = async (data) => {
  const validation = await validateOnServer(data);
  if (validation.success) {
    await saveToDatabase(validation.data);
  }
};
```

### ❌ DON'T: Use uncontrolled forms without types
```typescript
// Type-unsafe form handling
const handleSubmit = (e) => {
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData); // No type safety
};
```

### ✅ DO: Use typed form handling
```typescript
// Type-safe form handling
const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  const formData = new FormData(e.currentTarget);
  const data = parseFormData<UserFormData>(formData);
};
```