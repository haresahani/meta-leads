const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_meta_verify_token";

const leads = []; //inmemory array of received leads

//Middleware to parse incoming json and enable cors
app.use(cors());
app.use(express.json());

//socket.io connection handler
io.on("connection", (socket) => {
  console.log(`client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

/**
 * Fetch full lead details (name, email, phone) using Facebook Graph API
 * if META_ACCESS_TOKEN is present, or auto-generate readable mock test lead data for offline testing.
 * @param {string} leadId
 * @returns {Promise<Object>} Lead details object containing name, email, phone, etc.
 */

async function fetchLeadDetails(leadId) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (accessToken) {
    try {
      console.log(
        `Fetching full lead details from Meta Graph API for lead ID: ${leadId}...`,
      );
      const response = await axios.get(
        `https://graph.facebook.com/v19.0/${leadId}`,
        {
          params: { access_token: accessToken },
        },
      );

      const data = response.data;
      const fieldData = data.field_data || [];

      let name = "N/A";
      let email = "N/A";
      let phone = "N/A";

      fieldData.forEach((field) => {
        const key = (field.name || "").toLowerCase();
        const value = Array.isArray(field.values)
          ? field.values[0]
          : field.values;
        if (key.includes("name") || key === "full_name") {
          name = value;
        } else if (key.includes("email")) {
          email = value;
        } else if (key.includes("phone")) {
          phone = value;
        }
      });

      return {
        id: leadId,
        name,
        email,
        phone,
        created_time: data.created_time || new Date().toISOString(),
        isMock: false,
      };
    } catch (error) {
      console.error(
        "Failed to fetch lead details from Graph API:",
        error.response?.data || error.message,
      );
      console.log("Falling back to development mock lead data generator.");
    }
  } else {
    console.log(
      "No META_ACCESS_TOKEN configured. Using development mock lead data fallback.",
    );
  }

  // Readable mock lead generator fallback for offline / development testing
  const mockNames = [
    "Alex Johnson",
    "Sarah Connor",
    "Michael Scott",
    "Emma Watson",
    "David Miller",
  ];
  const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
  const sanitizedName = randomName.toLowerCase().replace(/\s+/g, ".");
  const randomId = Math.floor(1000 + Math.random() * 9000);

  return {
    id: leadId || `mock_${Date.now()}`,
    name: randomName,
    email: `${sanitizedName}${randomId}@example.com`,
    phone: `+1 (555) 019-${randomId}`,
    created_time: new Date().toISOString(),
    isMock: true,
  };
}

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
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === "leadgen") {
              const leadData = change.value;
              // console.log("Received Leadgen Event:", leadData);
              console.log("\n--- Received Leadgen Event ---");
              console.log(`Lead ID: ${leadData.leadgen_id}`);
              console.log(`Form ID: ${leadData.form_id}`);
              console.log(`Page ID: ${leadData.page_id}`);
              console.log(`Created Time: ${leadData.created_time}`);

              //fetch lead details using graph api or dev fallback
              const details = await fetchLeadDetails(leadData.leadgen_id);
              // console.log("Lead Details:", details);
              const fullLead = {
                ...details,
                form_id: leadData.form_id,
                page_id: leadData.page_id,
              };

              //Store in memory
              leads.unshift(fullLead);

              //broadcast real-time event to connected clients
              io.emit("new_lead", fullLead);

              console.log("Lead Details:", fullLead);
              console.log("---------------\n");
            }
          }
        }
      }
    }
    return res.status(200).send("EVENT_RECEIVED");
  } else {
    return res.sendStatus(404);
  }
});

//fetcch list of all received leads stored in memory
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

//endpoint to manually trigger/simulate a new lead for for testing purposes
app.post("/api/test-lead", async (req, res) => {
  try {
    let newLead;
    if (req.body && (req.body.name || req.body.email || req.body.phone)) {
      newLead = {
        id: req.body.id || `test_${Date.now()}`,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        created_time: req.body.created_time || new Date().toISOString(),
        form_id: req.body.form_id || "test_form_id",
        page_id: req.body.page_id || "test_page_id",
        isMock: true,
      };
    } else {
      const details = await fetchLeadDetails(`test_${Date.now()}`);
      newLead = {
        ...details,
        form_id: "test_form_id",
        page_id: "test_page_id",
      };
    }

    leads.unshift(newLead);
    io.emit("new_lead", newLead);

    console.log("Test lead created and broadcasted:", newLead);
    res.status(201).json(newLead);
  } catch (error) {
    console.error("Error creating test lead:", error);
    res.status(500).json({ error: "Failed to create test lead" });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
