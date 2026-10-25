import { NextResponse } from 'next/server';
// @ts-ignore
import ytSearch from 'yt-search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ videoId: null });
  }

  try {
    // yt-search returns an object with a 'videos' array
    const r = await ytSearch(q);
    const videoId = r.videos[0]?.videoId || null;
    
    return NextResponse.json({ videoId });
  } catch (error) {
    console.error('YouTube Search Error:', error);
    return NextResponse.json({ videoId: null });
  }
}