// src/hooks/useNewsRadio.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useNewsRadio = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);
  
  // --- NEW: Autoplay & Countdown State ---
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [autoplayTimer, setAutoplayTimer] = useState(0); // 3, 2, 1...
  const timerIntervalRef = useRef(null);

  // Voice Management
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const playlistRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const utteranceRef = useRef(null);

  // 1. Load Voices
  useEffect(() => {
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
    };
  }, []);

  const changeVoice = useCallback((voiceName) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) setSelectedVoice(voice);
  }, [availableVoices]);

  // --- STOP Logic ---
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    setIsSpeaking(false);
    setIsPaused(false);
    setIsWaitingForNext(false); // Reset countdown UI
    setAutoplayTimer(0);
    
    setCurrentArticleId(null);
    playlistRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  // --- CORE SPEECH FUNCTION ---
  const speakText = useCallback((text, onEndCallback) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.95; 
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setIsWaitingForNext(false); // Ensure countdown is hidden while talking
    };

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsSpeaking(false);
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

    // Read headline, pause, then summary
    const textToRead = `${article.headline}. ... ${article.summary}`;

    speakText(textToRead, () => {
      // When this article finishes, IMMEDIATELY play the next one (Radio Mode)
      // OR trigger countdown? 
      // Current Logic: Radio mode is seamless. Single play triggers countdown.
      playNext();
    });
  }, [speakText, stop]);

  // --- NEW: COUNTDOWN LOGIC ---
  const startAutoplayCountdown = useCallback((currentArticleIndex) => {
    // If there is no next article, just stop.
    if (currentArticleIndex >= playlistRef.current.length - 1) {
      stop();
      return;
    }

    // Enter "Waiting" State
    setIsSpeaking(false); // Stop the "On Air" UI
    setIsWaitingForNext(true);
    setAutoplayTimer(3); // Start 3s timer
    currentIndexRef.current = currentArticleIndex; // Update index so playNext() grabs the right one

    timerIntervalRef.current = setInterval(() => {
      setAutoplayTimer((prev) => {
        if (prev <= 1) {
          // Timer finished!
          clearInterval(timerIntervalRef.current);
          setIsWaitingForNext(false);
          playNext(); // Start Radio Mode
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [playNext, stop]);

  const cancelAutoplay = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    stop(); // Fully reset
  }, [stop]);

  // --- PUBLIC ACTIONS ---

  // Updated: Accepts an optional startIndex to support "Scroll-Aware" start
  const startRadio = useCallback((articles, startIndex = 0) => {
    stop();
    if (!articles || articles.length === 0) return;
    
    playlistRef.current = articles;
    // Set index to one before the start, so playNext() increments to the correct one
    currentIndexRef.current = startIndex - 1; 
    
    playNext();
  }, [playNext, stop]);

  const playSingle = useCallback((article, allArticles) => {
    // We need the full list to know what comes next
    stop();
    
    // Set up the playlist in the background
    playlistRef.current = allArticles || [article];
    const thisIndex = playlistRef.current.findIndex(a => a._id === article._id);
    currentIndexRef.current = thisIndex; // Set current position
    
    setCurrentArticleId(article._id);
    const textToRead = `${article.headline}. ... ${article.summary}`;
    
    speakText(textToRead, () => {
      // Instead of stopping, start the countdown for the NEXT article
      startAutoplayCountdown(thisIndex);
    });
  }, [speakText, stop, startAutoplayCountdown]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  const skip = useCallback(() => {
    if (isWaitingForNext) {
        // If skipping during countdown, play immediately
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        playNext();
    } else {
        playNext();
    }
  }, [playNext, isWaitingForNext]);

  return {
    isSpeaking,
    isPaused,
    isWaitingForNext, // UI needs this to show the toast
    autoplayTimer,    // UI needs this to show "3... 2... 1..."
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
    cancelAutoplay    // Connect this to "Cancel" button on toast
  };
};

export default useNewsRadio;
