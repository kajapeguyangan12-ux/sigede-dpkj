import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const contentType = 'image/svg+xml';

export default async function Icon() {
  try {
    // Try to read the actual vercel.svg file
    const logoPath = path.join(process.cwd(), 'public', 'vercel.svg');
    const logoContent = fs.readFileSync(logoPath, 'utf-8');
    
    return new Response(logoContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch (error) {
    // Return empty response if file not found
    return new Response('', {
      status: 404,
    });
  }
}
