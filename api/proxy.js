const https = require('https');

const UAZAPI_HOST = 'nxsolutions.uazapi.com';
const TOKEN = process.env.UAZAPI_TOKEN || 'py6tuBfTPmkAf01Ce8AiI2hNn13G7VnTngsiu3l5sigiK74ZB8';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extrai o caminho da API a partir de ?path=/instance/status
  const apiPath = req.query.path || '/instance/status';
  const method = req.method === 'POST' ? 'POST' : 'GET';

  return new Promise((resolve) => {
    let body = '';
    if (req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const options = {
      hostname: UAZAPI_HOST,
      path: apiPath,
      method,
      headers: {
        'token': TOKEN,
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => data += chunk);
      proxyRes.on('end', () => {
        try {
          res.status(proxyRes.statusCode).json(JSON.parse(data));
        } catch {
          res.status(proxyRes.statusCode).send(data);
        }
        resolve();
      });
    });

    proxyReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
}
