export const PWA_ICON_VERSION = '1'

export const PWA_APPLE_TOUCH_ICON = `/icons/apple-touch-icon-180.png?v=${PWA_ICON_VERSION}`

export const PWA_MANIFEST_ICONS = [
  {
    src: `/icons/icon-180.png?v=${PWA_ICON_VERSION}`,
    sizes: '180x180',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: `/icons/icon-192.png?v=${PWA_ICON_VERSION}`,
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: `/icons/icon-512.png?v=${PWA_ICON_VERSION}`,
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: `/icons/icon-512.png?v=${PWA_ICON_VERSION}`,
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
] as const
