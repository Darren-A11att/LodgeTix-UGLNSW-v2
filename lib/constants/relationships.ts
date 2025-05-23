// Relationship options based on context
export const PARTNER_RELATIONSHIPS = [
  "Wife",
  "Husband", 
  "Partner",
  "Spouse",
  "Fiancée",
  "Fiancé"
] as const;

export const GUEST_RELATIONSHIPS = [
  "Guest Of"
] as const;

export type PartnerRelationship = typeof PARTNER_RELATIONSHIPS[number];
export type GuestRelationship = typeof GUEST_RELATIONSHIPS[number];
export type AllRelationships = PartnerRelationship | GuestRelationship;