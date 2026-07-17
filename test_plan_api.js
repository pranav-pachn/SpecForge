const http = require('http');

const data = JSON.stringify({
  workflowId: 'cmrnmwc250002102djgfcero8',
  specContent: 'Test spec content',
  clarifications: []
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/ai/plan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
