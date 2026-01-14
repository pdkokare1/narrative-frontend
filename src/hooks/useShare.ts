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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const shareUrl = `${apiUrl}/share/${article._id}`;
    
    const shareTitle = article.headline;
    // Appending URL to text ensures it is clickable on WhatsApp/SMS
    const shareText = `Read this on The Gamut: ${article.headline}\n${shareUrl}`;

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl, // Native sheet usually handles this well separately
          dialogTitle: 'Share to'
        });
      } else {
        if (navigator.share) {
          // Web Share API
          await navigator.share({ 
            title: shareTitle, 
            text: shareText
            // We omit 'url' here because appending it to 'text' is more reliable 
            // for WhatsApp Web and Android WebViews.
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          addToast('Link copied to clipboard!', 'success');
        }
      }
    } catch (err) {
      // User cancelled share or failed
      console.log('Share dismissed', err);
    }
  };

  return { handleShare };
};

export default useShare;
