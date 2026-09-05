# Project Assumptions

Here are the practical assumptions made while building this project for the assignment:

1. Webhook Testing Tool
We used Meta's Lead Ads Testing Tool and a local test script (`npm run test:webhook`) to simulate lead submissions. This allows us to test the webhook and app without running real paid ads on Facebook.

2. Using WebSockets (Socket.io) instead of Push Notifications
We chose Socket.io instead of push notifications (FCM) because the requirement is to update the screen live while the app is open without touching the phone. Socket.io is simple to set up, works instantly, and is easy to explain during a viva.

3. Using Tunneling (Cloudflare / Ngrok)
Meta requires a public HTTPS Webhook URL. Since the server runs locally on port 5000, we used a tunnel tool to give Meta a public HTTPS link that forwards requests to our local server.

4. Storing Leads in Memory
For this Proof of Concept, leads are stored in a basic JavaScript array in memory (`server.js`). This is enough to show real-time updates and load previous leads when the app opens.

5. Sample Test Lead Data
If Meta Graph API token is not set, the server automatically generates demo lead, emails, and phone numbers for offline testing.
