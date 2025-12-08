// src/hooks/useNewsRadio.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

// PREMIUM VOICE ID (Restored)
const DEFAULT_VOICE_ID = 'tNIuvXGG5RnGdTbvfnPR'; 

const useNewsRadio = () => {
  // State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);
  
  // Autoplay State
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [autoplayTimer, setAutoplayTimer] = useState(0); 
  
  const [availableVoices] = useState([{ name: 'ElevenLabs AI - Host', lang: 'en-US' }]);
  const [selectedVoice, setSelectedVoice] = useState(availableVoices[0]);

  // Refs
  const audioRef = useRef(new Audio()); 
  const playlistRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const timerIntervalRef = useRef(null);

  // --- 1. Init Audio Event Listeners ---
  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      startAutoplayCountdown(currentIndexRef.current);
    };

    const handleError = (e) => {
      console.error("Audio Playback Error", e);
      setIsSpeaking(false);
      setIsLoading(false);
    };

    const handlePlay = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setIsLoading(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', () => setIsPaused(true));

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
    };
  }, []);

  // --- 2. Playback Logic ---
  const playAudioForArticle = useCallback(async (article) => {
      if (!article) return;

      setIsLoading(true);
      setIsSpeaking(true); 
      setIsPaused(false);
      setIsWaitingForNext(false);
      
      try {
          const textToSpeak = `${article.headline}. ${article.summary}`;

          const response = await api.streamAudio(textToSpeak, DEFAULT_VOICE_ID);
          
          const audioUrl = URL.createObjectURL(response.data);
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
          
          if ('mediaSession' in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                  title: article.headline,
                  artist: `The Gamut • ${article.source}`,
                  album: article.category || 'News Feed',
                  artwork: article.imageUrl ? [
                      { src: article.imageUrl, sizes: '512x512', type: 'image/jpeg' }
                  ] : []
              });
              navigator.mediaSession.playbackState = "playing";
          }

      } catch (error) {
          console.error("Failed to stream audio:", error);
          setIsLoading(false);
          setIsSpeaking(false);
      }
  }, []);

  // --- 3. Queue Logic ---
  const playNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex >= playlistRef.current.length) {
      stop(); 
      return;
    }
    currentIndexRef.current = nextIndex;
    const article = playlistRef.current[nextIndex];
    setCurrentArticleId(article._id);
    playAudioForArticle(article);
  }, [playAudioForArticle]);

  // --- 4. Controls ---
  const stop = useCallback(() => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsSpeaking(false);
    setIsPaused(false);
    setIsWaitingForNext(false); 
    setIsLoading(false);
    setAutoplayTimer(0);
    setCurrentArticleId(null);
    playlistRef.current = [];
    currentIndexRef.current = -1;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "none";
  }, []);

  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPaused(true);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
  }, []);

  const resume = useCallback(() => {
    audioRef.current.play();
    setIsPaused(false);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
  }, []);

  const skip = useCallback(() => {
    if (isWaitingForNext) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        playNext();
    } else {
        playNext();
    }
  }, [playNext, isWaitingForNext]);

  // --- 5. Countdown Logic ---
  const startAutoplayCountdown = useCallback((currentArticleIndex) => {
    if (currentArticleIndex >= playlistRef.current.length - 1) {
      stop();
      return;
    }
    setIsSpeaking(false); 
    setIsWaitingForNext(true);
    setAutoplayTimer(5);
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: "Up Next...", artist: "The Gamut Radio" });

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

  // --- 6. Public Triggers ---
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
    playAudioForArticle(article);
  }, [playAudioForArticle, stop]);
  
  const changeVoice = () => {}; 

  return { isSpeaking, isPaused, isWaitingForNext, autoplayTimer, currentArticleId, availableVoices, selectedVoice, changeVoice, startRadio, playSingle, stop, pause, resume, skip, cancelAutoplay, isLoading };
};

export default useNewsRadio;
