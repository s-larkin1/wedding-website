'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://obnoczzswjtzqnkkrioa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibm9jenpzd2p0enFua2tyaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTY4NjcsImV4cCI6MjEwMjczMjg2N30.L7zlOp0jkOqGYTHb_c8P_AvGO6B0H5pr6AVHwDHTYvc'
);

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function WeddingApp() {
  const [hasRSVPd, setHasRSVPd] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('yes');
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Song Request & Audio Player State
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [requestedSongs, setRequestedSongs] = useState<any[]>([]);
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Shuffle Mode State
  const [isShuffle, setIsShuffle] = useState(true);

  // Admin Dashboard State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [rsvpsList, setRsvpsList] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<'rsvps' | 'songs'>('rsvps');

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Info Section Tab State ('travel' | 'activities' | 'faq' | 'map')
  const [activeGuideTab, setActiveGuideTab] = useState<'travel' | 'activities' | 'faq' | 'map'>('travel');

  // YouTube API Player References
  const playerRef = useRef<any>(null);
  const [ytApiReady, setYtApiReady] = useState(false);

  // Refs for auto-play sequence state management
  const requestedSongsRef = useRef<any[]>([]);
  const currentSongRef = useRef<any | null>(null);
  const isShuffleRef = useRef<boolean>(true);

  useEffect(() => {
    requestedSongsRef.current = requestedSongs;
  }, [requestedSongs]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  // Background Slideshow State
  const slideshowImages = [
    '/saolaurenco.jpg',
    '/photo1.jpg',
    '/photo2.jpg',
    '/photo3.jpg',
    '/photo4.jpg',
    '/photo5.jpg',
    '/photo6.jpg',
    '/photo7.jpg',
    '/photo8.jpg',
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Countdown Timer Effect (Target: Aug 4, 2027 18:00 Azores Time / UTC-0)
  useEffect(() => {
    const targetDate = new Date('2027-08-04T18:00:00Z').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load YouTube IFrame API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setYtApiReady(true);
      };
    } else {
      setYtApiReady(true);
    }
  }, []);

  // Play Next Song when current track ends
  const handleSongEnded = () => {
    const songs = requestedSongsRef.current;
    const activeTrack = currentSongRef.current;
    const shuffleMode = isShuffleRef.current;

    if (!songs.length || !activeTrack) return;

    if (shuffleMode && songs.length > 1) {
      const availableSongs = songs.filter((s) => s.id !== activeTrack.id);
      const randomIndex = Math.floor(Math.random() * availableSongs.length);
      setCurrentSong(availableSongs[randomIndex]);
    } else {
      const currentIndex = songs.findIndex((s) => s.id === activeTrack.id);
      if (currentIndex !== -1 && currentIndex + 1 < songs.length) {
        setCurrentSong(songs[currentIndex + 1]);
      } else if (songs.length > 0) {
        setCurrentSong(songs[0]);
      }
    }
  };

  // Initialize YT Player once API is ready
  useEffect(() => {
    if (ytApiReady && !playerRef.current) {
      playerRef.current = new window.YT.Player('audio-engine-frame', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          mute: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.mute();
            event.target.setVolume(30);
          },
          onStateChange: (event: any) => {
            if (event.data === 0) {
              handleSongEnded();
            }
          },
        },
      });
    }
  }, [ytApiReady]);

  // Handle Background Slideshow
  useEffect(() => {
    if (hasRSVPd) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [hasRSVPd, slideshowImages.length]);

  // Fetch YouTube Video ID dynamically and load into player seamlessly
  const playSongAudio = async (song: any) => {
    if (!song) return;
    try {
      if (playerRef.current?.mute) {
        playerRef.current.mute();
      }

      const query = `${song.song_title} ${song.artist}`;
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.videoId && playerRef.current?.loadVideoById) {
        playerRef.current.loadVideoById(data.videoId);
        playerRef.current.setVolume(30);

        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.setVolume(30);
            playerRef.current.unMute();
          }
        }, 300);

        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Failed to load audio track:', err);
    }
  };

  useEffect(() => {
    if (currentSong && ytApiReady) {
      playSongAudio(currentSong);
    }
  }, [currentSong, ytApiReady]);

  // Fetch song requests from Supabase with random initial track selection
  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('song_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching songs:', error);
      } else if (data && data.length > 0) {
        setRequestedSongs(data);
        
        if (!currentSong) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setCurrentSong(data[randomIndex]);
        }
      } else {
        setRequestedSongs([]);
        setCurrentSong(null);
      }
    } catch (err) {
      console.error('Fetch exception:', err);
    }
  };

  // Fetch RSVPs for Admin Panel
  const fetchRSVPs = async () => {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching RSVPs:', error);
      } else if (data) {
        setRsvpsList(data);
      }
    } catch (err) {
      console.error('Fetch RSVPs Exception:', err);
    }
  };

  useEffect(() => {
    if (hasRSVPd) {
      fetchSongs();
    }
  }, [hasRSVPd]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchRSVPs();
      fetchSongs();
    }
  }, [isAdminAuthenticated]);

  // Admin Auth Handler
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'molly') {
      setIsAdminAuthenticated(true);
      setAdminPasswordInput('');
    } else {
      alert('Incorrect Password');
      setAdminPasswordInput('');
    }
  };

  // Delete RSVP Handler
  const handleDeleteRSVP = async (id: number) => {
    if (!confirm('Are you sure you want to delete this RSVP?')) return;
    
    try {
      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Delete failed: ${error.message}. Check Supabase RLS policies.`);
        console.error('Delete RSVP Error:', error);
      } else {
        setRsvpsList((prev) => prev.filter((item) => item.id !== id));
        await fetchRSVPs();
      }
    } catch (err: any) {
      alert(`Delete Exception: ${err.message || err}`);
    }
  };

  // Delete Song Handler
  const handleDeleteSong = async (id: number) => {
    if (!confirm('Are you sure you want to remove this song request?')) return;
    
    try {
      const { error } = await supabase
        .from('song_requests')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Delete failed: ${error.message}. Check Supabase RLS policies.`);
        console.error('Delete Song Error:', error);
      } else {
        setRequestedSongs((prev) => prev.filter((song) => song.id !== id));
        if (currentSong?.id === id) {
          setCurrentSong(null);
        }
        await fetchSongs();
      }
    } catch (err: any) {
      alert(`Delete Exception: ${err.message || err}`);
    }
  };

  // Manual Shuffle Toggle Trigger
  const handleShuffleClick = () => {
    setIsShuffle(!isShuffle);
    if (!isShuffle && requestedSongs.length > 1) {
      const availableSongs = requestedSongs.filter((s) => s.id !== currentSong?.id);
      const randomNext = availableSongs[Math.floor(Math.random() * availableSongs.length)];
      setCurrentSong(randomNext);
    }
  };

  // RSVP Submit Handler
  const handleRSVP = async () => {
    if (!guestName.trim()) {
      alert('Please enter your guest name(s).');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('rsvps')
        .insert([{ guest_names: guestName, status: rsvpStatus, notes: rsvpNotes }])
        .select();

      if (error) {
        console.error('RSVP Insert Error:', error);
        alert(`RSVP Error: ${error.message}`);
      } else {
        if (data && data.length > 0) {
          setRsvpsList((prev) => [data[0], ...prev]);
        }
      }
    } catch (err: any) {
      console.error('RSVP Exception:', err);
      alert(`RSVP Exception: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
      setHasRSVPd(true);
    }
  };

  // Skip RSVP Handler
  const handleSkipRSVP = () => {
    setHasRSVPd(true);
  };

  // Song Request Submit Handler
  const handleSongSubmit = async () => {
    if (!songTitle.trim() || !artist.trim()) {
      alert('Please fill in both the song title and artist.');
      return;
    }

    try {
      const newSong = { song_title: songTitle, artist, requested_by: guestName || 'Guest' };
      const { data, error } = await supabase
        .from('song_requests')
        .insert([newSong])
        .select();

      if (error) {
        alert(`Song Request Error: ${error.message}`);
      } else {
        setSongTitle('');
        setArtist('');
        await fetchSongs();
        
        if (data && data[0]) {
          setCurrentSong(data[0]);
        }
      }
    } catch (err: any) {
      alert(`Submission Error: ${err.message || err}`);
    }
  };

  // Toggle Play / Pause state via YouTube API
  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.unMute();
      playerRef.current.setVolume(30);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-xs font-mono selection:bg-pink-500 selection:text-white relative">
      
      {/* HIDDEN YOUTUBE AUDIO ENGINE */}
      <div className="hidden">
        <div id="audio-engine-frame" />
      </div>

      {/* TOP-LEFT COUNTDOWN TIMER WIDGET */}
      <div className="fixed top-2 left-2 z-50 bg-gray-950 border border-pink-500/80 p-2 text-gray-200 shadow-lg bg-black/80 backdrop-blur-sm">
        <div className="text-[10px] font-bold text-pink-400 uppercase tracking-widest border-b border-gray-800 pb-1 mb-1">
          ⏳ CEREMONY COUNTDOWN
        </div>
        <div className="flex gap-2 text-center text-xs font-bold text-white">
          <div>
            <span className="text-yellow-400 text-sm block">{timeLeft.days}</span>
            <span className="text-[8px] text-gray-400 uppercase">Days</span>
          </div>
          <span className="text-pink-500 font-normal">:</span>
          <div>
            <span className="text-yellow-400 text-sm block">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-400 uppercase">Hrs</span>
          </div>
          <span className="text-pink-500 font-normal">:</span>
          <div>
            <span className="text-yellow-400 text-sm block">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-400 uppercase">Min</span>
          </div>
          <span className="text-pink-500 font-normal">:</span>
          <div>
            <span className="text-yellow-400 text-sm block">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[8px] text-gray-400 uppercase">Sec</span>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT ADMIN PANEL TRIGGER WIDGET */}
      <div className="fixed top-2 right-2 z-50">
        <button
          type="button"
          onClick={() => setIsAdminOpen(!isAdminOpen)}
          className="bg-gray-900 hover:bg-pink-900 text-pink-400 font-bold border border-pink-500 px-3 py-1 shadow-lg cursor-pointer"
        >
          {isAdminOpen ? '✕ Close Admin' : '🔑 Admin'}
        </button>

        {/* ADMIN MODAL / DROPDOWN CONTAINER */}
        {isAdminOpen && (
          <div className="mt-2 w-80 md:w-96 bg-gray-950 border-2 border-pink-500 shadow-2xl p-4 text-gray-200 text-xs">
            <div className="bg-gradient-to-r from-pink-900 to-purple-900 text-white p-2 font-bold mb-3 flex justify-between items-center border border-pink-500">
              <span>ADMIN DASHBOARD</span>
              {isAdminAuthenticated && (
                <button 
                  onClick={() => setIsAdminAuthenticated(false)}
                  className="text-[10px] bg-red-800 hover:bg-red-700 px-1.5 py-0.5 border border-red-500"
                >
                  Logout
                </button>
              )}
            </div>

            {!isAdminAuthenticated ? (
              <form onSubmit={handleAdminAuth} className="space-y-3">
                <p className="text-gray-400">Enter admin password to manage site data:</p>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full bg-black border border-gray-700 p-2 text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-pink-700 hover:bg-pink-600 text-white font-bold p-2 border border-pink-500 cursor-pointer"
                >
                  Unlock Dashboard
                </button>
              </form>
            ) : (
              <div>
                <div className="flex border-b border-gray-800 mb-3 gap-2">
                  <button
                    onClick={() => setAdminTab('rsvps')}
                    className={`pb-1 px-2 font-bold border-b-2 cursor-pointer ${
                      adminTab === 'rsvps'
                        ? 'border-pink-500 text-pink-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    RSVPs ({rsvpsList.length})
                  </button>
                  <button
                    onClick={() => setAdminTab('songs')}
                    className={`pb-1 px-2 font-bold border-b-2 cursor-pointer ${
                      adminTab === 'songs'
                        ? 'border-pink-500 text-pink-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Songs ({requestedSongs.length})
                  </button>
                </div>

                {/* TAB 1: RSVPS MANAGEMENT */}
                {adminTab === 'rsvps' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {rsvpsList.length === 0 ? (
                      <p className="text-gray-500 italic">No RSVPs recorded yet.</p>
                    ) : (
                      rsvpsList.map((item) => (
                        <div key={item.id} className="bg-black p-2 border border-gray-800 flex justify-between items-start gap-2">
                          <div>
                            <div className="font-bold text-white">{item.guest_names}</div>
                            <div className="text-[10px] text-gray-400">
                              Status: <span className="uppercase text-yellow-400">{item.status}</span>
                            </div>
                            {item.notes && (
                              <div className="text-[10px] text-pink-300/80 mt-1 italic">
                                &quot;{item.notes}&quot;
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRSVP(item.id)}
                            className="bg-red-900/80 hover:bg-red-700 text-white text-[10px] px-2 py-1 border border-red-500 cursor-pointer shrink-0"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: SONG REQUESTS MANAGEMENT */}
                {adminTab === 'songs' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {requestedSongs.length === 0 ? (
                      <p className="text-gray-500 italic">No song requests recorded yet.</p>
                    ) : (
                      requestedSongs.map((song) => (
                        <div key={song.id} className="bg-black p-2 border border-gray-800 flex justify-between items-center">
                          <div className="max-w-[200px] truncate">
                            <div className="font-bold text-pink-400 truncate">{song.song_title}</div>
                            <div className="text-[10px] text-gray-400 truncate">{song.artist}</div>
                            <div className="text-[9px] text-gray-600 truncate">By: {song.requested_by || 'Anon'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSong(song.id)}
                            className="bg-red-900/80 hover:bg-red-700 text-white text-[10px] px-2 py-1 border border-red-500 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PAGE 1: SPLASH SCREEN */}
      {!hasRSVPd ? (
        <div 
          className="relative h-screen w-full flex flex-col justify-end items-center bg-cover bg-center pb-12"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85), transparent), url('/saolaurenco.jpg')` }}
        >
          <div className="bg-gray-200 border-2 border-gray-400 p-6 max-w-lg w-full mx-4 shadow-2xl text-black">
            <div className="bg-blue-900 text-white font-bold px-3 py-1.5 mb-4 flex justify-between items-center text-base">
              <span>Molly and Sean - Best Wedding Ever</span>
              <span>[X]</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-bold text-sm">Guest Name(s):</label>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. John & Jane Doe"
                  className="w-full p-2 border-2 border-gray-600 text-black bg-white focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-sm">Attending?</label>
                <div className="flex gap-6 bg-white p-2.5 border border-gray-400 text-sm">
                  {['yes', 'no', 'maybe'].map((val) => (
                    <label key={val} className="capitalize flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input 
                        type="radio" 
                        name="rsvp" 
                        value={val} 
                        checked={rsvpStatus === val} 
                        onChange={(e) => setRsvpStatus(e.target.value)}
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-sm">Notes:</label>
                <textarea 
                  rows={3}
                  value={rsvpNotes}
                  onChange={(e) => setRsvpNotes(e.target.value)}
                  placeholder="Leave a message or extra details..."
                  className="w-full p-2 border-2 border-gray-600 text-black bg-white focus:outline-none resize-none text-sm"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button 
                  type="button" 
                  onClick={handleRSVP}
                  disabled={isSubmitting}
                  className="w-full bg-gray-300 hover:bg-gray-400 border-2 border-white font-bold p-2.5 text-base active:border-gray-500 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit RSVP & Enter Site »'}
                </button>

                <button 
                  type="button" 
                  onClick={handleSkipRSVP}
                  className="w-full bg-transparent hover:bg-gray-300 text-gray-700 hover:text-black font-semibold p-1.5 text-xs underline cursor-pointer text-center"
                >
                  Skip RSVP & Browse Site »
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (

        /* PAGE 2: MAIN HUB WITH SLIDESHOW */
        <>
          <div className="fixed inset-0 z-0">
            {slideshowImages.map((img, index) => (
              <div
                key={img}
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                style={{
                  backgroundImage: `url('${img}')`,
                  opacity: index === currentImageIndex ? 1 : 0,
                }}
              />
            ))}
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6 pb-64 text-gray-200">
            <header className="border-2 border-pink-500 bg-black/80 p-6 mb-6 text-center shadow-lg">
              <h1 className="text-3xl font-bold text-pink-400 tracking-wider">Welcome to Our Wedding Page</h1>
              <p className="text-gray-300 mt-1.5 text-sm">August 4th, 2027 in beautiful São Lourenço Bay, Santa Maria, Azores</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* SONG REQUEST CARD (EXPANDED BOX) */}
              <div className="border border-pink-500/50 bg-black/85 p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-yellow-400 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4">
                    &raquo; Add a Song Request
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-1.5 text-sm font-semibold">Song Title:</label>
                      <input 
                        type="text" 
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        className="w-full bg-black/90 border border-gray-700 p-2 text-white focus:border-pink-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1.5 text-sm font-semibold">Artist:</label>
                      <input 
                        type="text" 
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        className="w-full bg-black/90 border border-gray-700 p-2 text-white focus:border-pink-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleSongSubmit}
                  className="w-full bg-pink-700 hover:bg-pink-600 text-white font-bold px-4 py-2.5 border border-pink-500 mt-6 cursor-pointer text-sm"
                >
                  + Add Track & Play Now
                </button>
              </div>

              {/* TRAVEL, ACTIVITIES, FAQ & MAP GUIDE CARD (EXPANDED BOX & FONTS) */}
              <div className="border border-pink-500/50 bg-black/85 p-6 shadow-xl flex flex-col">
                <div className="flex border-b border-gray-800 mb-4 gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveGuideTab('travel')}
                    className={`pb-1.5 px-3 font-bold border-b-2 cursor-pointer text-sm uppercase whitespace-nowrap ${
                      activeGuideTab === 'travel'
                        ? 'border-pink-500 text-pink-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ✈️ Travel
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('activities')}
                    className={`pb-1.5 px-3 font-bold border-b-2 cursor-pointer text-sm uppercase whitespace-nowrap ${
                      activeGuideTab === 'activities'
                        ? 'border-pink-500 text-pink-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    🌋 Activities
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('faq')}
                    className={`pb-1.5 px-3 font-bold border-b-2 cursor-pointer text-sm uppercase whitespace-nowrap ${
                      activeGuideTab === 'faq'
                        ? 'border-pink-500 text-pink-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ❓ FAQ
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('map')}
                    className={`pb-1.5 px-3 font-bold border-b-2 cursor-pointer text-sm uppercase whitespace-nowrap ${
                      activeGuideTab === 'map'
                        ? 'border-pink-500 text-pink-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    🗺️ Map
                  </button>
                </div>

                {/* TAB 1: TRAVEL & ACCOMMODATION */}
                {activeGuideTab === 'travel' && (
                  <div className="space-y-5 text-gray-300 text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                    <div>
                      <span className="text-yellow-400 font-bold block mb-2 text-base">✈️ GETTING TO SANTA MARIA (SMA)</span>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li><strong className="text-white">Main Hub:</strong> Fly into Ponta Delgada (PDL) on São Miguel Island via SATA Air Açores or TAP Air Portugal.</li>
                        <li><strong className="text-white">Island Hopper:</strong> Take a quick 25-minute domestic flight from PDL to Santa Maria Airport (SMA).</li>
                        <li><strong className="text-white">Ferry Option:</strong> Seasonal inter-island ferries operate between São Miguel and Santa Maria during peak summer months.</li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <span className="text-pink-400 font-bold block mb-2 text-base">🏠 ACCOMMODATIONS</span>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li><strong className="text-white">São Lourenço Bay:</strong> Local villas and Airbnb rentals right by the beach and vineyard slopes.</li>
                        <li><strong className="text-white">Vila do Porto:</strong> Main town (15 min drive) with options like Hotel Colombo, Hotel Santa Maria, and Charming Blue.</li>
                        <li><strong className="text-white">Rental Cars:</strong> Highly recommended to book early directly at SMA airport for full island mobility.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* TAB 2: ISLAND ACTIVITIES */}
                {activeGuideTab === 'activities' && (
                  <div className="space-y-5 text-gray-300 text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                    <div>
                      <span className="text-yellow-400 font-bold block mb-2 text-base">🏖️ BEACHES & NATURAL POOLS</span>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li><strong className="text-white">Praia Formosa:</strong> Famous white-sand beach perfect for swimming and oceanfront dining.</li>
                        <li><strong className="text-white">São Lourenço Bay:</strong> Natural rock pools and amphitheater-like terraced vineyards.</li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <span className="text-pink-400 font-bold block mb-2 text-base">🥾 HIKING & SIGHTSEEING</span>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li><strong className="text-white">Barreiro da Faneca:</strong> Known as the &quot;Red Desert&quot; of the Azores—a striking, arid landscape.</li>
                        <li><strong className="text-white">Pico Alto:</strong> Highest point on the island featuring panoramic views across Santa Maria.</li>
                        <li><strong className="text-white">Cascata do Aveiro:</strong> Impressive 110-meter waterfall on the southeastern coast.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* TAB 3: FAQ & ATTIRE */}
                {activeGuideTab === 'faq' && (
                  <div className="space-y-5 text-gray-300 text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                    <div>
                      <span className="text-yellow-400 font-bold block mb-2 text-base">👔 DRESS CODE: ISLAND CASUAL</span>
                      <p className="text-gray-300 mb-2">
                        Think relaxed yet polished seaside attire!
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li><strong className="text-white">Attire Ideas:</strong> Linen shirts, lightweight slacks, sundresses, or breezy maxi dresses. No formal suits or ties required.</li>
                        <li><strong className="text-white">Footwear:</strong> Block heels, wedges, dress sandals, or loafers recommended (beware of cobblestones and sandy coastal terrain).</li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <span className="text-pink-400 font-bold block mb-2 text-base">☀️ WEATHER & ATMOSPHERE</span>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li><strong className="text-white">August Temperatures:</strong> Warm and pleasant (~24°C / 75°F).</li>
                        <li><strong className="text-white">Ocean Breeze:</strong> Bring a light jacket or shawl for coastal winds late in the evening.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* TAB 4: CARTOONY/ROADS MAP EMBED */}
                {activeGuideTab === 'map' && (
                  <div className="space-y-4 text-gray-300 text-xs flex flex-col h-full">
                    <div className="text-xs text-gray-300 italic">
                      📍 São Lourenço Bay, Santa Maria, Azores (Positioned in the Atlantic between Boston & Lisbon)
                    </div>

                    {/* Styled Map Container Scaled Out to Show Atlantic Context */}
                    <div className="w-full h-64 border border-pink-500/80 bg-black relative shadow-inner overflow-hidden">
                      <iframe
                        width="100%"
                        height="128%"
                        style={{ border: 0, marginTop: '-2%', marginBottom: '-26%' }}
                        loading="lazy"
                        allowFullScreen
                        title="São Lourenço Bay Location Map"
                        src="https://maps.google.com/maps?q=36.9928,-25.0531&t=m&z=3&ie=UTF8&iwloc=&output=embed"
                        className="w-full filter contrast-125 brightness-90 hue-rotate-[320deg]"
                      />
                    </div>

                    {/* Map Direct Link Footer */}
                    <div className="flex justify-between items-center pt-1 text-xs">
                      <a
                        href="https://maps.google.com/?q=Baia+de+Sao+Lourenco+Santa+Maria+Azores"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 underline font-bold flex items-center gap-1"
                      >
                        ↗ Open São Lourenço Bay in Google Maps
                      </a>
                      <span className="text-gray-400">Santa Maria, Azores</span>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* REQUESTED WEDDING SONGS WIDGET & LIVE AUDIO PLAYER (EXPANDED TO w-[420px]) */}
            <div className="fixed bottom-3 right-3 w-[420px] bg-gray-950 border-2 border-pink-500 shadow-2xl z-50">
              <div className="bg-gradient-to-r from-pink-900 to-purple-900 text-white px-3.5 py-2 font-bold text-xs flex justify-between items-center border-b border-pink-500 uppercase tracking-wider">
                <span>REQUESTED WEDDING SONGS</span>
                <span className={isPlaying ? "animate-pulse text-green-400" : "text-yellow-500"}>
                  {isPlaying ? '● PLAYING (30% VOL)' : '■ PAUSED'}
                </span>
              </div>

              {/* ACTIVE TRACK DISPLAY & CONTROLS */}
              <div className="p-3.5 bg-black flex items-center justify-between border-b border-gray-800">
                <div className="text-gray-300 max-w-[190px] truncate">
                  <div className="text-pink-400 font-bold text-sm truncate">
                    {currentSong ? currentSong.song_title : 'No Track Selected'}
                  </div>
                  <div className="text-xs text-gray-300 truncate">
                    {currentSong ? currentSong.artist : 'Add a request above'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleShuffleClick}
                    title="Toggle Shuffle"
                    className={`px-3 py-1.5 border text-xs font-bold cursor-pointer transition-colors ${
                      isShuffle 
                        ? 'bg-pink-600 text-white border-pink-400' 
                        : 'bg-gray-800 text-gray-400 border-gray-600 hover:text-white'
                    }`}
                  >
                    🔀 SHUFFLE
                  </button>

                  <button 
                    type="button"
                    onClick={togglePlayPause}
                    className="bg-pink-700 hover:bg-pink-600 text-white font-bold px-3.5 py-1.5 border border-pink-400 cursor-pointer text-sm"
                  >
                    {isPlaying ? '❚❚' : '▶'}
                  </button>
                </div>
              </div>

              {/* REQUEST QUEUE */}
              <div className="p-3 border-t border-gray-800 bg-gray-900/90 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center text-xs text-pink-400 font-bold mb-2 border-b border-gray-800 pb-1">
                  <span>REQUEST QUEUE ({requestedSongs.length}):</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {isShuffle ? 'Mode: Random' : 'Mode: Sequential'}
                  </span>
                </div>
                <ul className="space-y-2 text-xs">
                  {requestedSongs.length === 0 ? (
                    <li className="text-gray-500 italic">No song requests yet...</li>
                  ) : (
                    requestedSongs.map((song) => (
                      <li 
                        key={song.id} 
                        onClick={() => {
                          setCurrentSong(song);
                          setIsPlaying(true);
                        }}
                        className={`border-b border-gray-800/50 pb-1.5 cursor-pointer hover:bg-pink-950/40 p-1.5 rounded ${
                          currentSong?.id === song.id ? 'border-l-2 border-pink-500 bg-pink-950/30' : ''
                        }`}
                      >
                        <span className="text-white font-semibold">{song.song_title}</span> - {song.artist}
                        <span className="block text-[10px] text-gray-400">Requested by: {song.requested_by || 'Anonymous'}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}