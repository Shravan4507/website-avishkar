/**
 * Central configuration for page visibility.
 * Set to 'true' to make the page live, or 'false' to show the Coming Soon screen.
 * This file replaces the dynamic Firestore-based settings.
 */
export const PAGE_VISIBILITY = {
  home: true,
  workshops: true,
  competitions: true,
  schedule: true,
  team: true,
  sponsors: false,
  contact: true,
};

export type PageKey = keyof typeof PAGE_VISIBILITY;
