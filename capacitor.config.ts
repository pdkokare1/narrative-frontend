import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.thegamut.app',
  appName: 'The Gamut',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*'] 
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#121212",
      showSpinner: false,
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Default-568h@2x~iphone"
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#121212"
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    }
  }
};

export default config;
