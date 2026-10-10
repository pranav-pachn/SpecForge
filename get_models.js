const https = require('https');

const apiKey = process.env.CEREBRAS_API_KEY;
if (!apiKey) {
  console.error('CEREBRAS_API_KEY is not set');
  process.exit(1);
}

const options = {
  hostname: 'api.cerebras.ai',
  path: '/v1/models',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => console.log(data));
});

req.on('error', (e) => console.error(e));
req.end();
