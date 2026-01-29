// src/hooks/useArticleSave.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import * as api from '../services/api';
import offlineStorage from '../services/offlineStorage';
import { useToast } from '../context/ToastContext';
import { IArticle } from '../types';

export default function useArticleSave(initialSavedIds: string[] = []) {
  const { addToast } = useToast();
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set(initialSavedIds));
  const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timers on unmount to prevent memory leaks
  useEffect(() => {
      return () => {
          pendingDeletesRef.current.forEach(timeout => clearTimeout(timeout));
      };
  }, []);

  const handleToggleSave = useCallback(async (article: IArticle) => {
    const articleId = article._id;
    const isCurrentlySaved = savedArticleIds.has(articleId);

    if (isCurrentlySaved) {
        // 1. Optimistic Remove
        setSavedArticleIds(prev => {
            const next = new Set(prev);
            next.delete(articleId);
            return next;
        });

        // 2. Remove from Offline Storage immediately
        offlineStorage.removeOfflineArticle(articleId);

        // 3. Schedule API Call (Allows Undo)
        const timeoutId = setTimeout(async () => {
            try {
                await api.saveArticle(articleId); // API toggle (save/unsave)
                pendingDeletesRef.current.delete(articleId);
            } catch (error) {
                console.error('Unsave failed:', error);
                // Rollback on failure
                setSavedArticleIds(prev => new Set(prev).add(articleId));
                addToast('Failed to sync. Article restored.', 'error');
                
                // Re-save to offline storage if server sync fails
                offlineStorage.saveOfflineArticle(article);
            }
        }, 3500);

        pendingDeletesRef.current.set(articleId, timeoutId);

        // 4. Show Toast with Undo
        addToast('Article removed', 'info', {
            label: 'UNDO',
            onClick: () => {
                const pendingTimeout = pendingDeletesRef.current.get(articleId);
                if (pendingTimeout) {
                    clearTimeout(pendingTimeout);
                    pendingDeletesRef.current.delete(articleId);
                    // Immediate Restore
                    setSavedArticleIds(prev => new Set(prev).add(articleId));
                    // Restore to Offline Storage
                    offlineStorage.saveOfflineArticle(article);
                }
            }
        });

    } else {
        // Case: Saving an article
        
        // Check if we are "Undoing" a pending delete manually (via re-click)
        if (pendingDeletesRef.current.has(articleId)) {
            clearTimeout(pendingDeletesRef.current.get(articleId)!);
            pendingDeletesRef.current.delete(articleId);
            setSavedArticleIds(prev => new Set(prev).add(articleId));
            
            // Ensure it's in offline storage
            offlineStorage.saveOfflineArticle(article);
            
            addToast('Removal cancelled', 'success');
            return;
        }

        // Standard Save
        setSavedArticleIds(prev => new Set(prev).add(articleId));

        // Trigger Offline Download (Non-blocking)
        offlineStorage.saveOfflineArticle(article);

        try {
            await api.saveArticle(articleId);
            addToast('Article saved', 'success');
        } catch (error) {
            console.error('Save failed:', error);
            // Rollback
            setSavedArticleIds(prev => {
                const next = new Set(prev);
                next.delete(articleId);
                return next;
            });
            // Cleanup offline if server failed
            offlineStorage.removeOfflineArticle(articleId);
            
            addToast('Failed to save article', 'error');
        }
    }
  }, [savedArticleIds, addToast]);

  return {
    savedArticleIds,
    handleToggleSave
  };
}
