# Manual Testing Guide - Square Payment Integration

## Overview
Test the complete registration flow for both individual and lodge registrations using Square payments.

## Test Card Details
```
Card Number: 4111 1111 1111 1111
Expiry: 12/26
CCV: 111
Postcode: 90210
```

## Test Email Format
Use format: `[random_id]@allatt.me` where random_id matches the raw registration data pattern.

## Individual Registration Test

### Step 1: Start Registration
1. Navigate to: `http://localhost:3001/functions/grand-proclamation-2025/register`
2. Click "Register as Individuals"

### Step 2: Booking Contact Details
Fill the form with:
```
Title: Bro
First Name: John
Last Name: TestUser
Email: ind123@allatt.me  (use unique ID)
Mobile: 0412345678
Address Line 1: 123 Test Street
Suburb: Sydney
Postcode: 2000
State: NSW
Country: Australia
```

### Step 3: Attendee Details
```
Title: Bro
First Name: John
Last Name: TestUser
Rank: MM
Attendee Type: Mason
Lodge: Lodge Canoblas Lewis No. 806
Grand Lodge: United Grand Lodge of New South Wales & Australian Capital Territory
```

### Step 4: Ticket Selection
- Select at least one ticket/event
- Proceed to payment

### Step 5: Payment
1. Wait for Square payment form to load
2. Fill card details:
   - Card Number: 4111 1111 1111 1111
   - Expiry: 12/26
   - CVV: 111
   - Postal Code: 90210
3. Click "Complete Payment"
4. Wait for processing and confirmation

### Expected Result
- Payment should process successfully through Square
- Confirmation page should show with confirmation number starting with "IND-"
- Registration should be marked as completed in database

## Lodge Registration Test

### Step 1: Start Registration
1. Navigate to: `http://localhost:3001/functions/grand-proclamation-2025/register`
2. Click "Register as Lodge"

### Step 2: Lodge Details & Contact
Fill the form with:
```
Lodge Name: Test Lodge No. 999
Table Count: 1

Booking Contact:
Title: W Bro
First Name: Jane
Last Name: TestSecretary
Email: lodge456@allatt.me  (use unique ID)
Mobile: 0412345679
Rank: IM
```

### Step 3: Payment
1. Wait for Square payment form to load
2. Fill same card details as above
3. Click "Complete Lodge Payment"
4. Wait for processing and confirmation

### Expected Result
- Payment should process successfully through Square
- Confirmation page should show with confirmation number starting with "LDG-"
- Registration should be marked as completed in database
- Should create 10 attendee seats (1 table × 10 seats)

## Verification Steps

### 1. Check Database
- Registration should appear in `registrations` table
- Status should be 'completed'
- Payment status should be 'completed'
- Should have `square_payment_id` field populated
- Square fees should be calculated and stored

### 2. Check Square Dashboard
- Payment should appear in Square sandbox dashboard
- Amount should match calculated total (including fees)
- Receipt should be generated

### 3. Check Confirmation Email
- Email should be sent to test email address
- Should contain proper confirmation number
- Should include QR codes and registration details

## Troubleshooting

### Common Issues
1. **Square form not loading**: Check NEXT_PUBLIC_SQUARE_APPLICATION_ID is set
2. **Payment failing**: Verify SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID are correct
3. **Database errors**: Check Supabase connection and migrations
4. **Email not sending**: Check Resend configuration

### Debug URLs
- Environment check: `http://localhost:3001/api/debug-env`
- Registration API: `http://localhost:3001/api/functions/[functionId]/individual-registration`
- Lodge API: `http://localhost:3001/api/functions/[functionId]/packages/[packageId]/lodge-registration`

## Success Criteria
✅ Both individual and lodge registrations complete successfully
✅ Square payments process without errors
✅ Confirmation numbers are generated
✅ Database records are created with correct status
✅ Fees are calculated and stored properly
✅ Confirmation emails are sent