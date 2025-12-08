// src/hooks/useNewsRadio.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useNewsRadio = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);
  
  // --- Autoplay & Countdown State ---
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [autoplayTimer, setAutoplayTimer] = useState(0); 
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
    setIsWaitingForNext(false); 
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
      setIsWaitingForNext(false); 
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

    const textToRead = `${article.headline}. ... ${article.summary}`;

    speakText(textToRead, () => {
      playNext();
    });
  }, [speakText, stop]);

  // --- UPDATED: COUNTDOWN LOGIC (5 Seconds) ---
  const startAutoplayCountdown = useCallback((currentArticleIndex) => {
    if (currentArticleIndex >= playlistRef.current.length - 1) {
      stop();
      return;
    }

    setIsSpeaking(false); 
    setIsWaitingForNext(true);
    setAutoplayTimer(5); // <--- CHANGED FROM 3 TO 5
    currentIndexRef.current = currentArticleIndex; 

    timerIntervalRef.current = setInterval(() => {
      setAutoplayTimer((prev) => {
        if (prev <= 1) {
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
    stop(); 
  }, [stop]);

  // --- PUBLIC ACTIONS ---
  const startRadio = useCallback((articles, startIndex = 0) => {
    stop();
    if (!articles || articles.length === 0) return;
    
    playlistRef.current = articles;
    currentIndexRef.current = startIndex - 1; 
    
    playNext();
  }, [playNext, stop]);

  const playSingle = useCallback((article, allArticles) => {
    stop();
    
    playlistRef.current = allArticles || [article];
    const thisIndex = playlistRef.current.findIndex(a => a._id === article._id);
    currentIndexRef.current = thisIndex; 
    
    setCurrentArticleId(article._id);
    const textToRead = `${article.headline}. ... ${article.summary}`;
    
    speakText(textToRead, () => {
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
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        playNext();
    } else {
        playNext();
    }
  }, [playNext, isWaitingForNext]);

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
