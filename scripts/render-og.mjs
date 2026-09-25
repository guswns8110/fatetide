// Renders scripts/assets/og-default.svg to public/og-default.jpg (1200 x 630) using a browser canvas,
// so no image libraries are needed. Usage: node scripts/render-og.mjs, then open the printed URL in
// any Chromium-based browser. The page renders the SVG and posts the JPEG back to this script.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const svgPath = resolve('scripts/assets/og-default.svg');
const outPath = resolve('public/og-default.jpg');
const port = Number(process.env.PORT) || 4555;

const page = `<!doctype html><meta charset="utf-8"><title>Render OG image</title>
<body style="font-family:sans-serif;background:#111;color:#eee"><p id="status">Rendering...</p><canvas id="c" width="1200" height="630" style="max-width:100%"></canvas>
<script>
const img = new Image();
img.onload = async () => {
  await document.fonts.ready;
  const canvas = document.getElementById('c');
  canvas.getContext('2d').drawImage(img, 0, 0, 1200, 630);
  const jpeg = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  const res = await fetch('/save', { method: 'POST', body: jpeg });
  document.getElementById('status').textContent = res.ok ? 'Saved public/og-default.jpg' : 'Save failed';
};
img.src = '/og.svg';
</script>`;

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(page); return; }
  if (req.method === 'GET' && req.url === '/og.svg') { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(readFileSync(svgPath)); return; }
  if (req.method === 'POST' && req.url === '/save') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const image = Buffer.from(Buffer.concat(chunks).toString('utf8'), 'base64');
      const signature = image.subarray(0, 3).toString('hex');
      if (signature !== 'ffd8ff') { res.writeHead(400); res.end('not a jpeg'); return; }
      writeFileSync(outPath, image);
      console.log(`Wrote ${outPath} (${image.length} bytes)`);
      res.writeHead(200); res.end('ok');
      setTimeout(() => server.close(), 200);
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(port, () => console.log(`Open http://localhost:${port}/`));
