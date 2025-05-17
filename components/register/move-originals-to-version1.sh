#!/bin/bash

# Script to move original files to version1/ directory without changing imports
# This will help test if the refactored code works independently

echo "Creating version1 directory structure..."

# Create the version1 directory
mkdir -p version1

# Find and move original files that were refactored
# These are files that should have been replaced by the new structure

echo "Moving original files to version1..."

# AttendeeCard original
if [ -f "registration/attendee-card.tsx.bak" ]; then
    mkdir -p version1/registration
    mv registration/attendee-card.tsx.bak version1/registration/
    echo "Moved attendee-card.tsx.bak"
fi

# SectionHeader original
if [ -f "registration/SectionHeader.tsx.bak" ]; then
    mkdir -p version1/registration
    mv registration/SectionHeader.tsx.bak version1/registration/
    echo "Moved SectionHeader.tsx.bak"
fi

# Original payment-step.tsx (there should be an original one)
if [ -f "steps/payment-step.tsx" ]; then
    mkdir -p version1/steps
    cp steps/payment-step.tsx version1/steps/payment-step.original.tsx
    echo "Copied payment-step.tsx"
fi

# Original OrderSummary.tsx
if [ -f "payment/OrderSummary.tsx.bak" ]; then
    mkdir -p version1/payment
    mv payment/OrderSummary.tsx.bak version1/payment/
    echo "Moved OrderSummary.tsx.bak"
fi

# Original PaymentMethod.tsx
if [ -f "payment/PaymentMethod.tsx.bak" ]; then
    mkdir -p version1/payment
    mv payment/PaymentMethod.tsx.bak version1/payment/
    echo "Moved PaymentMethod.tsx.bak"
fi

# Original FilterableCombobox.tsx
if [ -f "payment/FilterableCombobox.tsx.bak" ]; then
    mkdir -p version1/payment
    mv payment/FilterableCombobox.tsx.bak version1/payment/
    echo "Moved FilterableCombobox.tsx.bak"
fi

# Original registration-step-indicator.tsx
if [ -f "registration/registration-step-indicator.tsx.bak" ]; then
    mkdir -p version1/registration
    mv registration/registration-step-indicator.tsx.bak version1/registration/
    echo "Moved registration-step-indicator.tsx.bak"
fi

# Original ContactConfirmationMessage.tsx
if [ -f "ui/ContactConfirmationMessage.tsx.bak" ]; then
    mkdir -p version1/ui
    mv ui/ContactConfirmationMessage.tsx.bak version1/ui/
    echo "Moved ContactConfirmationMessage.tsx.bak"
fi

# Original confirmation-step.tsx
if [ -f "order/confirmation-step.tsx" ]; then
    mkdir -p version1/order
    cp order/confirmation-step.tsx version1/order/confirmation-step.original.tsx
    echo "Copied confirmation-step.tsx"
fi

# Original order-review-step.tsx
if [ -f "order/order-review-step.tsx" ]; then
    mkdir -p version1/order
    cp order/order-review-step.tsx version1/order/order-review-step.original.tsx
    echo "Copied order-review-step.tsx"
fi

# Original ticket-selection-step.tsx
if [ -f "steps/ticket-selection-step.tsx" ]; then
    mkdir -p version1/steps
    cp steps/ticket-selection-step.tsx version1/steps/ticket-selection-step.original.tsx
    echo "Copied ticket-selection-step.tsx"
fi

# Original registration-type-step.tsx
if [ -f "steps/registration-type-step.tsx" ]; then
    mkdir -p version1/steps
    cp steps/registration-type-step.tsx version1/steps/registration-type-step.original.tsx
    echo "Copied registration-type-step.tsx"
fi

# Original registration-wizard.tsx
if [ -f "registration/registration-wizard.tsx" ]; then
    mkdir -p version1/registration
    cp registration/registration-wizard.tsx version1/registration/registration-wizard.original.tsx
    echo "Copied registration-wizard.tsx"
fi

# Original BillingDetailsForm.tsx
if [ -f "payment/BillingDetailsForm.tsx" ]; then
    mkdir -p version1/payment
    cp payment/BillingDetailsForm.tsx version1/payment/BillingDetailsForm.original.tsx
    echo "Copied BillingDetailsForm.tsx"
fi

# Original CheckoutForm.tsx
if [ -f "payment/CheckoutForm.tsx" ]; then
    mkdir -p version1/payment
    cp payment/CheckoutForm.tsx version1/payment/CheckoutForm.original.tsx
    echo "Copied CheckoutForm.tsx"
fi

echo ""
echo "Now removing original files to test refactored versions..."
echo ""

# Remove original files (keep refactored ones)
# Only remove if the refactored version exists

# Remove original payment-step if refactored exists
if [ -d "steps/payment/" ] && [ -f "steps/payment-step.tsx" ]; then
    echo "Removing original payment-step.tsx"
    rm steps/payment-step.tsx
fi

# Remove original order files if refactored versions exist
if [ -d "order/confirmation/" ] && [ -f "order/confirmation-step.tsx" ]; then
    echo "Removing original confirmation-step.tsx"
    rm order/confirmation-step.tsx
fi

if [ -d "order/review/" ] && [ -f "order/order-review-step.tsx" ]; then
    echo "Removing original order-review-step.tsx"
    rm order/order-review-step.tsx
fi

# Remove original step files if refactored versions exist
if [ -d "steps/ticket-selection/" ] && [ -f "steps/ticket-selection-step.tsx" ]; then
    echo "Removing original ticket-selection-step.tsx"
    rm steps/ticket-selection-step.tsx
fi

if [ -d "steps/registration-type/" ] && [ -f "steps/registration-type-step.tsx" ]; then
    echo "Removing original registration-type-step.tsx"
    rm steps/registration-type-step.tsx
fi

# Remove original registration-wizard if refactored exists
if [ -d "registration/wizard/" ] && [ -f "registration/registration-wizard.tsx" ]; then
    echo "Removing original registration-wizard.tsx"
    rm registration/registration-wizard.tsx
fi

# Remove original BillingDetailsForm if refactored exists
if [ -d "payment/billing/" ] && [ -f "payment/BillingDetailsForm.tsx" ]; then
    echo "Removing original BillingDetailsForm.tsx"
    rm payment/BillingDetailsForm.tsx
fi

# Remove original CheckoutForm if refactored exists
if [ -d "payment/checkout/" ] && [ -f "payment/CheckoutForm.tsx" ]; then
    echo "Removing original CheckoutForm.tsx"
    rm payment/CheckoutForm.tsx
fi

echo ""
echo "Done! Original files have been moved to version1/"
echo "The application should now use only the refactored components."
echo ""
echo "To test: npm run dev"
echo ""
echo "To restore originals: cp -r version1/* ."