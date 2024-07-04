import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import fetch from 'node-fetch';
import sharp from 'sharp';

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || '';
  const title = searchParams.get('title') || '';
  const subtitle = searchParams.get('subtitle') || '';
  const content = searchParams.get('content') || '';

  // Load the image once
  const imageBuffer = await fetch(url)
    .then((res) => res.arrayBuffer())
    .then((arrayBuffer) => Buffer.from(arrayBuffer));

  // Function to create a frame
  const createFrame = async (
    frameTitle: string,
    frameSubtitle: string,
  ): Promise<Uint8ClampedArray> => {
    const svgBuffer = Buffer.from(
      `<svg width="600" height="630">
         <rect x="0" y="0" width="600" height="630" fill="#fff" />
         <text x="50%" y="200" font-size="32" fill="#000" text-anchor="middle" font-family="Arial">${frameTitle}</text>
         <text x="50%" y="250" font-size="24" fill="#000" text-anchor="middle" font-family="Arial">${frameSubtitle}</text>
         <text x="50%" y="300" font-size="28" fill="#000" text-anchor="middle" font-family="Arial">${content}</text>
       </svg>`,
    );

    const frameBuffer = await sharp(imageBuffer)
      .resize(600, 630)
      .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 600,
        background: '#fff',
      })
      .composite([{ input: svgBuffer, gravity: 'east' }])
      .raw()
      .ensureAlpha()
      .toBuffer();

    return new Uint8ClampedArray(frameBuffer);
  };

  // Create frames
  const frame1 = await createFrame(title, subtitle);
  const frame2 = await createFrame(subtitle, title);

  // Generate palettes and apply them
  const palette1 = quantize(frame1, 256);
  const index1 = applyPalette(frame1, palette1);
  const palette2 = quantize(frame2, 256);
  const index2 = applyPalette(frame2, palette2);

  // Initialize GIF encoder
  const encoder = GIFEncoder();
  encoder.writeFrame(index1, 1200, 630, { palette: palette1, delay: 5000 });
  encoder.writeFrame(index2, 1200, 630, { palette: palette2, delay: 5000 });
  encoder.finish();

  // Get the Uint8ClampedArray output of the binary GIF file
  const gifBuffer = Buffer.from(encoder.bytes());

  return new Response(gifBuffer, {
    headers: { 'Content-Type': 'image/gif' },
  });
}
