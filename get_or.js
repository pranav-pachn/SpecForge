const https = require('https');

const options = {
  hostname: 'openrouter.ai',
  path: '/api/v1/models',
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const freeModels = parsed.data.filter(m => m.id.endsWith(':free'));
      console.log("Free models:", freeModels.map(m => m.id).join(", "));
    } catch (e) {
      console.error(e);
    }
  });
});

req.end();
