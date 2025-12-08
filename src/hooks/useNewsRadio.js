// src/hooks/useNewsRadio.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useNewsRadio = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);
  
  // --- NEW: Voice Management ---
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const playlistRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const utteranceRef = useRef(null);

  // 1. Load Voices Properly (Fixes the "Robotic" issue)
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        
        // Try to auto-select the best voice (Non-robotic ones)
        // Priority: Google US English > Microsoft Zira > Apple System > First Available
        const bestVoice = voices.find(v => v.name === 'Google US English') // Chrome's best free voice
                       || voices.find(v => v.name.includes('Google')) 
                       || voices.find(v => v.name.includes('Microsoft') && v.name.includes('Online')) // Edge's best voice
                       || voices.find(v => v.name.includes('Natural')) 
                       || voices[0];
                       
        setSelectedVoice(bestVoice);
      }
    };

    // Chrome loads voices asynchronously, so we must listen for this event
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Trigger immediately in case they are already loaded

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const changeVoice = useCallback((voiceName) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) setSelectedVoice(voice);
  }, [availableVoices]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentArticleId(null);
    playlistRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  const speakText = useCallback((text, onEndCallback) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Apply the selected high-quality voice
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    // Slightly slower rate sounds more natural for news
    utterance.rate = 0.95; 
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice]); // Re-create if voice changes

  const playNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex >= playlistRef.current.length) {
      stop(); 
      return;
    }

    currentIndexRef.current = nextIndex;
    const article = playlistRef.current[nextIndex];
    setCurrentArticleId(article._id);

    // Add a slight pause formatting for better listening
    const textToRead = `${article.headline}. ... ${article.summary}`;

    speakText(textToRead, () => {
      playNext();
    });
  }, [speakText, stop]);

  const startRadio = useCallback((articles) => {
    stop();
    if (!articles || articles.length === 0) return;
    playlistRef.current = articles;
    currentIndexRef.current = -1;
    playNext();
  }, [playNext, stop]);

  const playSingle = useCallback((article) => {
    stop();
    setCurrentArticleId(article._id);
    const textToRead = `${article.headline}. ... ${article.summary}`;
    speakText(textToRead, () => stop());
  }, [speakText, stop]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  const skip = useCallback(() => {
    playNext();
  }, [playNext]);

  return {
    isSpeaking,
    isPaused,
    currentArticleId,
    availableVoices, // List of voices for the UI
    selectedVoice,   // Currently selected voice
    changeVoice,     // Function to change voice
    startRadio,
    playSingle,
    stop,
    pause,
    resume,
    skip
  };
};

export default useNewsRadio;
