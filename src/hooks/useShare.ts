// src/hooks/useShare.ts
import { useToast } from '../context/ToastContext';
import * as api from '../services/api';
import { IArticle } from '../types';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const useShare = () => {
  const { addToast } = useToast();

  const handleShare = async (article: IArticle) => {
    // 1. Log the share action
    api.logShare(article._id).catch(err => console.error("Log Share Error:", err));

    // 2. Construct Share Data (Backend URL for Meta Tags)
    // FIX: Robust URL construction to handle VITE_API_URL endings
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');
    // Point to /api/share (which we enabled in server.ts)
    const shareUrl = `${apiBase}/api/share/${article._id}`;
    
    const shareTitle = article.headline;
    // Appending URL to text to support WhatsApp/Text sharing better
    const shareText = `Read this on The Gamut: ${article.headline}\n${shareUrl}`;

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: 'Share to'
        });
      } else {
        if (navigator.share) {
          // Note: On some Android devices, sharing both 'text' and 'url' can be buggy.
          // WhatsApp often prefers the URL to be appended to the text.
          await navigator.share({ 
            title: shareTitle, 
            text: shareText
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          addToast('Link copied to clipboard!', 'success');
        }
      }
    } catch (err) {
      console.log('Share dismissed', err);
    }
  };

  return { handleShare };
};

export default useShare;
