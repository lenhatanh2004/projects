import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';
// this is where you customize your design system
export const config = createTamagui({
  // tokens work like CSS Variables (and compile to them on the web)
  // accessible from anywhere, never changing dynamically:

  tokens: {
    ...defaultConfig.tokens,
    // width="$sm"
    size: {
      ...defaultConfig.tokens.size,
      sm: 8,
      md: 12,
      true: 12,
      lg: 20
    },
    // margin="$sm"
    space: {
      ...defaultConfig.tokens.space,
      sm: 4,
      md: 8,
      true: 8,
      lg: 12
    },
    // radius="$none"
    radius: {
      ...defaultConfig.tokens.radius,
      none: 0,
      sm: 3,
      true: 3,
      md: 6,
      lg: 12,
      pill: 9999,
      circular: 9999
    },
    color: {
      white: '#fff',
      black: '#000'
    },
    zIndex: {
      ...defaultConfig.tokens.zIndex,
      sm: 1,
      md: 5,
      lg: 10
    }
  },

  themes: {
    light: {
      ...defaultConfig.themes.light,
      primary: '#5985d8', // text active, button active, main color
      secondary: '#666666', // text unactive, placeholder
      background: '#ffffff' // nền chính
    },
    dark: {
      ...defaultConfig.themes.dark,
      primary: '#5985d8', // text active, button active, main color
      secondary: '#ffffff', // text unactive, placeholder
      background: '#000' // nền chính
    }
  },

  // media query definitions can be used as style props or with the useMedia hook
  // but also are added to "group styles", which work like Container Queries from CSS
  media: {
    sm: { maxWidth: 860 },
    gtSm: { minWidth: 860 + 1 },
    short: { maxHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' }
  },

  shorthands: {
    // <View px={20} />
    px: 'paddingHorizontal'
  },

  // there are more settings, explained below:
  settings: {
    disableSSR: true,
    allowedStyleValues: 'somewhat-strict-web'
  }
});

// now, make your types flow nicely back to your `tamagui` import:
type OurConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends OurConfig {}
}
