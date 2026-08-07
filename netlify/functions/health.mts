import type { Config } from '@netlify/functions';

export default async () => {
  return Response.json({
    status: 'ok',
    service: 'yousra-smile',
    time: new Date().toISOString(),
  });
};

export const config: Config = {
  path: '/api/health',
};
