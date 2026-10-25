import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ audioUrl: null });
    }

    // Search iTunes Search API for direct MP3 audio stream previews
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`, {
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const track = data.results[0];
        return NextResponse.json({ 
          audioUrl: track.previewUrl,
          trackName: track.trackName,
          artistName: track.artistName,
          artworkUrl: track.artworkUrl100
        });
      }
    }

    return NextResponse.json({ audioUrl: null });
  } catch (error) {
    console.error('iTunes Search API Error:', error);
    return NextResponse.json({ audioUrl: null }, { status: 200 });
  }
}