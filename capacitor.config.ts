import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.thegamut.app',
  appName: 'The Gamut',
  webDir: 'build',
  // FIX 1: We REMOVED the "server" block so it loads your local code, not the live site.
  // server: { ... }  <-- Deleted this

  plugins: {
    // FIX 2: Added the missing Google setup
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "phone"]
    },
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
