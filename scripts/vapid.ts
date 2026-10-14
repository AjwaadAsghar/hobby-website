/** `npm run vapid` - prints a fresh pair of Web Push (VAPID) keys. */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("Add these to .env.local (and to Vercel → Settings → Environment Variables):\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log(`VAPID_SUBJECT="mailto:you@example.com"`);
