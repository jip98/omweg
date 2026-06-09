import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'nl.jipdegroot.omweg',
  appName: 'Omweg',
  webDir: 'out',
  ios: {
    contentInset: 'always',
  },
  server: {
    // Schoon laden vanaf de gebundelde static export
    androidScheme: 'https',
    iosScheme: 'https',
  },
}

export default config
