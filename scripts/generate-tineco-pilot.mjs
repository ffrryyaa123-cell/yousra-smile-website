import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import OpenAI, { toFile } from 'openai';

const root = process.cwd();
const inputPath = path.join(root, 'pilot-assets', 'tineco-s6-first-frame.png');
const outputDir = path.join(root, 'pilot-output');
const outputPath = path.join(outputDir, 'tineco-s6-pilot.mp4');
const metadataPath = path.join(outputDir, 'tineco-s6-pilot.json');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is missing from .env.local');
}

fs.mkdirSync(outputDir, { recursive: true });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const prompt = `Create an original premium vertical social-media product demonstration using the provided first frame.

The same fictional woman remains consistent: a friendly poised hijabi woman in her mid-30s with a warm wheat complexion, terracotta hijab, loose sage tunic and wide beige trousers. She is in a bright modern kitchen and naturally pushes the exact white-and-black Tineco FLOOR ONE S6 Stretch Steam floor washer shown in the reference. Keep the product body, handle, floor head, blue illuminated ring, scale and proportions consistent.

Action over 8 seconds: start close enough to clearly see a muddy spill on the tile in front of the floor head. She smoothly pushes the cleaner forward once across the spill. The roller stays in contact with the floor, subtle realistic steam appears, and the dirty tile becomes visibly clean and glossy immediately behind the machine. End on the clean result with the woman smiling naturally and the product clearly visible.

Photorealistic commercial cinematography, one continuous stable camera move, believable hands and walking motion, realistic physics, no morphing, no invented accessories, no scene cuts, no captions, no price, no watermark, no spoken dialogue.`;

console.log('Submitting one 8-second Sora pilot job...');
const reference = await toFile(fs.createReadStream(inputPath), 'tineco-s6-first-frame.png', {
  type: 'image/png',
});

let video = await client.videos.create({
  model: 'sora-2',
  size: '720x1280',
  seconds: '8',
  prompt,
  input_reference: reference,
});

console.log(`Job ${video.id}: ${video.status}`);
while (video.status === 'queued' || video.status === 'in_progress') {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  video = await client.videos.retrieve(video.id);
  console.log(`Progress: ${video.progress}% (${video.status})`);
}

if (video.status !== 'completed') {
  throw new Error(`Video failed: ${video.error?.code ?? 'unknown'} — ${video.error?.message ?? 'No details'}`);
}

const response = await client.videos.downloadContent(video.id, { variant: 'video' });
const bytes = Buffer.from(await response.arrayBuffer());
fs.writeFileSync(outputPath, bytes);
fs.writeFileSync(metadataPath, JSON.stringify({ ...video, prompt }, null, 2));
console.log(`Saved ${outputPath} (${bytes.length} bytes)`);
