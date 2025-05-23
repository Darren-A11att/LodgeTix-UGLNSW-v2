// Consolidated title list from all forms (Mason, Guest, LadyPartner, GuestPartner)
export const GUEST_TITLES = [
  "Mr",
  "Mrs", 
  "Ms",
  "Miss",
  "Dr",
  "Rev",
  "Prof",
  "Rabbi",
  "Hon",
  "Sir",
  "Madam",
  "Lady",
  "Dame"
] as const;

export type GuestTitle = typeof GUEST_TITLES[number];