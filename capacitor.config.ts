import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.narrative.app',
  appName: 'Narrative',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#09090b", // Matches your Zinc-950 background
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      overlay: false,
    }
  }
};

export default config;
