import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ videoId: null });
    }

    // First attempt: try fetching search results via standard fetch endpoint
    const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=all`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 } // cache results for 1 hour
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.items && data.items.length > 0) {
        // Find first video item
        const firstVideo = data.items.find((item: any) => item.type === 'stream');
        if (firstVideo && firstVideo.url) {
          const videoId = firstVideo.url.split('v=')[1];
          if (videoId) {
            return NextResponse.json({ videoId });
          }
        }
      }
    }

    // Fallback: try yt-search dynamically if API fetch failed
    // @ts-ignore
    const ytSearch = (await import('yt-search')).default;
    const r = await ytSearch(q);

    if (r && r.videos && r.videos.length > 0) {
      return NextResponse.json({ videoId: r.videos[0].videoId });
    }

    return NextResponse.json({ videoId: null });
  } catch (error) {
    console.error('YouTube Search API Error:', error);
    return NextResponse.json({ videoId: null }, { status: 200 });
  }
}