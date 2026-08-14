const fs = require('fs');

const logPath = 'C:\\Users\\prana\\.gemini\\antigravity-ide\\brain\\6f06636e-d65b-4432-be6d-7afc7293b588\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

let fullSchema = '';

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'TOOL_RESPONSE' && obj.content && obj.content.includes('schema.prisma')) {
      if (obj.content.includes('Total Lines: 1845')) {
         const outputLines = obj.content.split('\n');
         let isCode = false;
         for (const oLine of outputLines) {
            if (oLine.includes('The following code has been modified')) {
               isCode = true;
               continue;
            }
            if (oLine.includes('The above content does NOT show the entire file')) {
               isCode = false;
               continue;
            }
            if (oLine.includes('The above content shows the entire')) {
               isCode = false;
               continue;
            }
            if (isCode) {
               const match = oLine.match(/^\d+:\s(.*)$/);
               if (match) {
                  fullSchema += match[1] + '\n';
               } else if (oLine.match(/^\d+:$/) || oLine.trim() === '') {
                  fullSchema += '\n';
               }
            }
         }
      }
    }
  } catch (e) {
  }
}

fs.writeFileSync('prisma/schema.prisma', fullSchema);
console.log('Recovered lines: ' + fullSchema.split('\n').length);
