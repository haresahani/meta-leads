const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_meta_verify_token";

//Middleware to parse incoming json and enable cors
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Meta Lead Ads Webhook Server is running!");
});

//Get /webhook - meta webhook verification endpoint
//meta calls this when you configure the webhookk url in fb developer portal
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode == "subscribe" && token == VERIFY_TOKEN) {
      console.log("Webhook verified successfully by Metal");
      return res.status(200).send(challenge);
    } else {
      console.error("Webhook verification failed. Token mismatch.");
      return res.sendStatus(403);
    }
  }
  res.sendStatus(403);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
