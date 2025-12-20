import { useState, useRef, useCallback } from 'react';
import * as api from '../services/api';
import { useToast } from '../context/ToastContext';
import { IArticle } from '../types';

export default function useArticleSave(initialSavedIds: string[] = []) {
  const { addToast } = useToast();
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set(initialSavedIds));
  const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleToggleSave = useCallback(async (article: IArticle) => {
    const articleId = article._id;
    const isCurrentlySaved = savedArticleIds.has(articleId);

    if (isCurrentlySaved) {
        // Optimistic Remove
        setSavedArticleIds(prev => {
            const next = new Set(prev);
            next.delete(articleId);
            return next;
        });

        // Delay actual API call to allow Undo
        const timeoutId = setTimeout(async () => {
            try {
                await api.saveArticle(articleId); // API toggle (save/unsave)
                pendingDeletesRef.current.delete(articleId);
            } catch (error) {
                console.error('Unsave failed:', error);
                // Revert if API fails
                setSavedArticleIds(prev => new Set(prev).add(articleId));
            }
        }, 3500);

        pendingDeletesRef.current.set(articleId, timeoutId);

        addToast('Article removed', 'info', {
            label: 'UNDO',
            onClick: () => {
                clearTimeout(timeoutId);
                pendingDeletesRef.current.delete(articleId);
                setSavedArticleIds(prev => new Set(prev).add(articleId));
            }
        });

    } else {
        // Cancel pending delete if re-saved immediately
        if (pendingDeletesRef.current.has(articleId)) {
            clearTimeout(pendingDeletesRef.current.get(articleId)!);
            pendingDeletesRef.current.delete(articleId);
        }

        // Optimistic Add
        setSavedArticleIds(prev => new Set(prev).add(articleId));

        try {
            await api.saveArticle(articleId);
            addToast('Article saved', 'success');
        } catch (error) {
            console.error('Save failed:', error);
            // Revert
            setSavedArticleIds(prev => {
                const next = new Set(prev);
                next.delete(articleId);
                return next;
            });
            addToast('Failed to save article', 'error');
        }
    }
  }, [savedArticleIds, addToast]);

  return {
    savedArticleIds,
    handleToggleSave
  };
}
