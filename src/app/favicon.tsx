import { ImageResponse } from 'next/og';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const contentType = 'vercel.svg';

export default async function Icon() {
  try {
    // Try to read the actual vercel.svg file
    const logoPath = path.join(process.cwd(), 'public', 'vercel.svg');
    const logoContent = fs.readFileSync(logoPath, 'utf-8');
    
    return new Response(logoContent, {
      headers: {
        'Content-Type': 'vercel.svg',
      },
    });
  } catch (error) {
    // Fallback if file reading fails
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 24,
            background: '#000000',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          D
        </div>
      ),
      {
        width: 32,
        height: 32,
      },
    );
  }
}

