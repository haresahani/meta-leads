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

//post /webhook - meta webhook event receiver endpoint
//meta calls this when a lead event occurs (e.g via lead ads testing tool)
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    // Iterate over each entry - there may be multiple if batched
    if (body.entry && Array.isArray(body.entry)) {
      body.entry.forEach((entry) => {
        // Iterate over each change in entry
        if (entry.changes && Array.isArray(entry.changes)) {
          entry.changes.forEach((change) => {
            if (change.field === "leadgen") {
              const leadData = change.value;
              console.log("Received Leadgen Event:", leadData);
              console.log(`Lead ID: ${leadData.leadgen_id}`);
              console.log(`Form ID: ${leadData.form_id}`);
              console.log(`Page ID: ${leadData.page_id}`);
              console.log(`Created Time: ${leadData.created_time}`);
            }
          });
        }
      });
    }
    return res.status(200).send("EVENT_RECEIVED");
  } else {
    return res.sendStatus(404);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
