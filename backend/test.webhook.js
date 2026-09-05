const axios = require('axios');

const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}/webhook`;

const payload = {
  object: 'page',
  entry: [
    {
      id: '102938475612345',
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          value: {
            created_time: Math.floor(Date.now() / 1000),
            leadgen_id: `leadgen_${Date.now()}`,
            page_id: '109876543210',
            form_id: '456789012345',
          },
          field: 'leadgen',
        },
      ],
    },
  ],
};

async function run() {
  try {
    console.log(`Sending test webhook to ${URL}...`);
    const res = await axios.post(URL, payload);
    console.log(`Response status: ${res.status}`);
    console.log(`Response data: ${res.data}`);
  } catch (err) {
    console.error('Test webhook failed:', err.message);
  }
}

run();
