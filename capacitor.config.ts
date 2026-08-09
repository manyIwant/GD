import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miaoda.gaode.interstellar',
  appName: '高德星际·星际客运',
  webDir: 'dist',
  backgroundColor: '#020202',
  android: {
    allowMixedContent: false,
    backgroundColor: '#020202',
  },
  ios: {
    backgroundColor: '#020202',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#020202',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020202',
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
