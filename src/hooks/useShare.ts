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

    // 2. Construct Share Data
    // FIXED: Do not strip '/api'. The share route is hosted on the backend API.
    // e.g., https://narrative-backend.railway.app/api/share/123
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const shareUrl = `${apiUrl}/share/${article._id}`;
    
    const shareTitle = article.headline;
    const shareText = `Read this on The Gamut: ${article.headline}`;

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
          await navigator.share({ 
            title: shareTitle, 
            text: shareText, 
            url: shareUrl 
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
