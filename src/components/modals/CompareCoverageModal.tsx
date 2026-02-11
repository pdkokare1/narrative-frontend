// src/components/modals/CompareCoverageModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  useTheme,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Timeline as TimelineIcon,
  Article as ArticleIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useQuery } from '@tanstack/react-query';
import { getCoverageAnalysis } from '../../services/articleService'; // Ensure named import
import { format } from 'date-fns';
import { Browser } from '@capacitor/browser'; // NEW: Import Browser plugin

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface CompareCoverageModalProps {
  open: boolean;
  onClose: () => void;
  articleId?: string | null;
  clusterId?: number | null; 
  articleTitle?: string;
  onAnalyze?: (article: any) => void;
  showTooltip?: (text: string, e: any) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coverage-tabpanel-${index}`}
      aria-labelledby={`coverage-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CompareCoverageModal: React.FC<CompareCoverageModalProps> = ({
  open,
  onClose,
  articleId,
  articleTitle
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Fetch coverage data
  const { data, isLoading, error } = useQuery({
    queryKey: ['coverage', articleId],
    queryFn: () => getCoverageAnalysis(articleId!),
    enabled: open && !!articleId,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Process data for Chart
  const chartData = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return null;

    return {
      datasets: [
        {
          label: 'Coverage Sentiment',
          data: data.timeline.map((item: any) => ({
            x: new Date(item.publishedAt),
            y: item.sentimentScore // -1 to 1
          })),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3
        }
      ]
    };
  }, [data, theme]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        min: -1,
        max: 1,
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          callback: (value) => {
            if (value === 1) return 'Positive';
            if (value === -1) return 'Negative';
            if (value === 0) return 'Neutral';
            return '';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          // FIX: Check for null value to satisfy strict type checking
          label: (context) => {
            const val = context.parsed.y;
            return val !== null ? `Sentiment: ${val.toFixed(2)}` : '';
          }
        }
      }
    }
  };

  // Filter articles based on Tab (Left, Center, Right)
  const getArticlesByBias = (bias: string) => {
    if (!data?.articles) return [];
    if (bias === 'all') return data.articles;
    // Normalize comparison to handle 'LEFT', 'Left', 'left'
    return data.articles.filter((article: any) => 
      article.bias?.toLowerCase() === bias.toLowerCase()
    );
  };

  const renderArticleList = (articles: any[]) => {
    if (articles.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body1">No articles found for this category.</Typography>
        </Box>
      );
    }

    return (
      <List>
        {articles.map((article: any, index: number) => (
          <React.Fragment key={article.id || index}>
            <ListItem
              alignItems="flex-start"
              secondaryAction={
                // UPDATED: Use Browser.open instead of href
                <IconButton 
                  edge="end" 
                  onClick={() => Browser.open({ url: article.url })}
                >
                  <LaunchIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={article.title}
                secondary={
                  <Box component="span" sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                    <Typography component="span" variant="caption" color="text.secondary">
                      {article.source}
                    </Typography>
                    <Typography component="span" variant="caption" color="text.secondary">
                      • {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                    </Typography>
                    <Chip 
                      label={article.bias} 
                      size="small" 
                      color={
                        article.bias?.toLowerCase() === 'left' ? 'primary' :
                        article.bias?.toLowerCase() === 'right' ? 'error' : 'default'
                      }
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                }
              />
            </ListItem>
            {index < articles.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Coverage Analysis</Typography>
          {articleTitle && (
            <Typography variant="subtitle2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
              {articleTitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error">Failed to load coverage data.</Typography>
            <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>Retry</Button>
          </Box>
        ) : !data || (!data.timeline && !data.articles) ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No coverage data available for this topic yet.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Timeline Section */}
            <Box sx={{ mb: 4, height: 250 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Coverage Timeline</Typography>
              </Box>
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Not enough data for timeline</Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Articles by Bias Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ArticleIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Sources by Bias</Typography>
              </Box>
              
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="All" />
                <Tab label="Left" />
                <Tab label="Center" />
                <Tab label="Right" />
              </Tabs>

              <CustomTabPanel value={tabValue} index={0}>
                {renderArticleList(getArticlesByBias('all'))}
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={1}>
                {renderArticleList(getArticlesByBias('left'))}
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={2}>
                {renderArticleList(getArticlesByBias('center'))}
              </CustomTabPanel>
              <CustomTabPanel value={tabValue} index={3}>
                {renderArticleList(getArticlesByBias('right'))}
              </CustomTabPanel>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompareCoverageModal;
