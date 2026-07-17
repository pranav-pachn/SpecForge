const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');

async function generatePlan(specContent) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Staff Software Engineer creating an Implementation Plan for a web application feature. You must output the response in Markdown format, separated by components.'
        },
        {
          role: 'user',
          content: 'Please generate an Implementation Plan for the following specification:\n\n### Specification\n' + specContent
        }
      ]
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'YOUR_API_KEY'}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result.choices[0].message.content);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const workflowId = 'cmrnmwc250002102djgfcero8';
  
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { artifacts: { include: { versions: { orderBy: { version: 'desc' } } } } }
  });
  
  const spec = workflow.artifacts.find(a => a.type === 'SPEC');
  const plan = workflow.artifacts.find(a => a.type === 'PLAN');
  
  if (spec && plan) {
    console.log('Generating real plan using Groq...');
    const planText = await generatePlan(spec.versions[0].content);
    
    await prisma.artifactVersion.update({
      where: { id: plan.versions[0].id },
      data: { content: planText }
    });
    console.log('Successfully saved real generated plan to database!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
