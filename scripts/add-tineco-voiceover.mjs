import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is missing from .env.local');
}

const outputDir = path.join(process.cwd(), 'pilot-output');
fs.mkdirSync(outputDir, { recursive: true });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const speech = await client.audio.speech.create({
  model: 'gpt-4o-mini-tts',
  voice: 'coral',
  input: 'Meet the Tineco FLOOR ONE S6 Stretch Steam. Vacuum, mop, and steam stubborn messes in one smooth pass.',
  instructions: 'Warm, polished female product-presenter voice. Natural global English. Confident and friendly. Finish within eight seconds.',
  response_format: 'mp3',
});

const bytes = Buffer.from(await speech.arrayBuffer());
fs.writeFileSync(path.join(outputDir, 'tineco-s6-voiceover.mp3'), bytes);
console.log(`Saved voiceover (${bytes.length} bytes)`);
