import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// Read only the existing PUBLIC configuration. Never print credentials.
const source = readFileSync(new URL('../src/services/adminAccount.ts', import.meta.url), 'utf8');
const url = source.match(/const SUPABASE_URL = '([^']+)'/)[1];
const key = source.match(/const SUPABASE_PUBLISHABLE_KEY = '([^']+)'/)[1];
const topic = `review-presence-test-${crypto.randomUUID()}`;
const clients = [0, 1].map(() => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }));
const channels = clients.map(client => client.channel(topic));
const waitFor = async predicate => {
  const deadline = Date.now() + 15000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('Presence synchronization timed out');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
const count = channel => Object.values(channel.presenceState()).reduce((sum, entries) => sum + entries.length, 0);
try {
  for (const [index, channel] of channels.entries()) {
    channel.on('presence', { event: 'sync' }, () => {});
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscribe timed out')), 15000);
      channel.subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          try {
            assert.equal(await channel.track({ connected: true }), 'ok');
            clearTimeout(timeout); resolve();
          } catch (error) { clearTimeout(timeout); reject(error); }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout); reject(new Error('Presence unavailable'));
        }
      });
    });
    await waitFor(() => count(channels[0]) === index + 1);
    console.log(`PASS: ${index + 1} connected test tab(s)`);
  }
  await clients[1].removeChannel(channels[1]);
  await waitFor(() => count(channels[0]) === 1);
  console.log('PASS: leaving tab removed from count');
} finally {
  await Promise.all(clients.map(client => client.removeAllChannels()));
}
