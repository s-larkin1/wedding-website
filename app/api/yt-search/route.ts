import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ videoId: null });
    }

    // Dynamically import yt-search inside the try block to prevent top-level crashes
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