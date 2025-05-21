# Homepage Text Data Mapping

This document lists all text data found on the homepage to help plan the migration to Supabase. Add your comments on how each element should be mapped to Supabase fields.

## 1. Hero Section (Grand Installation Hero)

Pull Data from supabase, public.Events ID: 307c2d85-72d5-48cf-ac94-082ca2a5d23d 

- **Title**: "Grand Installation" | public.Events: Title
- **Name**: "MW Bro Bernie Khristian Albano" | public.Events: Subtitle
- **Subtitle**: "Grand Master of the United Grand Lodge of NSW & ACT" | public.Events: organiser
- **Date/Location**: "Saturday, 25 November 2023 • Sydney Masonic Centre" | Location
- **Button Text**: "Purchase Tickets" 

_Comments on Supabase mapping:_
- 

- 

## 2. About the Grand Installation Section

- **Title**: "Grand Installation 2023"
- **Description**: "Join us for the Installation of MW Bro Bernie Khristian Albano as Grand Master of the United Grand Lodge of NSW & ACT. This historic ceremony will bring together Brethren from across Australia and beyond to witness this momentous occasion in Freemasonry."
- **Button 1 Text**: "Event Details"
- **Button 2 Text**: "Get Tickets"

_Comments on Supabase mapping:_
- 
- 
- 

## 3. Event Timeline Section

Pull Data from supabase, public.Events  parentEventId:   and where Featured = TRUE and Date Ascending and max 3 


- **Section Title**: "Event Timeline"

### Installation Ceremony Card
- **Title**: "Installation Ceremony" | public.Events 
- **Date**: "May 15, 2025"
- **Time**: "2:00 PM - 5:00 PM"
- **Description**: "The formal installation of MW Bro Bernie Khristian Albano as Grand Master."

### Grand Banquet Card
- **Title**: "Grand Banquet"
- **Date**: "May 16, 2025"
- **Time**: "7:00 PM - 11:00 PM"
- **Description**: "A formal dinner celebrating the installation with distinguished guests."

### Farewell Brunch Card
- **Title**: "Farewell Brunch"
- **Date**: "May 17, 2025"
- **Time**: "10:00 AM - 1:00 PM"
- **Description**: "A casual gathering to conclude the Grand Installation weekend."

_Comments on Supabase mapping:_
- 
- 
- 

## 4. Other Upcoming Events Section !! 

ublic.Events  parentEventId: 307c2d85-72d5-48cf-ac94-082ca2a5d23d  and where Featured = TRUE and Date Ascending and max 3 

DYNAMIC IMPORT 3 'FEATURED EVENTS'

- **Section Title**: "Other Upcoming Events" | Change to "Featured Events"
- **Link Text**: "View all"

### Event Card 1
- **Title**: "Third Degree Ceremony" | public.Events: title
- **Description**: "A solemn ceremony raising a Brother to the sublime degree of a Master Mason." | public.Events: description
- **Date**: "October 10, 2023" | public.Events: eventStart
- **Location**: "Lodge Commonwealth No. 400, Sydney" | public.Events: location
- **Price**: "$20" | public.Events: price
- **Button Text**: "View Details" --- Button link to dynamic event record, use slug: publc.Events slug
- **Image**: /placeholder.svg?height=200&width=400 | public.Events: inageURL

### Event Card 2
- **Title**: "Masonic Education Night"
- **Description**: "Learn about the symbolism and history of Freemasonry from distinguished speakers."
- **Date**: "September 25, 2023"
- **Location**: "Lodge Antiquity No. 1, Sydney"
- **Price**: "$15"
- **Button Text**: "View Details"
- **Image**: /placeholder.svg?height=200&width=400

### Event Card 3
- **Title**: "Annual Charity Gala"
- **Description**: "A formal dinner raising funds for the Masonic charities of NSW & ACT."
- **Date**: "December 5, 2023"
- **Location**: "Grand Ballroom, Hilton Sydney"
- **Price**: "$95"
- **Button Text**: "View Details"
- **Image**: /placeholder.svg?height=200&width=400

_Comments on Supabase mapping:_
- 
- 
- 

## 5. CTA Section

- **Title**: "Join Us for this Historic Occasion"
- **Description**: "Be part of this momentous event in the history of the United Grand Lodge of NSW & ACT. Tickets are limited, so secure yours today."
- **Button 1 Text**: "Learn More"
- **Button 2 Text**: "Get Tickets"

_Comments on Supabase mapping:_
- 
- 
- 

## 6. Footer Section

### LodgeTix Section
- **Title**: "LodgeTix"
- **Description**: "Official ticketing platform for the Grand Proclamation 2025."
- **Link Text**: "Visit masons.au"

### Event Information Section
- **Title**: "Event Information"
- **Link Texts**:
  - "Grand Installation"
  - "Schedule"
  - "Venue Information"
  - "Accommodation"

### For Attendees Section
- **Title**: "For Attendees"
- **Link Texts**:
  - "Purchase Tickets"
  - "My Tickets"
  - "FAQs"
  - "Contact Us"

### Legal Section
- **Title**: "Legal"
- **Link Texts**:
  - "Terms & Conditions"
  - "Privacy Policy"
  - "Refund Policy"

### Copyright
- **Text**: "© [current year] United Grand Lodge of NSW & ACT. All rights reserved."

_Comments on Supabase mapping:_
- 
- 
- 

## 7. Images

### Hero Section
- Background image: "/placeholder.svg?height=800&width=1600" | public.Events ID: 307c2d85-72d5-48cf-ac94-082ca2a5d23d  and imageURL
- Logo image: "/placeholder.svg?height=120&width=120" public.Events ID: 307c2d85-72d5-48cf-ac94-082ca2a5d23d  and organiser_url

### Event Cards 
- All event cards: "/placeholder.svg?height=200&width=400"

_Comments on Supabase mapping:_
- 
- 
- 