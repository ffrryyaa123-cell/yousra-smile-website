import 'dotenv/config';
import { prepareProductPackage } from './yousraAgent.js';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required. Keep it in environment secrets; never commit it.');
}

const instantPotPilotFacts = `
Product: Instant Pot 4QT Vortex Plus 6-in-1 Mini Air Fryer
Brand: Instant Pot
Capacity: 4 quarts
Functions stated by the supplied product listing: air fry/crisp, broil, roast, dehydrate, bake, reheat
Other supplied fact: 100+ in-app recipes
Finish: stainless steel
Pilot purpose: prepare content for owner review only. Do not publish.
Affiliate URL: intentionally omitted from the pilot fixture; it must be supplied/verified before publication.
`;

const output = await prepareProductPackage(instantPotPilotFacts);
console.log(JSON.stringify(output, null, 2));
