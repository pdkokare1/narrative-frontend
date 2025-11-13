// In file: src/utils/helpers.js

/**
 * Returns the correct CSS class for a sentiment string.
 * @param {string} sentiment - 'Positive', 'Negative', or 'Neutral'
 * @returns {string} - 'sentiment-positive', 'sentiment-negative', or 'sentiment-neutral'
 */
export const getSentimentClass = (sentiment) => {
  if (sentiment === 'Positive') return 'sentiment-positive';
  if (sentiment === 'Negative') return 'sentiment-negative';
  return 'sentiment-neutral';
};

/**
 * Returns the tooltip text for a given analysis breakdown label.
 * @param {string} label - The label of the component (e.g., "Sentiment Polarity")
 * @returns {string} - The explanation text.
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
  return tooltips[label] || label; // Return explanation or the label itself as fallback
};
