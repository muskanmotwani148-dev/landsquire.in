# LandSquire v26 web demo

Website assets extracted without redesign from the supplied LandSquire-v26 (1).apk.

## Vercel
Import this repository. Framework preset: Other. No build command. Output directory: . (repository root).

The APK Android wrapper is not needed for web hosting. Google Maps needs its browser key authorized for the deployed hostname. Demo accounts and inventory are not production authentication or live inventory.

Set GOOGLE_MAPS_API_KEY in Vercel environment variables. The browser key was removed from the extracted APK before upload. Restrict this key to your Vercel hostname in Google Cloud. Build command: node build.cjs.
