const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\prana\\.gemini\\antigravity-ide\\brain\\6f06636e-d65b-4432-be6d-7afc7293b588\\.system_generated\\logs\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const parts = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      // Tool responses can be in `tool_responses` array
      if (obj.tool_responses) {
         for (const res of obj.tool_responses) {
            if (res.name === 'default_api:view_file' && res.response && res.response.output && res.response.output.includes('schema.prisma')) {
               parts.push(res.response.output);
            }
         }
      }
      
      // Or in content for type TOOL_RESPONSE
      if (obj.type === 'TOOL_RESPONSE' && obj.content && obj.content.includes('schema.prisma')) {
         parts.push(obj.content);
      }
    } catch (e) {
    }
  }

  let fullSchemaMap = {};

  for (const p of parts) {
     const outputLines = p.split('\n');
     let isCode = false;
     for (const oLine of outputLines) {
        if (oLine.includes('The following code has been modified')) {
           isCode = true;
           continue;
        }
        if (oLine.includes('The above content does NOT show the entire file') || oLine.includes('The above content shows the entire')) {
           isCode = false;
           continue;
        }
        if (isCode) {
           const match = oLine.match(/^(\d+):\s(.*)$/);
           if (match) {
              fullSchemaMap[parseInt(match[1])] = match[2];
           } else {
              const emptyMatch = oLine.match(/^(\d+):$/);
              if (emptyMatch) {
                 fullSchemaMap[parseInt(emptyMatch[1])] = '';
              }
           }
        }
     }
  }
  
  const maxLine = Math.max(...Object.keys(fullSchemaMap).map(Number));
  let fullSchema = '';
  for (let i = 1; i <= maxLine; i++) {
     fullSchema += (fullSchemaMap[i] || '') + '\n';
  }
  
  fs.writeFileSync('schema_recovered.prisma', fullSchema);
  console.log('Recovered lines:', maxLine);
}

processLineByLine();
