// src/hooks/useNewsRadio.js
import { useState, useEffect, useRef, useCallback } from 'react';

const useNewsRadio = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);
  
  // Store the list of articles to play in a queue
  const playlistRef = useRef([]);
  // Track which index we are currently reading
  const currentIndexRef = useRef(-1);
  // Store the SpeechSynthesisUtterance instance
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount: stop talking if the user leaves the page
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentArticleId(null);
    playlistRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  const speakText = useCallback((text, onEndCallback) => {
    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure Voice (Optional: Try to pick a Google/Microsoft English voice if available)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft David')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0; // Normal speed
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
  }, []);

  const playNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    
    // Check if we have reached the end of the playlist
    if (nextIndex >= playlistRef.current.length) {
      stop(); // End of Radio
      return;
    }

    currentIndexRef.current = nextIndex;
    const article = playlistRef.current[nextIndex];
    setCurrentArticleId(article._id);

    // Construct the text to read
    // "Headline... [pause]... Summary"
    const textToRead = `${article.headline}. . ${article.summary}`;

    speakText(textToRead, () => {
      // When finished, automatically call playNext again (Recursion for Autoplay)
      playNext();
    });
  }, [speakText, stop]);

  // --- Public Action: Start Radio Mode ---
  const startRadio = useCallback((articles) => {
    stop(); // Reset everything
    if (!articles || articles.length === 0) return;

    playlistRef.current = articles;
    currentIndexRef.current = -1; // Will become 0 in playNext()
    
    // Start the chain
    playNext();
  }, [playNext, stop]);

  // --- Public Action: Play Single Article ---
  const playSingle = useCallback((article) => {
    stop(); // Reset everything
    setCurrentArticleId(article._id);
    
    const textToRead = `${article.headline}. . ${article.summary}`;
    
    speakText(textToRead, () => {
      // When finished, just stop (don't play next)
      stop();
    });
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
    // Just triggering playNext() will cancel current speech and move on
    playNext();
  }, [playNext]);

  return {
    isSpeaking,
    isPaused,
    currentArticleId, // Used to highlight the active card
    startRadio,       // Pass the whole array of articles here
    playSingle,       // Pass just one article here
    stop,
    pause,
    resume,
    skip
  };
};

export default useNewsRadio;
