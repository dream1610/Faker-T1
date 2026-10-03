const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG generator using Node.js built-in zlib
function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4; // RGBA
  const rowBytes = width * bytesPerPixel;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6 (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 table & calculation
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function drawSnakeIcon(x, y, w, h) {
  // Dark zinc background (#09090b)
  let r = 9, g = 9, b = 11, a = 255;

  // Normalized coordinates (0 to 1)
  const nx = x / w;
  const ny = y / h;

  // Border frame
  if (nx >= 0.08 && nx <= 0.92 && ny >= 0.08 && ny <= 0.92) {
    r = 24; g = 24; b = 27; // #18181b
  }

  // Red apple (around 0.75, 0.28)
  const dxApple = nx - 0.75;
  const dyApple = ny - 0.28;
  if (dxApple * dxApple + dyApple * dyApple < 0.007) {
    r = 244; g = 63; b = 94; // red
    return [r, g, b, a];
  }

  // Snake body (emerald green segments)
  // Segment 1 (tail): (0.25, 0.7)
  // Segment 2: (0.38, 0.7)
  // Segment 3: (0.38, 0.55)
  // Segment 4: (0.52, 0.55)
  // Segment 5: (0.52, 0.4)
  // Head: (0.65, 0.4)
  const segments = [
    [0.25, 0.70, 0.11, 0.11, [16, 185, 129]],
    [0.38, 0.70, 0.11, 0.11, [16, 185, 129]],
    [0.38, 0.55, 0.11, 0.11, [16, 185, 129]],
    [0.52, 0.55, 0.11, 0.11, [52, 211, 153]],
    [0.52, 0.40, 0.11, 0.11, [52, 211, 153]],
    [0.65, 0.35, 0.14, 0.14, [5, 150, 105]] // Head
  ];

  for (const [sx, sy, sw, sh, col] of segments) {
    if (Math.abs(nx - sx) < sw / 2 && Math.abs(ny - sy) < sh / 2) {
      // Head eye detail
      if (sx === 0.65) {
        if ((Math.abs(nx - 0.62) < 0.015 || Math.abs(nx - 0.68) < 0.015) && Math.abs(ny - 0.33) < 0.015) {
          return [0, 0, 0, 255]; // eye
        }
      }
      return [...col, 255];
    }
  }

  return [r, g, b, a];
}

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createPNG(192, 192, drawSnakeIcon));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createPNG(512, 512, drawSnakeIcon));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), createPNG(512, 512, drawSnakeIcon));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPNG(180, 180, drawSnakeIcon));
console.log('Icons generated successfully in public/icons');
