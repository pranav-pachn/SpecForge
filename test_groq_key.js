const https = require('https');
const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/models',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
};
const req = https.request(options, res => {
  console.log(res.statusCode);
});
req.end();
