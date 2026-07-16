const https = require('https');

const options = {
  hostname: 'api.cerebras.ai',
  path: '/v1/models',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer csk-dhp439ctj35cv4459j3khvr9dpxf3ffj4emhkvjre92wy96v'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

req.on('error', e => console.error(e));
req.end();
