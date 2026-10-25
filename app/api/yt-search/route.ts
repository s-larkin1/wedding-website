import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ videoId: null });
    }

    // Try multiple public Piped API instances in case one is rate-limited or down
    const instances = [
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.privacy.com.de',
      'https://api.piped.projectsegfau.lt'
    ];

    for (const baseUrl of instances) {
      try {
        const res = await fetch(`${baseUrl}/search?q=${encodeURIComponent(q)}&filter=videos`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          
          if (Array.isArray(items) && items.length > 0) {
            // Look for any item with a video ID or stream URL
            for (const item of items) {
              if (item.videoId) {
                return NextResponse.json({ videoId: item.videoId });
              }
              if (item.url && item.url.includes('v=')) {
                const videoId = item.url.split('v=')[1]?.split('&')[0];
                if (videoId) {
                  return NextResponse.json({ videoId });
                }
              }
            }
          }
        }
      } catch (instanceErr) {
        console.warn(`Instance ${baseUrl} failed, trying next...`);
      }
    }

    console.error('All Piped instances failed for query:', q);
    return NextResponse.json({ videoId: null });
  } catch (error) {
    console.error('YouTube Search API Error:', error);
    return NextResponse.json({ videoId: null }, { status: 200 });
  }
}