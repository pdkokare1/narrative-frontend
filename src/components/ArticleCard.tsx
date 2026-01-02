// src/components/ArticleCard.tsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  IconButton, 
  Stack, 
  Chip, 
  Tooltip,
  useTheme 
} from '@mui/material';
import { 
  Share as ShareIcon, 
  BookmarkBorder as BookmarkBorderIcon, 
  Bookmark as BookmarkIcon,
  PlayArrow as PlayArrowIcon,
  Speed as SpeedIcon,
  AccountBalance as PoliticsIcon,
  Mood as PositiveIcon,
  MoodBad as NegativeIcon,
  SentimentNeutral as NeutralIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onPlay?: (article: Article) => void;
  onShare?: (article: Article) => void;
  onBookmark?: (article: Article) => void;
  isBookmarked?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  onPlay, 
  onShare, 
  onBookmark,
  isBookmarked = false 
}) => {
  const theme = useTheme();

  // --- Helper: Data Extraction ---
  // Checks strictly for aiData nesting or root level availability
  const aiData = article.aiData || {
    biasScore: (article as any).biasScore,
    sentiment: (article as any).sentiment,
    politicalLeaning: (article as any).politicalLeaning
  };

  // --- Helper: Visual Logic ---
  const getBiasColor = (score: number) => {
    if (!score && score !== 0) return 'default';
    if (score < 30) return 'success'; // Low bias
    if (score < 70) return 'warning'; // Medium bias
    return 'error'; // High bias
  };

  const getSentimentInfo = (sentiment: string) => {
    const s = sentiment?.toLowerCase();
    if (s === 'positive') return { icon: <PositiveIcon fontSize="small" />, color: 'success' as const, label: 'Positive' };
    if (s === 'negative') return { icon: <NegativeIcon fontSize="small" />, color: 'error' as const, label: 'Negative' };
    return { icon: <NeutralIcon fontSize="small" />, color: 'default' as const, label: 'Neutral' };
  };

  const getLeaningColor = (leaning: string) => {
    const l = leaning?.toLowerCase();
    if (l?.includes('left') || l?.includes('liberal')) return '#2196f3'; // Blue
    if (l?.includes('right') || l?.includes('conservative')) return '#f44336'; // Red
    return '#9e9e9e'; // Grey (Center/Independent)
  };

  const sentimentInfo = getSentimentInfo(aiData.sentiment);
  const leaningColor = getLeaningColor(aiData.politicalLeaning);

  return (
    <Card sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      borderRadius: 3,
      boxShadow: theme.shadows[2],
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[6]
      }
    }}>
      {/* Article Image */}
      {article.urlToImage && (
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="180"
            image={article.urlToImage}
            alt={article.title}
            sx={{ objectFit: 'cover' }}
          />
          {/* Category Badge Overlay */}
          <Chip 
            label={article.category || 'News'} 
            size="small" 
            sx={{ 
              position: 'absolute', 
              top: 10, 
              left: 10, 
              backgroundColor: 'rgba(0,0,0,0.7)', 
              color: '#fff',
              backdropFilter: 'blur(4px)'
            }} 
          />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Meta Data: Source & Time */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="bold">
            {article.source.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : ''}
          </Typography>
        </Box>

        {/* Title */}
        <Typography 
          gutterBottom 
          variant="h6" 
          component="div" 
          sx={{ 
            lineHeight: 1.3, 
            fontWeight: 700,
            fontSize: '1.1rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {article.title}
        </Typography>

        {/* Smart Summary */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {article.description || "No summary available."}
        </Typography>

        {/* --- NEW: AI Analysis Metrics (Bias, Sentiment, Leaning) --- */}
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mt: 2, mb: 1 }}>
          
          {/* Bias Score */}
          {aiData.biasScore !== undefined && (
             <Tooltip title={`Bias Score: ${aiData.biasScore}/100`}>
               <Chip 
                 icon={<SpeedIcon fontSize="small" />}
                 label={`Bias: ${aiData.biasScore}`}
                 size="small"
                 color={getBiasColor(aiData.biasScore)}
                 variant="outlined"
               />
             </Tooltip>
          )}

          {/* Sentiment */}
          {aiData.sentiment && (
            <Tooltip title={`Sentiment: ${aiData.sentiment}`}>
              <Chip 
                icon={sentimentInfo.icon}
                label={sentimentInfo.label}
                size="small"
                color={sentimentInfo.color}
                variant="outlined"
              />
            </Tooltip>
          )}

          {/* Political Leaning */}
          {aiData.politicalLeaning && (
            <Tooltip title={`Political Leaning: ${aiData.politicalLeaning}`}>
              <Chip 
                icon={<PoliticsIcon fontSize="small" style={{ color: leaningColor }} />}
                label={aiData.politicalLeaning}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: leaningColor,
                  color: leaningColor,
                  '& .MuiChip-label': { color: leaningColor }
                }}
              />
            </Tooltip>
          )}
        </Stack>

      </CardContent>

      {/* Actions Footer */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0' }}>
        <IconButton size="small" onClick={() => onPlay && onPlay(article)} color="primary">
          <PlayArrowIcon />
        </IconButton>
        
        <Box>
          <IconButton size="small" onClick={() => onShare && onShare(article)}>
            <ShareIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onBookmark && onBookmark(article)}>
            {isBookmarked ? <BookmarkIcon color="primary" fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default ArticleCard;
