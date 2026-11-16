import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://obnoczzswjtzqnkkrioa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibm9jenpzd2p0enFua2tyaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTY4NjcsImV4cCI6MjEwMjczMjg2N30.L7zlOp0jkOqGYTHb_c8P_AvGO6B0H5pr6AVHwDHTYvc'
);

export async function GET() {
  try {
    // Perform a tiny read query to register database activity
    const { data, error } = await supabase
      .from('song_requests')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      checked: data 
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}