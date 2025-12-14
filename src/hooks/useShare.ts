// src/hooks/useShare.ts
import { useToast } from '../context/ToastContext';
import * as api from '../services/api';
import { IArticle } from '../types';

const useShare = () => {
  const { addToast } = useToast();

  const handleShare = (article: IArticle) => {
    // 1. Log the share action
    api.logShare(article._id).catch(err => console.error("Log Share Error:", err));

    // 2. Construct the Proxy URL
    // We take the API URL (e.g., https://api.thegamut.in/api) and remove '/api' to get the root
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, ''); // Removes '/api' or '/api/' from end
    const shareUrl = `${baseUrl}/share/${article._id}`;

    // 3. Trigger Native Share or Copy to Clipboard
    if (navigator.share) {
      navigator.share({ 
        title: article.headline, 
        text: `Read this on The Gamut: ${article.headline}`, 
        url: shareUrl 
      })
      .catch((err) => console.log('Share dismissed', err));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => addToast('Link copied to clipboard!', 'success'))
        .catch(() => addToast('Failed to copy link.', 'error'));
    }
  };

  return { handleShare };
};

export default useShare;
