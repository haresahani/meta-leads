# Meta Lead Ads Live Updates in React Native

This project shows how Meta Lead Ad submissions appear live in a React Native mobile app screen in real time, without refreshing or touching the phone.

---

## How It Works

1. A user submits a form on Meta Lead Ads (or using Meta Lead Ads Testing Tool).
2. Meta sends a POST request to our Node.js server (`POST /webhook`).
3. The server gets the lead info and sends it to the React Native mobile app using Socket.io.
4. The mobile app receives the event and updates the list live on the screen.

---

## How to Setup and Run

### 1. Start the Backend Server
Open terminal in the `backend` folder:
```bash
cd backend
npm install
npm start
```
The server will run on `http://localhost:5000`.

### 2. Make Backend Public (Tunnel)
Open another terminal:
```bash
npx localtunnel --port 5000
```
Copy the HTTPS URL generated (e.g. `https://xxx.loca.lt`).

### 3. Connect Meta Developer Webhook
1. Open your Meta Developer App.
2. Go to Webhooks -> Page object.
3. Put Callback URL: `https://xxx.loca.lt/webhook`
4. Put Verify Token: `harekrishna1234`
5. Click Verify and Save.
6. Under Webhook fields, click Subscribe on `leadgen`.

### 4. Run Mobile App
Open another terminal in the `mobile` folder:
```bash
cd mobile
npm install
npm start
```
Scan the QR code in Expo Go app on your phone.

---

## Testing Real-Time Updates

### Method 1: Using Meta Testing Tool
1. Go to Meta Lead Ads Testing Tool (https://developers.facebook.com/tools/lead-ads-testing).
2. Select your Page and Form.
3. Click Delete lead (if lead exists), then click Create lead.
4. The lead will show up on your phone live.

### Method 2: Local Test Script
In backend folder, run:
```bash
npm run test:webhook
```