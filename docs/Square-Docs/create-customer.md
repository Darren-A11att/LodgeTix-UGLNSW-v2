Customers API

Create customer
POST

 /v2/customers

Creates a new customer for a business.

You must provide at least one of the following values in your request to this endpoint:

given_name
family_name
company_name
email_address
phone_number
Permissions:CUSTOMERS_WRITE
Guide

Create customer profiles

Try in API Explorer
Request body
idempotency_key

string

The idempotency key for the request. For more information, see Idempotency.

given_name

string

The given name (that is, the first name) associated with the customer profile.

The maximum length for this value is 300 characters.

family_name

string

The family name (that is, the last name) associated with the customer profile.

The maximum length for this value is 300 characters.

company_name

string

A business name associated with the customer profile.

The maximum length for this value is 500 characters.

nickname

string

A nickname for the customer profile.

The maximum length for this value is 100 characters.

email_address

string

The email address associated with the customer profile.

The maximum length for this value is 254 characters.

address


Address

The physical address associated with the customer profile. For maximum length constraints, see Customer addresses. The first_name and last_name fields are ignored if they are present in the request.


Address


address_line_1

string

The first line of the address.

Fields that start with address_line provide the address's most specific details, like street number, street name, and building name. They do not provide less specific details like city, state/province, or country (these details are provided in other fields).

address_line_2

string

The second line of the address, if any.

address_line_3

string

The third line of the address, if any.

locality

string

The city or town of the address. For a full list of field meanings by country, see Working with Addresses.

sublocality

string

A civil region within the address's locality, if any.

sublocality_2

string

A civil region within the address's sublocality, if any.

sublocality_3

string

A civil region within the address's sublocality_2, if any.

administrative_district_level_1

string

A civil entity within the address's country. In the US, this is the state. For a full list of field meanings by country, see Working with Addresses.

administrative_district_level_2

string

A civil entity within the address's administrative_district_level_1. In the US, this is the county.

administrative_district_level_3

string

A civil entity within the address's administrative_district_level_2, if any.

postal_code

string

The address's postal code. For a full list of field meanings by country, see Working with Addresses.

country

string

The address's country, in the two-letter format of ISO 3166. For example, US or FR.


Show values

first_name

string

Optional first name when it's representing recipient.

last_name

string

Optional last name when it's representing recipient.

phone_number

string

The phone number associated with the customer profile. The phone number must be valid and can contain 9–16 digits, with an optional + prefix and country code. For more information, see Customer phone numbers.

reference_id

string

An optional second ID used to associate the customer profile with an entity in another system.

The maximum length for this value is 100 characters.

note

string

A custom note associated with the customer profile.

birthday

string

The birthday associated with the customer profile, in YYYY-MM-DD or MM-DD format. For example, specify 1998-09-21 for September 21, 1998, or 09-21 for September 21. Birthdays are returned in YYYY-MM-DD format, where YYYY is the specified birth year or 0000 if a birth year is not specified.

tax_ids


CustomerTaxIds

The tax ID associated with the customer profile. This field is available only for customers of sellers in EU countries or the United Kingdom. For more information, see Customer tax IDs.


CustomerTaxIds


eu_vat

string

The EU VAT identification number for the customer. For example, IE3426675K. The ID can contain alphanumeric characters only.

Max Length
20
Response fields
errors


Error [ ]

Any errors that occurred during the request.


Error


category

string

Required

The high-level category for the error.


Show values

code

string

Required

The specific code of the error.


Show values

detail

string

A human-readable description of the error for debugging purposes.

field

string

The name of the field provided in the original request (if any) that the error pertains to.

customer


Customer

The created customer.


Customer


id

string

A unique Square-assigned ID for the customer profile.

If you need this ID for an API request, use the ID returned when you created the customer profile or call the SearchCustomers or ListCustomers endpoint.

created_at

string

Read only The timestamp when the customer profile was created, in RFC 3339 format.

Examples for January 25th, 2020 6:25:34pm Pacific Standard Time:

UTC: 2020-01-26T02:25:34Z

Pacific Standard Time with UTC offset: 2020-01-25T18:25:34-08:00

updated_at

string

Read only The timestamp when the customer profile was last updated, in RFC 3339 format.

Examples for January 25th, 2020 6:25:34pm Pacific Standard Time:

UTC: 2020-01-26T02:25:34Z

Pacific Standard Time with UTC offset: 2020-01-25T18:25:34-08:00

given_name

string

The given name (that is, the first name) associated with the customer profile.

family_name

string

The family name (that is, the last name) associated with the customer profile.

nickname

string

A nickname for the customer profile.

company_name

string

A business name associated with the customer profile.

email_address

string

The email address associated with the customer profile.

address


Address

The physical address associated with the customer profile.


Show attributes

phone_number

string

The phone number associated with the customer profile.

birthday

string

The birthday associated with the customer profile, in YYYY-MM-DD format. For example, 1998-09-21 represents September 21, 1998, and 0000-09-21 represents September 21 (without a birth year).

reference_id

string

An optional second ID used to associate the customer profile with an entity in another system.

note

string

A custom note associated with the customer profile.

preferences


CustomerPreferences

Represents general customer preferences.


Show attributes

creation_source

string

The method used to create the customer profile.


Show values

group_ids

string [ ]

The IDs of customer groups the customer belongs to.

segment_ids

string [ ]

The IDs of customer segments the customer belongs to.

version

integer(64-bit)

The Square-assigned version number of the customer profile. The version number is incremented each time an update is committed to the customer profile, except for changes to customer segment membership.

tax_ids


CustomerTaxIds

The tax ID associated with the customer profile. This field is present only for customers of sellers in EU countries or the United Kingdom. For more information, see Customer tax IDs.


Show attributes