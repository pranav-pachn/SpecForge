const https = require('https');
const data = JSON.stringify({
  model: 'llama-3.1-8b-instant',
  messages: [{role: 'user', content: 'test'}]
});
const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body.substring(0, 100)));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
