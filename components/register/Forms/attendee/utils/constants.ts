// Title Constants
export const MASON_TITLES = ["Bro", "W Bro", "VW Bro", "RW Bro", "MW Bro"] as const;
export const GUEST_TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev", "Prof", "Rabbi", "Hon", "Sir", "Madam", "Lady", "Dame"] as const;

// Rank Constants
export const MASON_RANKS = [
  { value: "EAF", label: "EAF" },
  { value: "FCF", label: "FCF" },
  { value: "MM", label: "MM" },
  { value: "IM", label: "IM" },
  { value: "GL", label: "GL" }
] as const;

// Grand Officer Constants
export const GRAND_OFFICER_STATUS = ["Present", "Past"] as const;

export const GRAND_OFFICER_ROLES = [
  "Grand Master",
  "Deputy Grand Master", 
  "Assistant Grand Master",
  "Grand Secretary",
  "Grand Director of Ceremonies",
  "Other"
] as const;

// Relationship Types
export const PARTNER_RELATIONSHIPS = [
  "Wife",
  "Husband",
  "Partner", 
  "Spouse",
  "Fiancée",
  "Fiancé"
] as const;

// Contact Preferences
export const CONTACT_PREFERENCES = [
  { value: "Directly", label: "Contact me directly" },
  { value: "PrimaryAttendee", label: "Via primary attendee" },
  { value: "ProvideLater", label: "Provide details later" }
] as const;

// Grand Titles (for rank logic)
export const GRAND_TITLES = ["VW Bro", "RW Bro", "MW Bro"] as const;

// Type definitions for constants
export type MasonTitle = typeof MASON_TITLES[number];
export type GuestTitle = typeof GUEST_TITLES[number];
export type MasonRank = typeof MASON_RANKS[number]['value'];
export type GrandOfficerStatus = typeof GRAND_OFFICER_STATUS[number];
export type GrandOfficerRole = typeof GRAND_OFFICER_ROLES[number];
export type PartnerRelationship = typeof PARTNER_RELATIONSHIPS[number];
export type ContactPreference = typeof CONTACT_PREFERENCES[number]['value'];

// Helper functions
export const isGrandTitle = (title: string): boolean => {
  return GRAND_TITLES.includes(title as typeof GRAND_TITLES[number]);
};

// Default values
export const DEFAULT_MASON_TITLE = MASON_TITLES[0];
export const DEFAULT_GUEST_TITLE = GUEST_TITLES[0];
export const DEFAULT_MASON_RANK = MASON_RANKS[0].value;
export const DEFAULT_CONTACT_PREFERENCE = CONTACT_PREFERENCES[0].value;
export const DEFAULT_GRAND_OFFICER_STATUS = GRAND_OFFICER_STATUS[1]; // "Past"

// Field labels
export const FIELD_LABELS = {
  title: "Title",
  firstName: "First Name",
  lastName: "Last Name",
  suffix: "Suffix",
  rank: "Rank",
  grandRank: "Grand Rank",
  grandOfficerStatus: "Grand Officer Status",
  presentGrandOfficerRole: "Present Grand Officer Role",
  otherGrandOfficerRole: "Other Grand Officer Role",
  masonicTitle: "Masonic Title",
  grandLodgeId: "Grand Lodge",
  lodgeId: "Lodge",
  lodgeNameNumber: "Lodge Name & Number",
  contactPreference: "Contact Preference",
  primaryEmail: "Email",
  primaryPhone: "Mobile",
  dietaryRequirements: "Dietary Requirements",
  specialNeeds: "Special Needs",
  relationship: "Relationship"
};