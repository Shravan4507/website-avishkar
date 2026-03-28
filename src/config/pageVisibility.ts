/**
 * Central configuration for page visibility.
 * Set to 'true' to make the page live, or 'false' to show the Coming Soon screen.
 * This file replaces the dynamic Firestore-based settings.
 */
export const PAGE_VISIBILITY = {
  home: true,
  workshops: false,
  competitions: true,
  schedule: false,
  team: true,
  sponsors: false,
  contact: true,
};

export type PageKey = keyof typeof PAGE_VISIBILITY;
