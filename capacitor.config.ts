import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize } from '@capacitor/keyboard'

/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor/status-bar" />
const config: CapacitorConfig = {
  appId: 'com.jersnet.reskyow',
  appName: 'Reskyow',
  webDir: 'build/client',
  server: {
    allowNavigation: ['*'],
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidSplashResourceName: 'splash',
      backgroundColor: '#ffffff',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
}

export default config
