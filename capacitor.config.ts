import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aicohost.app',
  appName: 'AI Co-Host',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://ai-cohost-project-oi24oh2k2-ai-cohost.vercel.app',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
