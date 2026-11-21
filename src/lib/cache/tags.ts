/** Cache tags shared by public data loaders and CMS revalidation hooks. */
export const CACHE_TAGS = {
  timeline: 'timeline',
  siteSettings: 'site-settings',
  projects: 'projects',
  homePage: 'home-page',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]
