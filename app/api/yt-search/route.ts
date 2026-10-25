import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ videoId: null });
    }

    // Public Invidious API instances known for reliable search returns
    const instances = [
      'https://vid.priv.au',
      'https://invidious.privacydev.net',
      'https://inv.nadeko.net'
    ];

    for (const baseUrl of instances) {
      try {
        const res = await fetch(`${baseUrl}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          cache: 'no-store'
        });

        if (res.ok) {
          const results = await res.json();
          
          if (Array.isArray(results) && results.length > 0) {
            // Invidious returns videoId directly in the video search results
            const firstMatch = results.find((item: any) => item.videoId || item.type === 'video');
            const videoId = firstMatch?.videoId || firstMatch?.id;
            
            if (videoId) {
              return NextResponse.json({ videoId });
            }
          }
        }
      } catch (instanceErr) {
        console.warn(`Invidious instance ${baseUrl} failed, trying next...`);
      }
    }

    console.error('All Invidious instances failed for query:', q);
    return NextResponse.json({ videoId: null });
  } catch (error) {
    console.error('YouTube Search API Error:', error);
    return NextResponse.json({ videoId: null }, { status: 200 });
  }
}