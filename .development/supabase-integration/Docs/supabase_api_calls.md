# Supabase API Calls for Registration Process

This document outlines the expected Supabase interactions during the user registration and payment process, based on the schema defined in `scripts/create-registrations-table.sql`.

## 1. Initial Registration Creation

This step occurs when the user submits their registration details, typically before payment processing is finalized. The application backend is responsible for inserting the new registration and associated ticket data into Supabase.

*   **Operation Type:** `INSERT`
*   **Target Tables:** `registrations`, `tickets`
*   **Application API Endpoint (Example):** `POST /api/registrations` (This endpoint would be called by client-side logic like `saveRegistration`)
*   **Supabase Client Call (Illustrative Backend Logic):**

    ```javascript
    // Example of inserting a new registration
    const registrationPayload = {
      // eventId: 'uuid-of-the-event', // Foreign key to Events table
      // customerId: 'uuid-of-the-user', // Foreign key to Customers table (if applicable)
      registrationType: 'MASON', // Enum: 'MASON', 'GUEST', 'LODGE_SECRETARY' (maps to "registrationType")
      // primary_email might not be a direct column, often part of customer or attendee data
      totalAmountPaid: 100.00, // Maps to "totalAmountPaid"
      paymentStatus: 'pending', // Enum, initial status (maps to "paymentStatus")
      // contact_name, contact_phone, billing_address fields are not directly in Registrations.sql
      // These would likely be part of a related Customer/Person/Attendee record, or stored in "registrationData" (JSONB)
      // For example, if storing in registrationData:
      // registrationData: [{ 
      //   contactName: 'John Doe', 
      //   contactPhone: '123-456-7890',
      //   billingAddressLine1: '123 Main St',
      //   // ... etc
      // }], 
      // stripePaymentIntentId: 'pi_xxx', // Maps to "stripePaymentIntentId"
      // Timestamps like "createdAt", "updatedAt", "registrationDate" are often handled by db defaults or set separately
    };

    const { data: newRegistration, error: registrationError } = await supabase
      .from('Registrations') // Table name is "Registrations"
      .insert([registrationPayload])
      .select()
      .single(); // Assuming one registration is created and we want the result back

    if (registrationError || !newRegistration) {
      console.error('Error saving registration:', registrationError);
      // Handle error: return an error response
      return;
    }

    const registrationId = newRegistration.registrationId; // "registrationId" is camelCase

    // Example of inserting associated tickets
    // Note: Ticket structure in Tickets.sql is different from the snake_case example.
    // It links to Attendees and Events. The fields attendee_name, attendee_email are not direct columns in "Tickets".
    // Assuming 'attendeeid' in "Tickets" links to an "Attendees" table record where name/email are stored.
    const ticketsPayload = [
      {
        attendeeid: 'uuid-of-attendee-john', // maps to attendeeid (lowercase)
        eventid: 'uuid-of-the-event',       // maps to eventid (lowercase)
        pricepaid: 60.00,                   // maps to pricepaid (lowercase)
        // ticketdefinitionid: 'uuid-of-ticket-definition', // maps to ticketdefinitionid (lowercase)
        // status: 'Active', // maps to status (lowercase)
        // ... other relevant fields from the "Tickets" table schema using their defined casing
        // e.g., "eventTicketId", "packageId"
      },
      {
        attendeeid: 'uuid-of-attendee-jane', // maps to attendeeid (lowercase)
        eventid: 'uuid-of-the-event',       // maps to eventid (lowercase)
        pricepaid: 40.00,                   // maps to pricepaid (lowercase)
        // ...
      }
    ];

    const { data: insertedTickets, error: ticketsError } = await supabase
      .from('Tickets') // Table name is "Tickets"
      .insert(ticketsPayload)
      .select();

    if (ticketsError) {
      console.error('Error saving tickets:', ticketsError);
      // Potentially roll back registration or mark as incomplete
      // Handle error
      return;
    }
    
    // Return success response with registrationId or full registration details
    ```

## 2. Update Registration with Payment Status

This step occurs after a successful (or failed) payment attempt, typically initiated by a webhook from Stripe or after client-side confirmation from Stripe.

*   **Operation Type:** `UPDATE`
*   **Target Table:** `registrations`
*   **Application API Endpoint (Example):** `PUT /api/registrations/[id]/payment` (where `[id]` is the `registrationId`)
*   **Supabase Client Call (Illustrative Backend Logic from the API route):**

    ```javascript
    // registrationId is obtained from the route parameter
    // paymentIntentId, chargeId, newStatus are obtained from Stripe or request body
    const { paymentIntentId, chargeId, status } = await request.json(); // Example

    let paymentStatusToUpdate;
    switch(status) {
      case 'succeeded': // Or Stripe's equivalent status for success
        paymentStatusToUpdate = 'PAYMENT_SUCCESSFUL'; // This should match the enum value if "paymentStatus" is an enum
        break;
      case 'requires_payment_method': // Or Stripe's equivalent for failure
      case 'failed':
        paymentStatusToUpdate = 'PAYMENT_FAILED'; // This should match the enum value
        break;
      default:
        paymentStatusToUpdate = 'pending'; // Assuming 'pending' is a valid enum value
    }
    
    const updatePayload = {
      paymentStatus: paymentStatusToUpdate, // Maps to "paymentStatus" (camelCase)
      stripePaymentIntentId: paymentIntentId, // Maps to "stripePaymentIntentId" (camelCase)
      // stripe_charge_id: chargeId, // No direct "stripe_charge_id" in Registrations.sql
      updatedAt: new Date().toISOString(), // Maps to "updatedAt" (camelCase)
    };

    if (paymentStatusToUpdate === 'PAYMENT_SUCCESSFUL') {
      // Add any other fields to update upon successful payment
      // updatePayload.payment_date = new Date().toISOString(); // If you have such a field
    }

    const { data: updatedRegistration, error: updateError } = await supabase
      .from('Registrations') // Table name is "Registrations"
      .update(updatePayload)
      .eq('registrationId', registrationId) // "registrationId" is camelCase
      .select()
      .single(); // Expecting a single row to be updated and returned

    if (updateError) {
      console.error('Error updating registration payment status:', updateError);
      // Handle error, e.g., if registrationId not found (leading to 0 rows updated)
      // The error "JSON object requested, multiple (or no) rows returned" can occur here
      // if .single() is used and no row matches, or RLS prevents access.
      return;
    }

    if (!updatedRegistration) {
      // This case also leads to "no rows returned" if registrationId was not found
      console.error('Registration not found for update:', registrationId);
      return;
    }

    // Return success response
    ```

### Key Considerations:

*   **UUIDs:** `registrationId` (camelCase for `Registrations`) and `ticketid` (lowercase for `Tickets`) are UUIDs. Ensure they are generated correctly.
*   **Error "Registration not found: JSON object requested, multiple (or no) rows returned":**
    *   This error on `.single()` means the query with `.eq('registrationId', registrationId)` did not find exactly one row.
    *   **Causes:**
        1.  The `registrationId` used does not exist in the `Registrations` table.
        2.  Row Level Security (RLS) policies are preventing the current user/role from seeing or modifying the row.
        3.  Less likely for UUID primary keys, but multiple rows match (should not happen with `registrationId` as PK).
*   **Row Level Security (RLS):** Verify RLS policies on `Registrations` and `Tickets` tables.
    *   `INSERT` operations need RLS allowing inserts for the authenticated role (or anonymous role if applicable).
    *   `UPDATE` operations (especially in the payment update webhook/route) need RLS that allows the server's role (typically `service_role` if using the admin client, or a specific authenticated user if the update is user-driven) to modify the specific rows.
*   **Transactions/Atomicity:** For creating a registration and its associated tickets, if atomicity is critical (i.e., either both succeed or both fail), consider using a Supabase Edge Function or a database function (stored procedure) to perform these operations within a single transaction. The exact field names within the function would need to match the database schema.
*   **Data Validation:** Ensure all data (especially enums like `paymentStatus`, `registrationType`) conforms to the schema (including casing if they are string types in JS being sent as JSON) before sending to Supabase.
*   **`select()` and `.single()`:**
    *   Using `.select()` after `insert` or `update` returns the affected rows.
    *   `.single()` is used when you expect exactly one row. If zero or more than one row is returned, it will result in an error. For updates by primary key, one row is typical. For inserts, if you insert one row and use `.select().single()`, you get that one row back.

This documentation should help in tracing how data is intended to flow to and from Supabase during the registration process. 