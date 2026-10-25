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