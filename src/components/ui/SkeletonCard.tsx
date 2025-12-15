// src/jobs/newsFetcher.ts
import newsService from '../services/newsService';
import gatekeeper from '../services/gatekeeperService'; 
import aiService from '../services/aiService'; 
import clusteringService from '../services/clusteringService';
import Article from '../models/articleModel';
import logger from '../utils/logger'; 
import { IArticle } from '../types';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- PIPELINE STEPS ---

async function isDuplicate(url: string): Promise<boolean> {
    if (!url) return true;
    return await Article.exists({ url }) !== null;
}

async function findExistingAnalysis(embedding: number[] | undefined, country: string = 'Global') {
    if (!embedding) return null;
    return await clusteringService.findSemanticDuplicate(embedding, country);
}

// --- MAIN PROCESSOR ---

async function processSingleArticle(article: any): Promise<string> {
    try {
        if (!article?.url || !article?.title) return 'ERROR_INVALID';
        
        // 1. Quick Dedupe
        if (await isDuplicate(article.url)) return 'DUPLICATE_URL';

        // 2. Gatekeeper (Junk Filter)
        const gatekeeperResult = await gatekeeper.evaluateArticle(article);
        if (gatekeeperResult.isJunk) return 'JUNK_CONTENT';

        const isSoftNews = gatekeeperResult.type === 'Soft News';
        logger.info(`🔍 Processing [${gatekeeperResult.type}]: "${article.title.substring(0, 30)}..."`);

        let embedding: number[] | null = null;
        let analysis: Partial<IArticle>;
        let isSemanticSkip = false;

        // 3. OPTIMIZATION: Only generate embedding for Hard News
        if (!isSoftNews) {
            const textToEmbed = `${article.title}. ${article.description}`;
            embedding = await aiService.createEmbedding(textToEmbed);

            // 4. Semantic Search (Only for Hard News)
            const existingMatch = await findExistingAnalysis(embedding || undefined, 'Global');
            
            if (existingMatch) {
                logger.info(`💰 Cost Saver! Inheriting analysis from: "${existingMatch.headline.substring(0,20)}..."`);
                isSemanticSkip = true;
                
                analysis = {
                    summary: existingMatch.summary, 
                    category: existingMatch.category,
                    politicalLean: existingMatch.politicalLean, 
                    biasScore: existingMatch.biasScore,
                    trustScore: existingMatch.trustScore,
                    sentiment: existingMatch.sentiment,
                    analysisType: existingMatch.analysisType || 'Full', 
                    clusterTopic: existingMatch.clusterTopic,
                    country: 'Global',
                    clusterId: existingMatch.clusterId,
                };
            }
        }

        // 5. AI Analysis (If not inherited)
        // @ts-ignore
        if (!analysis) {
            // SOFT NEWS SKIP: Use 'Basic' mode and skip expensive fields
            const analysisMode = isSoftNews ? 'Basic' : 'Full';
            const targetModel = isSoftNews ? 'gemini-2.5-flash' : gatekeeperResult.recommendedModel;
            
            analysis = await aiService.analyzeArticle(article, targetModel, analysisMode);
        }

        // 6. Construct & Save
        const newArticleData: Partial<IArticle> = {
            headline: article.title,
            summary: analysis.summary || "Summary Unavailable",
            source: article.source?.name,
            category: analysis.category || "General", 
            politicalLean: analysis.politicalLean || "Not Applicable",
            url: article.url,
            imageUrl: article.urlToImage,
            publishedAt: article.publishedAt,
            analysisType: analysis.analysisType || (isSoftNews ? 'SentimentOnly' : 'Full'),
            sentiment: analysis.sentiment || 'Neutral',
            
            biasScore: analysis.biasScore || 0,
            credibilityScore: analysis.credibilityScore || 0,
            reliabilityScore: analysis.reliabilityScore || 0,
            trustScore: analysis.trustScore || 0,
            
            clusterTopic: analysis.clusterTopic,
            country: analysis.country || 'Global',
            primaryNoun: analysis.primaryNoun,
            secondaryNoun: analysis.secondaryNoun,
            clusterId: analysis.clusterId, 
            
            analysisVersion: isSemanticSkip ? '3.5-Inherited' : (isSoftNews ? '3.5-Basic' : '3.5-Full'),
            embedding: embedding || []
        };
        
        // Final Cluster Check (Only for Hard News with embedding)
        if (!newArticleData.clusterId && embedding) {
            newArticleData.clusterId = await clusteringService.assignClusterId(newArticleData, embedding || undefined);
        }
        
        await Article.create(newArticleData);
        return isSemanticSkip ? 'SAVED_SEMANTIC' : 'SAVED_FRESH';

    } catch (error: any) {
        logger.error(`❌ Article Pipeline Error: ${error.message}`);
        return 'ERROR_PIPELINE';
    }
}

async function fetchAndAnalyzeNews() {
  logger.info('🔄 Job Started: Fetching news...');
  
  const stats = {
      totalFetched: 0, savedFresh: 0, savedSemantic: 0,
      duplicates: 0, junk: 0, errors: 0
  };

  try {
    const rawArticles = await newsService.fetchNews(); 
    if (!rawArticles || rawArticles.length === 0) {
        logger.warn('Job: No new articles found.');
        return stats; 
    }

    stats.totalFetched = rawArticles.length;
    logger.info(`📡 Fetched ${stats.totalFetched} articles. Starting Pipeline...`);

    const BATCH_SIZE = 5; 
    for (let i = 0; i < rawArticles.length; i += BATCH_SIZE) {
        const batch = rawArticles.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(article => processSingleArticle(article)));
        
        results.forEach(res => {
            if (res === 'SAVED_FRESH') stats.savedFresh++;
            else if (res === 'SAVED_SEMANTIC') stats.savedSemantic++;
            else if (res === 'DUPLICATE_URL') stats.duplicates++;
            else if (res === 'JUNK_CONTENT') stats.junk++;
            else stats.errors++;
        });
        
        if (i + BATCH_SIZE < rawArticles.length) await sleep(1000); 
    }

    logger.info('Job Complete: Summary', { stats });
    return stats;

  } catch (error: any) {
    logger.error(`❌ Job Critical Failure: ${error.message}`);
    throw error; 
  }
}

export default { run: fetchAndAnalyzeNews };
