// src/hooks/useNewsRadio.js
import { useState, useEffect, useRef, useCallback } from 'react';

// --- THE SILENT AUDIO HACK ---
// A tiny, silent MP3 file (base64) to keep the OS media session alive
const SILENT_MP3 = 'data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYaW5nAAAARAAAAAAAAADtAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC//uQZAAAAAAA0AAAAAAABAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMYXZjNTcuNjQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//uQzAAAAAAA0AAAAAAABAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA';

const useNewsRadio = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);
  
  // --- Autoplay & Countdown State ---
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [autoplayTimer, setAutoplayTimer] = useState(0); 
  const timerIntervalRef = useRef(null);

  // --- Voice Management ---
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // --- Refs ---
  const playlistRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const utteranceRef = useRef(null);
  const silentAudioRef = useRef(null); // <--- Holds the silent player

  // 1. Initialize Silent Audio & Voices
  useEffect(() => {
    // Setup the silent audio player
    const audio = new Audio(SILENT_MP3);
    audio.loop = true;
    audio.volume = 0.1; // Non-zero volume is safer for iOS, but quiet enough to ignore
    silentAudioRef.current = audio;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        const bestVoice = voices.find(v => v.name === 'Google US English') 
                       || voices.find(v => v.name.includes('Google')) 
                       || voices.find(v => v.name.includes('Microsoft') && v.name.includes('Online'))
                       || voices.find(v => v.name.includes('Natural')) 
                       || voices[0];
        setSelectedVoice(bestVoice);
      }
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
      if (silentAudioRef.current) {
          silentAudioRef.current.pause();
          silentAudioRef.current = null;
      }
    };
  }, []);

  const changeVoice = useCallback((voiceName) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) setSelectedVoice(voice);
  }, [availableVoices]);

  // --- HELPER: Play/Stop Silent Audio ---
  const playSilentAudio = () => {
    if (silentAudioRef.current && silentAudioRef.current.paused) {
      silentAudioRef.current.play().catch(e => console.warn("Silent play blocked:", e));
    }
  };

  const stopSilentAudio = () => {
    if (silentAudioRef.current) {
      silentAudioRef.current.pause();
      silentAudioRef.current.currentTime = 0;
    }
  };

  // --- HELPER: Media Session Metadata ---
  const updateMediaSession = useCallback((article) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: article.headline,
        artist: `The Gamut Radio • ${article.source}`,
        album: article.category || 'News Feed',
        artwork: article.imageUrl ? [
          { src: article.imageUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: article.imageUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: article.imageUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: article.imageUrl, sizes: '512x512', type: 'image/jpeg' },
        ] : []
      });
      
      // Ensure the browser knows we are "playing"
      navigator.mediaSession.playbackState = "playing";
    }
  }, []);

  // --- STOP Logic ---
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    stopSilentAudio(); // <--- Kill the background audio
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    setIsSpeaking(false);
    setIsPaused(false);
    setIsWaitingForNext(false); 
    setAutoplayTimer(0);
    
    setCurrentArticleId(null);
    playlistRef.current = [];
    currentIndexRef.current = -1;

    // Clear Lock Screen
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    }
  }, []);

  // --- CORE SPEECH FUNCTION ---
  const speakText = useCallback((text, onEndCallback) => {
    window.speechSynthesis.cancel();
    
    // IMPORTANT: Ensure silent audio is playing BEFORE speech starts
    // This keeps the OS media session active
    playSilentAudio();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.95; 
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setIsWaitingForNext(false); 
      // Reinforce "Playing" state for OS
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    };

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsSpeaking(false);
      // Don't stop silent audio here yet, let the flow handle it
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice]);

  // --- PLAY NEXT (The Chain) ---
  const playNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex >= playlistRef.current.length) {
      stop(); 
      return;
    }

    currentIndexRef.current = nextIndex;
    const article = playlistRef.current[nextIndex];
    setCurrentArticleId(article._id);

    // Update Lock Screen
    updateMediaSession(article);

    const textToRead = `${article.headline}. ... ${article.summary}`;

    speakText(textToRead, () => {
      playNext();
    });
  }, [speakText, stop, updateMediaSession]);

  // --- COUNTDOWN LOGIC ---
  const startAutoplayCountdown = useCallback((currentArticleIndex) => {
    if (currentArticleIndex >= playlistRef.current.length - 1) {
      stop();
      return;
    }

    setIsSpeaking(false); 
    setIsWaitingForNext(true);
    setAutoplayTimer(5);
    currentIndexRef.current = currentArticleIndex; 
    
    // Keep silent audio playing during countdown so session doesn't die!
    playSilentAudio(); 
    
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Up Next...",
        artist: "The Gamut Radio",
        album: "Autoplay"
      });
      navigator.mediaSession.playbackState = "playing"; // Keep as 'playing' to keep screen controls active
    }

    timerIntervalRef.current = setInterval(() => {
      setAutoplayTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setIsWaitingForNext(false);
          playNext(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [playNext, stop]);

  const cancelAutoplay = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    stop(); 
  }, [stop]);

  // --- PUBLIC ACTIONS ---
  
  const startRadio = useCallback((articles, startIndex = 0) => {
    stop();
    if (!articles || articles.length === 0) return;
    
    // Ensure we trigger the "user interaction" requirement for audio
    playSilentAudio();

    playlistRef.current = articles;
    currentIndexRef.current = startIndex - 1; 
    
    playNext();
  }, [playNext, stop]);

  const playSingle = useCallback((article, allArticles) => {
    stop();
    
    // Ensure "user interaction" requirement
    playSilentAudio();

    playlistRef.current = allArticles || [article];
    const thisIndex = playlistRef.current.findIndex(a => a._id === article._id);
    currentIndexRef.current = thisIndex; 
    
    setCurrentArticleId(article._id);
    updateMediaSession(article);

    const textToRead = `${article.headline}. ... ${article.summary}`;
    
    speakText(textToRead, () => {
      startAutoplayCountdown(thisIndex);
    });
  }, [speakText, stop, startAutoplayCountdown, updateMediaSession]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    // Pause silent audio too? 
    // No, keep silent audio "playing" but silent, or pause it?
    // Pausing 'silent audio' might lose the lock screen. Best to keep it playing or pause it and rely on metadata.
    // For safety on iOS, we usually pause actual audio to reflect state.
    if (silentAudioRef.current) silentAudioRef.current.pause();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
    playSilentAudio(); // Resume silent track

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  }, []);

  const skip = useCallback(() => {
    if (isWaitingForNext) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        playNext();
    } else {
        playNext();
    }
  }, [playNext, isWaitingForNext]);

  // --- BIND HANDLERS ---
  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', resume);
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('nexttrack', skip);
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            // Optional: Restart current
            if (currentIndexRef.current >= 0 && playlistRef.current[currentIndexRef.current]) {
                const article = playlistRef.current[currentIndexRef.current];
                const textToRead = `${article.headline}. ... ${article.summary}`;
                speakText(textToRead, () => startAutoplayCountdown(currentIndexRef.current));
            }
        });
      } catch (e) {
        console.warn("Media Session API warning", e);
      }
    }
  }, [resume, pause, skip, speakText, startAutoplayCountdown]);

  return {
    isSpeaking,
    isPaused,
    isWaitingForNext,
    autoplayTimer,    
    currentArticleId,
    availableVoices,
    selectedVoice,
    changeVoice,
    startRadio,
    playSingle,
    stop,
    pause,
    resume,
    skip,
    cancelAutoplay    
  };
};

export default useNewsRadio;
