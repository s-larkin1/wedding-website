'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://obnoczzswjtzqnkkrioa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibm9jenpzd2p0enFua2tyaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTY4NjcsImV4cCI6MjEwMjczMjg2N30.L7zlOp0jkOqGYTHb_c8P_AvGO6B0H5pr6AVHwDHTYvc'
);

export default function WeddingApp() {
  const [hasRSVPd, setHasRSVPd] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
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

  // Info Section Tab State
  const [activeGuideTab, setActiveGuideTab] = useState<'schedule' | 'travel' | 'dress' | 'activities' | 'map'>('schedule');

  // HTML5 Audio Reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs for state management
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

  // Countdown Timer Effect
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

  // Play Next Song in queue
  const handleNextSong = () => {
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

  // Handle Background Slideshow
  useEffect(() => {
    if (hasRSVPd) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [hasRSVPd, slideshowImages.length]);

  // Resolve audio stream when track changes
  useEffect(() => {
    if (currentSong && hasRSVPd) {
      const resolveAudio = async () => {
        try {
          const query = `${currentSong.song_title} ${currentSong.artist}`;
          const res = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
          const data = await res.json();

          if (data.audioUrl && audioRef.current) {
            audioRef.current.src = data.audioUrl;
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch((e) => {
              console.error('Autoplay prevented:', e);
              setIsPlaying(false);
            });
          }
        } catch (e) {
          console.error('Audio stream resolution failed:', e);
        }
      };
      resolveAudio();
    }
  }, [currentSong, hasRSVPd]);

  // Fetch song requests from Supabase
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
      const { error } = await supabase.from('rsvps').delete().eq('id', id);
      if (error) {
        alert(`Delete failed: ${error.message}`);
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
      const { error } = await supabase.from('song_requests').delete().eq('id', id);
      if (error) {
        alert(`Delete failed: ${error.message}`);
      } else {
        setRequestedSongs((prev) => prev.filter((song) => song.id !== id));
        if (currentSong?.id === id) setCurrentSong(null);
        await fetchSongs();
      }
    } catch (err: any) {
      alert(`Delete Exception: ${err.message || err}`);
    }
  };

  // Manual Shuffle Toggle
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
        .insert([{ guest_names: guestName, email: guestEmail, status: rsvpStatus, notes: rsvpNotes }])
        .select();

      if (!error && data && data.length > 0) {
        setRsvpsList((prev) => [data[0], ...prev]);
      }
    } catch (err: any) {
      console.error('RSVP Exception:', err);
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
      const { data, error } = await supabase.from('song_requests').insert([newSong]).select();

      if (!error) {
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

  // Toggle Play / Pause Audio
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Audio playback error:', e);
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 text-xs font-mono selection:bg-blue-500 selection:text-white relative overflow-x-hidden">

      {/* HTML5 Direct Web Audio Player */}
      <audio 
        ref={audioRef}
        onEnded={handleNextSong}
        playsInline
        className="hidden"
      />

      {/* TOP NAVIGATION BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-start p-2 sm:p-3 pointer-events-none gap-2">
        {/* COUNTDOWN TIMER WIDGET */}
        <div className="bg-white/95 border border-gray-300 px-2.5 py-1.5 sm:p-2 text-gray-800 shadow-md backdrop-blur-sm pointer-events-auto">
          <div className="text-[9px] sm:text-[10px] font-bold text-blue-900 uppercase tracking-wider sm:tracking-widest border-b border-gray-200 pb-0.5 mb-1">
            ⏳ COUNTDOWN
          </div>
          <div className="flex gap-1.5 sm:gap-2 text-center text-xs font-bold text-gray-900">
            <div>
              <span className="text-blue-700 text-xs sm:text-sm block leading-tight">{timeLeft.days}</span>
              <span className="text-[8px] text-gray-500 uppercase">Days</span>
            </div>
            <span className="text-gray-400 font-normal">:</span>
            <div>
              <span className="text-blue-700 text-xs sm:text-sm block leading-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[8px] text-gray-500 uppercase">Hrs</span>
            </div>
            <span className="text-gray-400 font-normal">:</span>
            <div>
              <span className="text-blue-700 text-xs sm:text-sm block leading-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[8px] text-gray-500 uppercase">Min</span>
            </div>
            <span className="text-gray-400 font-normal">:</span>
            <div>
              <span className="text-blue-700 text-xs sm:text-sm block leading-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[8px] text-gray-500 uppercase">Sec</span>
            </div>
          </div>
        </div>

        {/* ADMIN PANEL TRIGGER WIDGET */}
        <div className="pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="bg-white hover:bg-gray-50 active:bg-gray-100 text-blue-900 font-bold border border-gray-300 px-3 py-2 sm:py-1.5 shadow-md cursor-pointer min-h-[38px]"
          >
            {isAdminOpen ? '✕ Close' : '🔑 Admin'}
          </button>
        </div>
      </div>

      {/* ADMIN MODAL OVERLAY */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-3 bg-black/50 backdrop-blur-xs pointer-events-auto">
          <div className="w-full max-w-md bg-white border-2 border-gray-300 shadow-2xl p-4 text-gray-800 text-xs">
            <div className="bg-blue-900 text-white p-2 font-bold mb-3 flex justify-between items-center border border-blue-900">
              <span>ADMIN DASHBOARD</span>
              <div className="flex items-center gap-2">
                {isAdminAuthenticated && (
                  <button 
                    type="button"
                    onClick={() => setIsAdminAuthenticated(false)}
                    className="text-[10px] bg-red-700 hover:bg-red-600 px-2 py-1 border border-red-500 text-white cursor-pointer"
                  >
                    Logout
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAdminOpen(false)}
                  className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-1 border border-gray-400 text-gray-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {!isAdminAuthenticated ? (
              <form onSubmit={handleAdminAuth} className="space-y-3">
                <p className="text-gray-600">Enter admin password to manage site data:</p>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full bg-white border border-gray-400 p-2.5 text-base text-gray-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold p-2.5 border border-blue-900 cursor-pointer text-sm"
                >
                  Unlock Dashboard
                </button>
              </form>
            ) : (
              <div>
                <div className="flex border-b border-gray-200 mb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminTab('rsvps')}
                    className={`pb-1.5 px-2 font-bold border-b-2 cursor-pointer text-xs ${
                      adminTab === 'rsvps'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    RSVPs ({rsvpsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminTab('songs')}
                    className={`pb-1.5 px-2 font-bold border-b-2 cursor-pointer text-xs ${
                      adminTab === 'songs'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Songs ({requestedSongs.length})
                  </button>
                </div>

                {/* RSVPS MANAGEMENT */}
                {adminTab === 'rsvps' && (
                  <div className="space-y-2 max-h-[55dvh] overflow-y-auto pr-1">
                    {rsvpsList.length === 0 ? (
                      <p className="text-gray-500 italic">No RSVPs recorded yet.</p>
                    ) : (
                      rsvpsList.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-2.5 border border-gray-200 flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 break-words">{item.guest_names}</div>
                            {item.email && <div className="text-[11px] text-blue-700 break-all">{item.email}</div>}
                            <div className="text-[11px] text-gray-600">
                              Status: <span className="uppercase text-blue-800 font-semibold">{item.status}</span>
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-gray-700 mt-1 italic break-words">
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRSVP(item.id)}
                            className="bg-red-700 hover:bg-red-600 text-white text-[11px] px-2.5 py-1.5 border border-red-500 cursor-pointer shrink-0"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* SONG REQUESTS MANAGEMENT */}
                {adminTab === 'songs' && (
                  <div className="space-y-2 max-h-[55dvh] overflow-y-auto pr-1">
                    {requestedSongs.length === 0 ? (
                      <p className="text-gray-500 italic">No song requests recorded yet.</p>
                    ) : (
                      requestedSongs.map((song) => (
                        <div key={song.id} className="bg-gray-50 p-2.5 border border-gray-200 flex justify-between items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-blue-900 truncate">{song.song_title}</div>
                            <div className="text-[11px] text-gray-700 truncate">{song.artist}</div>
                            <div className="text-[10px] text-gray-500 truncate">By: {song.requested_by || 'Anon'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSong(song.id)}
                            className="bg-red-700 hover:bg-red-600 text-white text-[11px] px-2.5 py-1.5 border border-red-500 cursor-pointer shrink-0"
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
        </div>
      )}

      {/* PAGE 1: SPLASH SCREEN */}
      {!hasRSVPd ? (
        <div 
          className="relative min-h-[100dvh] w-full flex flex-col justify-end sm:justify-center items-center bg-cover bg-center pt-20 pb-6 sm:py-12 px-3 pointer-events-auto"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url('/saolaurenco.jpg')` }}
        >
          <div className="bg-gray-200 border-2 border-gray-400 p-4 sm:p-6 max-w-lg w-full shadow-2xl text-black">
            <div className="bg-blue-900 text-white font-bold px-3 py-2 mb-4 flex justify-between items-center text-sm sm:text-base gap-2">
              <span className="truncate">Molly & Sean - Best Wedding Ever</span>
              <span className="shrink-0">[X]</span>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block mb-1 font-bold text-sm">Guest Name(s):</label>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. John & Jane Doe"
                  className="w-full p-2.5 border-2 border-gray-600 text-black bg-white focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-sm">Email Address:</label>
                <input 
                  type="email" 
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full p-2.5 border-2 border-gray-600 text-black bg-white focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-sm">Attending?</label>
                <div className="grid grid-cols-2 gap-2 bg-white p-2 border border-gray-400 text-sm">
                  {['yes', 'no'].map((val) => (
                    <label
                      key={val}
                      className={`capitalize flex items-center justify-center gap-1.5 py-1.5 px-2 cursor-pointer font-semibold border ${
                        rsvpStatus === val ? 'bg-blue-100 border-blue-800' : 'border-transparent'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="rsvp" 
                        value={val} 
                        checked={rsvpStatus === val} 
                        onChange={(e) => setRsvpStatus(e.target.value)}
                        className="w-4 h-4"
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-sm">Notes:</label>
                <textarea 
                  rows={2}
                  value={rsvpNotes}
                  onChange={(e) => setRsvpNotes(e.target.value)}
                  placeholder="Dietary needs, wedding ideas, or a note..."
                  className="w-full p-2.5 border-2 border-gray-600 text-black bg-white focus:outline-none resize-none text-base"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button 
                  type="button" 
                  onClick={handleRSVP}
                  disabled={isSubmitting}
                  className="w-full bg-gray-300 hover:bg-gray-400 active:bg-gray-500 border-2 border-white font-bold p-3 text-base cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit RSVP & Enter Site »'}
                </button>

                <button 
                  type="button" 
                  onClick={handleSkipRSVP}
                  className="w-full bg-transparent hover:bg-gray-300 text-gray-700 hover:text-black font-semibold py-2.5 text-xs underline cursor-pointer text-center min-h-[40px]"
                >
                  Skip RSVP & Browse Site »
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (

        /* PAGE 2: MAIN HUB WITH SLIDESHOW & GUIDES */
        <>
          {/* BACKGROUND SLIDESHOW */}
          <div className="fixed inset-0 z-0 pointer-events-none">
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
            <div className="absolute inset-0 bg-white/85 sm:bg-white/75 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-44 sm:pb-36 text-gray-800 pointer-events-auto">
            <header className="border-2 border-blue-900 bg-white/95 p-4 sm:p-6 mb-5 sm:mb-6 text-center shadow-lg">
              <h1 className="text-xl sm:text-3xl font-bold text-blue-900 tracking-wide sm:tracking-wider leading-snug">
                Molly & Sean's Wedding Celebration
              </h1>
            </header>

            <main className="space-y-6">
              {/* WEDDING DETAILS & GUIDE CARD */}
              <div className="border border-gray-300 bg-white/95 p-4 sm:p-6 shadow-xl flex flex-col">
                <div className="grid grid-cols-5 border-b border-gray-200 mb-4 gap-0.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('schedule')}
                    className={`py-2 px-0.5 font-bold border-b-2 cursor-pointer text-[10px] sm:text-xs uppercase text-center truncate ${
                      activeGuideTab === 'schedule'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📅 Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('travel')}
                    className={`py-2 px-0.5 font-bold border-b-2 cursor-pointer text-[10px] sm:text-xs uppercase text-center truncate ${
                      activeGuideTab === 'travel'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ✈️ Stay
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('dress')}
                    className={`py-2 px-0.5 font-bold border-b-2 cursor-pointer text-[10px] sm:text-xs uppercase text-center truncate ${
                      activeGuideTab === 'dress'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    👗 Attire
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('activities')}
                    className={`py-2 px-0.5 font-bold border-b-2 cursor-pointer text-[10px] sm:text-xs uppercase text-center truncate ${
                      activeGuideTab === 'activities'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🌋 Do
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('map')}
                    className={`py-2 px-0.5 font-bold border-b-2 cursor-pointer text-[10px] sm:text-xs uppercase text-center truncate ${
                      activeGuideTab === 'map'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🗺️ Map
                  </button>
                </div>

                {/* TAB 1: SCHEDULE & EVENTS */}
                {activeGuideTab === 'schedule' && (
                  <div className="space-y-4 text-gray-700 text-xs sm:text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-1">
                    <div>
                      <span className="text-blue-900 font-bold block mb-1">August 3, 2027</span>
                      <p className="text-gray-900 font-semibold">Welcome Party & Sean's Birthday</p>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-blue-900 font-bold block mb-1">August 4, 2027</span>
                      
                      <div className="space-y-3 mt-2">
                        <div>
                          <strong className="text-blue-800 block">Ceremony (5:00 PM)</strong>
                          <p className="text-gray-700">Port at the end of São Lourenço Bay.</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">Transportation will be provided for those staying at the hotel.</p>
                        </div>

                        <div>
                          <strong className="text-blue-800 block">Cocktail Hour & Reception (6:00 PM - 2:00 AM)</strong>
                          <p className="text-gray-700">Ponta Negra Restaurante.</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">Drinks, dinner, and dancing all night!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ACCOMMODATIONS & TRAVEL */}
                {activeGuideTab === 'travel' && (
                  <div className="space-y-4 text-gray-700 text-xs sm:text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-1">
                    <div>
                      <span className="text-blue-900 font-bold block mb-2 text-sm sm:text-base">🏠 ACCOMMODATIONS</span>
                      <ul className="space-y-3 text-gray-700">
                        <li>
                          <strong className="text-gray-900 block">Hotel Colombo</strong>
                          <a 
                            href="https://www.guestreservations.com/hotel-colombo-vila-do-porto/booking" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline text-[11px] break-all block mt-0.5"
                          >
                            View Booking Options ↗
                          </a>
                        </li>
                        <li>
                          <strong className="text-gray-900 block">Hotel Santa Maria</strong>
                          <a 
                            href="https://www.hotel-santamaria.pt/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline text-[11px] break-all block mt-0.5"
                          >
                            hotel-santamaria.pt ↗
                          </a>
                        </li>
                        <li>
                          <strong className="text-gray-900 block">Booking.com</strong>
                          <a
                            href="https://www.booking.com/searchresults.html?ss=Santa+Maria+Island%2C+Azores%2C+Portugal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline text-[11px] break-all block mt-0.5"
                          >
                            Search Santa Maria Hotels on Booking.com ↗
                          </a>
                        </li>
                        <li>
                          <strong className="text-gray-900 block">Airbnb</strong>
                          <a
                            href="https://www.airbnb.com/s/Santa-Maria--Azores--Portugal/homes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline text-[11px] break-all block mt-0.5"
                          >
                            Search Rental Houses on Airbnb ↗
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* TAB 3: DRESS CODE */}
                {activeGuideTab === 'dress' && (
                  <div className="space-y-3 text-gray-700 text-xs sm:text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-1">
                    <div>
                      <span className="text-blue-900 font-bold block mb-1 text-base">👗 ISLAND COCKTAIL</span>
                      <p className="italic text-blue-800 mb-3">We want you to look your best while staying comfortable in the island breeze!</p>
                    </div>

                    <div className="space-y-2 text-gray-700">
                      <div>
                        <strong className="text-gray-900 block">For the gentlemen:</strong>
                        <p className="text-[11px] text-gray-600">Think breathable and relaxed. Light button-ups paired with linen pants or chinos are perfect. Suits and ties are completely optional—we want you to be comfortable!</p>
                      </div>

                      <div>
                        <strong className="text-gray-900 block">For the ladies:</strong>
                        <p className="text-[11px] text-gray-600">We would love to see you in cocktail-style beachy dresses. Think flowy midis, vibrant colors, or fun tropical prints.</p>
                      </div>

                      <div className="pt-2 border-t border-gray-200 text-blue-900 text-[11px]">
                        💡 We won’t be on the sand (unless you want a photo on the beach!), so wear whatever shoes are most comfortable for you.
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: THINGS TO DO */}
                {activeGuideTab === 'activities' && (
                  <div className="space-y-3 text-gray-700 text-xs sm:text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-1">
                    <span className="text-blue-900 font-bold block mb-1 text-sm sm:text-base">🌋 THINGS TO DO IN SANTA MARIA</span>
                    <ul className="space-y-2.5 text-gray-700">
                      <li>
                        <strong className="text-gray-900">Miradouro do Tagarete:</strong> Viewpoint of the whole island with a swing.{' '}
                        <a href="https://maps.google.com/?q=Miradouro+do+Tagarete+Santa+Maria" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900">Praia de São Lourenço:</strong> The beach at São Lourenço with a snack bar.{' '}
                        <a href="https://maps.google.com/?q=Praia+de+Sao+Laurenco+Santa+Maria" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900">Recreational Forest Reserve of Fontinhas:</strong> Beautiful redwood park to hike.{' '}
                        <a href="https://maps.google.com/?q=Reserva+Recreativa+Forestal+das+Fontinhas+Santa+Maria" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900">Pico Alto:</strong> Hike to the highest point on the island.{' '}
                        <a href="https://maps.google.com/?q=Pico+Alto+Santa+Maria+Azores" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900">Vila do Porto:</strong> Walk around the shops and restaurants in the Vila (we love Central Pub!).{' '}
                        <a href="https://maps.google.com/?q=Vila+do+Porto+Santa+Maria" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900">Praia Formosa:</strong> Beautiful beach with 2 restaurants.{' '}
                        <a href="https://maps.google.com/?q=Praia+Formosa+Santa+Maria+Azores" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900">Anjos:</strong> Natural pools with a snack bar.{' '}
                        <a href="https://maps.google.com/?q=Anjos+Santa+Maria+Azores" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900">Bar do Blues:</strong> Best place to catch the sunset and enjoy a drink!{' '}
                        <a href="https://maps.google.com/?q=Bar+do+Blues+Santa+Maria+Azores" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Map ↗</a>
                      </li>
                      <li>
                        <strong className="text-gray-900 block">Island Boat Trip:</strong> An amazing experience going through caves and jumping in, recommended by Sean & Molly!
                        <a 
                          href="https://mantamaria.com/pt/experiencias" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline text-[11px] block mt-0.5"
                        >
                          mantamaria.com ↗
                        </a>
                      </li>
                    </ul>
                  </div>
                )}

                {/* TAB 5: MAP */}
                {activeGuideTab === 'map' && (
                  <div className="space-y-4 text-gray-700 text-xs sm:text-sm leading-relaxed max-h-[420px] overflow-y-auto pr-1">
                    <div>
                      <span className="text-blue-900 font-bold block mb-2 text-sm sm:text-base">MAP & LOCATIONS</span>
                      <p className="text-gray-700 mb-2"><strong className="text-gray-900">Ceremony:</strong> Port at the end of São Lourenço Bay</p>
                      <p className="text-gray-700 mb-3"><strong className="text-gray-900">Reception:</strong> Ponta Negra Restaurante</p>
                      <a
                        href="https://maps.google.com/?q=Baia+de+Sao+Lourenco,+Santa+Maria,+Azores"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-900 hover:bg-blue-800 text-white font-bold px-3.5 py-2 border border-blue-900 text-xs"
                      >
                        Open Bay in Google Maps ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* SONG REQUEST CARD (MOVED TO THE BOTTOM) */}
              <div className="border border-gray-300 bg-white/95 p-4 sm:p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-blue-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
                    » Add a Song Request
                  </h2>

                  <div className="space-y-3.5 sm:space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-1.5 text-sm font-semibold">Song Title:</label>
                      <input 
                        type="text" 
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="e.g. Dancing Queen"
                        className="w-full bg-white border border-gray-400 p-2.5 text-gray-900 focus:border-blue-700 focus:outline-none text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1.5 text-sm font-semibold">Artist:</label>
                      <input 
                        type="text" 
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="e.g. ABBA"
                        className="w-full bg-white border border-gray-400 p-2.5 text-gray-900 focus:border-blue-700 focus:outline-none text-base"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleSongSubmit}
                  className="w-full bg-blue-900 hover:bg-blue-800 active:bg-blue-700 text-white font-bold px-4 py-3 border border-blue-900 mt-5 sm:mt-6 cursor-pointer text-sm min-h-[46px]"
                >
                  + Add Track to Playlist
                </button>
              </div>
            </main>
          </div>

          {/* FLOATING BOTTOM MUSIC PLAYER CONTROL BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t-2 border-blue-900 px-3 py-2.5 sm:p-4 shadow-2xl backdrop-blur-md pointer-events-auto">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="bg-blue-900 hover:bg-blue-800 active:bg-blue-700 text-white font-bold px-3.5 py-2.5 border border-blue-900 cursor-pointer shrink-0 text-xs flex items-center justify-center min-h-[42px] min-w-[84px]"
                >
                  {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="text-blue-900 font-bold text-sm truncate">
                    {currentSong ? currentSong.song_title : 'No track selected'}
                  </div>
                  <div className="text-gray-600 text-xs truncate">
                    {currentSong ? `By ${currentSong.artist}` : 'Add a track above!'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleShuffleClick}
                  className={`px-3 py-2 font-bold border text-xs cursor-pointer transition-colors text-center min-h-[38px] ${
                    isShuffle 
                      ? 'bg-blue-100 border-blue-800 text-blue-900' 
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🔀 Shuffle: {isShuffle ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={handleNextSong}
                  className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 text-gray-800 px-3 py-2 font-bold text-xs cursor-pointer text-center min-h-[38px]"
                >
                  NEXT ⏭
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}