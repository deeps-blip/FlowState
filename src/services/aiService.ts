import { GoogleGenAI } from '@google/genai';
import { NODE_REGISTRY } from '../features/workflow/nodes/NodeRegistry';
import type { WorkflowDefinition } from '../types';

const API_KEY = process.env.GEMINI_API_KEY || '';
const client = new GoogleGenAI({
  apiKey: API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert Workflow Designer assistant for the "FlowState" platform.
Your goal is to generate a valid JSON "WorkflowDefinition" based on a user's natural language description.

### Platform Specifications:
- **Nodes**: Each node must have a unique 'id', a 'type' (NodeKind), 'position' ({x, y}), and 'data'.
- **NodeKinds**: 'start', 'webhook', 'task', 'approval', 'automation', 'switch', 'end'.
- **NodeData**: Must include 'title', 'description', 'type' (same as NodeKind), and 'config' (Record<string, unknown>).
- **Edges**: Each edge must have 'id', 'source' (node id), 'target' (node id), 'type': 'labeled', 'animated': true, and 'data': { 'label': string }.

### Node Types Details:
${JSON.stringify(NODE_REGISTRY, null, 2)}

### Output Requirements:
- Respond ONLY with a valid JSON object matching the WorkflowDefinition interface.
- Do NOT include any markdown formatting, preamble, or explanation.
- Ensure the workflow is logical: start with a 'start' or 'webhook', and reach an 'end'.
- Layout nodes in a readable way (increment X and Y positions).
- For 'switch' nodes, ensure edges have labels matching the condition branches.

### Example JSON Structure:
{
  "name": "Onboarding Flow",
  "nodes": [
    { "id": "start-1", "type": "start", "position": { "x": 100, "y": 100 }, "data": { "title": "Hire Event", "description": "New hire triggered", "type": "start", "config": { "event": "hire" } } },
    { "id": "end-1", "type": "end", "position": { "x": 500, "y": 100 }, "data": { "title": "Finish", "description": "Flow complete", "type": "end", "config": { "outcome": "success" } } }
  ],
  "edges": [
    { "id": "e1-2", "source": "start-1", "target": "end-1", "type": "labeled", "animated": true, "data": { "label": "Proceed" } }
  ]
}
`;

export async function generateWorkflow(prompt: string): Promise<WorkflowDefinition> {
  if (!API_KEY || API_KEY === 'MY_GEMINI_API_KEY') {
    throw new Error('Gemini API Key is not configured. Please add it to your .env file.');
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT + `\n\nUser Request: ${prompt}` }] }
      ]
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential markdown blocks if Gemini ignored the "ONLY JSON" instruction
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as WorkflowDefinition;
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    if (err.message?.includes('401')) {
      throw new Error('Invalid Gemini API Key. Please check your .env file.');
    }
    throw new Error('Gemini failed to generate a workflow. Please try again with a clearer prompt.');
  }
}
