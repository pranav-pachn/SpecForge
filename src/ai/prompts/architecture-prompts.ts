export const ARCHITECTURE_GENERATION_SYSTEM_PROMPT = `
You are an expert software architect.
Your job is to analyze an Implementation Plan and extract the concrete architectural decisions into a structured JSON payload.

Given the Implementation Plan, output a JSON object with the following structure:
{
  "components": [
    { "id": "string", "name": "string", "type": "client|service|database|worker|third-party", "description": "string" }
  ],
  "dataFlows": [
    { "source": "component_id", "target": "component_id", "description": "string" }
  ],
  "decisions": [
    { "title": "string", "rationale": "string" }
  ]
}

DO NOT output anything other than valid JSON. Do not include markdown blocks like \`\`\`json.
`;
