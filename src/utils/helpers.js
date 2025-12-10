{
type: uploaded file
fileName: helpers.js
fullContent:
// In file: src/utils/helpers.js

/**
 * Returns display details for a sentiment value.
 * Maps backend "Positive/Negative" to frontend "Supportive/Critical".
 * @param {string} sentiment - 'Positive', 'Negative', or 'Neutral'
 * @returns {object} - { label: string, className: string, icon: string }
 */
export const getSentimentInfo = (sentiment) => {
  if (!sentiment) return { label: 'Neutral', className: 'sentiment-neutral', icon: '' };
  
  const lower = sentiment.toLowerCase();
  
  if (lower === 'positive') {
    return { label: 'Supportive', className: 'sentiment-positive', icon: '嶋' };
  }
  if (lower === 'negative') {
    return { label: 'Critical', className: 'sentiment-negative', icon: '悼' };
  }
  return { label: 'Neutral', className: 'sentiment-neutral', icon: '' };
};

/**
 * Returns the correct CSS class for a sentiment string (Legacy support).
 */
export const getSentimentClass = (sentiment) => {
  return getSentimentInfo(sentiment).className;
};

/**
 * Checks if an article is likely an Opinion/Op-Ed piece.
 */
export const isOpinion = (article) => {
  if (!article) return false;
  const cat = (article.category || '').toLowerCase();
  const headline = (article.headline || '').toLowerCase();
  
  return (
    cat.includes('opinion') || 
    cat.includes('editorial') || 
    cat.includes('commentary') ||
    cat.includes('perspective') ||
    headline.startsWith('opinion:') ||
    headline.includes(' op-ed ')
  );
};

/**
 * Returns the tooltip text for a given analysis breakdown label.
 */
export const getBreakdownTooltip = (label) => {
  const tooltips = {
    "Sentiment Polarity": "Measures the overall positive, negative, or neutral leaning of the language used.",
    "Emotional Language": "Detects the prevalence of words intended to evoke strong emotional responses.",
    "Loaded Terms": "Identifies words or phrases with strong connotations beyond their literal meaning.",
    "Complexity Bias": "Assesses if overly complex or simplistic language is used to obscure or mislead.",
    "Source Diversity": "Evaluates the variety of sources cited (e.g., political, expert, eyewitness).",
    "Expert Balance": "Checks if experts from different perspectives are represented fairly.",
    "Attribution Transparency": "Assesses how clearly sources are identified and attributed.",
    "Gender Balance": "Measures the representation of different genders in sources and examples.",
    "Racial Balance": "Measures the representation of different racial or ethnic groups.",
    "Age Representation": "Checks for biases related to age groups in reporting.",
    "Headline Framing": "Analyzes if the headline presents a neutral or skewed perspective of the story.",
    "Story Selection": "Considers if the choice of this story over others indicates a potential bias.",
    "Omission Bias": "Evaluates if significant facts or contexts are left out, creating a misleading picture.",
    "Source Credibility": "Assesses the reputation and track record of the news source itself.",
    "Fact Verification": "Evaluates the rigor of the fact-checking processes evident in the article.",
    "Professionalism": "Measures adherence to journalistic standards like objectivity and transparency.",
    "Evidence Quality": "Assesses the strength and reliability of the data and evidence presented.",
    "Transparency": "Evaluates openness about sources, funding, and potential conflicts of interest.",
    "Audience Trust": "Considers public perception and trust metrics associated with the source (if available).",
    "Consistency": "Measures the source's consistency in accuracy and quality over time.",
    "Temporal Stability": "Evaluates the source's track record and how long it has been operating reliably.",
    "Quality Control": "Assesses the internal editorial review and error correction processes.",
    "Publication Standards": "Evaluates adherence to established journalistic codes and ethics.",
    "Corrections Policy": "Assesses the clarity, visibility, and timeliness of corrections for errors.",
    "Update Maintenance": "Measures how well the source updates developing stories with new information.",
  };
  return tooltips[label] || label;
};

/**
 * NEW: Generates a Cloudinary Fetch URL for optimized image delivery.
 * This proxies external images through Cloudinary to resize and compress them.
 * * @param {string} originalUrl - The source URL of the image.
 * @param {number} width - The desired width (default 600px).
 * @returns {string} - The optimized URL or the original if config is missing.
 */
export const getOptimizedImageUrl = (originalUrl, width = 600) => {
  if (!originalUrl) return null;

  // 1. If it's already a Cloudinary URL (e.g. our own assets), return as is.
  if (originalUrl.includes('cloudinary.com')) return originalUrl;

  // 2. Get Cloud Name from Environment Variables
  // You need to add REACT_APP_CLOUDINARY_CLOUD_NAME to your Vercel/Env variables.
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

  // 3. Fallback: If no cloud name is set, return the original URL so the app doesn't break.
  if (!cloudName) {
    return originalUrl;
  }

  // 4. Construct Fetch URL
  // w_{width} = Resize to width
  // f_auto = Auto format (WebP/AVIF)
  // q_auto = Auto quality (compression)
  return `https://res.cloudinary.com/${cloudName}/image/fetch/w_${width},f_auto,q_auto/${originalUrl}`;
};

}
