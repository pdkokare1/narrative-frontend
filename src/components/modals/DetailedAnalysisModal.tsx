// src/components/modals/DetailedAnalysisModal.tsx
import React, { useState } from 'react';
import '../../App.css'; 
import { getBreakdownTooltip, getSentimentClass } from '../../utils/helpers'; 
import { IArticle } from '../../types';
import Button from '../ui/Button';

interface AnalysisModalProps {
  article: IArticle | null;
  onClose: () => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

// --- Detailed Analysis Modal ---
const DetailedAnalysisModal: React.FC<AnalysisModalProps> = ({ article, onClose, showTooltip }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown'>('overview');

  if (!article) return null;

  const handleOverlayClick = (e: React.MouseEvent) => { 
    if (e.target === e.currentTarget) onClose(); 
  };
  
  const isReview = article.analysisType === 'SentimentOnly';

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px' }}>
            {article.headline.substring(0, 60)}{article.headline.length > 60 ? '...' : ''}
          </h2>
          <button className="close-btn" onClick={onClose} title="Close">×</button>
        </div>
        
        {!isReview && (
          <div className="modal-tabs">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={activeTab === 'breakdown' ? 'active' : ''} onClick={() => setActiveTab('breakdown')}>Breakdown</button>
          </div>
        )}

        <div className="modal-content">
          {isReview ? ( 
            <ReviewOverviewTab article={article} showTooltip={showTooltip} /> 
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab article={article} showTooltip={showTooltip} />}
              {activeTab === 'breakdown' && <OverviewBreakdownTab article={article} showTooltip={showTooltip} />}
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>Close Report</Button>
        </div>
      </div>
    </div>
  );
};

// --- Analysis Tab Components --- (Unchanged logic, just keeping structure)

const ReviewOverviewTab: React.FC<{ article: IArticle; showTooltip: any }> = ({ article, showTooltip }) => {
  return ( 
    <div className="tab-content review-tab-content"> 
      <h3 className="review-type-label"> Opinion / Review Analysis </h3> 
      <p className="review-explainer"> 
        This article is identified as an opinion, review, or summary. A full bias and credibility analysis is not applicable. 
      </p> 
      <div 
        className="score-circle large-centered" 
        title="The article's overall sentiment towards its main subject." 
        onClick={(e) => showTooltip("The article's overall sentiment towards its main subject.", e)}
      > 
        <div className={`score-value large ${getSentimentClass(article.sentiment)}`}> {article.sentiment} </div> 
        <div className="score-label">Overall Sentiment</div> 
      </div> 
    </div> 
  );
};

const OverviewTab: React.FC<{ article: IArticle; showTooltip: any }> = ({ article, showTooltip }) => {
  const hasFindings = article.keyFindings && article.keyFindings.length > 0;
  const hasRecs = article.recommendations && article.recommendations.length > 0;

  return ( 
    <div className="tab-content"> 
      <div className="overview-grid"> 
        <ScoreBox label="Trust Score" value={article.trustScore} showTooltip={showTooltip} /> 
        <ScoreBox label="Bias Score" value={article.biasScore} showTooltip={showTooltip} /> 
        <ScoreBox label="Credibility" value={article.credibilityScore} showTooltip={showTooltip} /> 
        <ScoreBox label="Reliability" value={article.reliabilityScore} showTooltip={showTooltip} /> 
      </div> 

      {hasFindings && ( 
        <div className="recommendations"> 
          <h4>KEY FINDINGS</h4> 
          <ul> {article.keyFindings!.map((finding, i) => <li key={`kf-${i}`}>{finding}</li>)} </ul> 
        </div> 
      )} 
      
      {hasRecs && ( 
        <div className="recommendations"> 
          <h4>RECOMMENDATIONS</h4> 
          <ul> {article.recommendations!.map((rec, i) => <li key={`rec-${i}`}>{rec}</li>)} </ul> 
        </div> 
      )} 
      
      {!hasFindings && !hasRecs && ( 
        <p className="no-findings-msg"> No specific key findings or recommendations were generated. </p> 
      )} 
    </div> 
  );
};

const OverviewBreakdownTab: React.FC<{ article: IArticle; showTooltip: any }> = ({ article, showTooltip }) => {
  const [showZeroScores, setShowZeroScores] = useState(false);
  const biasComps = article.biasComponents || {};
  const credComps = article.credibilityComponents || {};
  const relComps = article.reliabilityComponents || {};

  const biasList = [
    { l: "Sentiment Polarity", k: "sentimentPolarity" },
    { l: "Emotional Language", k: "emotionalLanguage" },
    { l: "Loaded Terms", k: "loadedTerms" },
    { l: "Complexity Bias", k: "complexityBias" },
    { l: "Source Diversity", k: "sourceDiversity" },
    { l: "Expert Balance", k: "expertBalance" },
    { l: "Attribution Transparency", k: "attributionTransparency" },
    { l: "Gender Balance", k: "genderBalance" },
    { l: "Racial Balance", k: "racialBalance" },
    { l: "Age Representation", k: "ageRepresentation" },
    { l: "Headline Framing", k: "headlineFraming" },
    { l: "Story Selection", k: "storySelection" },
    { l: "Omission Bias", k: "omissionBias" }
  ];

  const flatBias = { ...biasComps.linguistic, ...biasComps.sourceSelection, ...biasComps.demographic, ...biasComps.framing };
  
  const allBias = biasList.map(item => ({ label: item.l, value: Number(flatBias[item.k]) || 0 }));
  const allCred = Object.entries(credComps).map(([k, v]) => ({ label: camelToTitle(k), value: Number(v) || 0 }));
  const allRel = Object.entries(relComps).map(([k, v]) => ({ label: camelToTitle(k), value: Number(v) || 0 }));
  
  const visibleBias = allBias.filter(c => c.value > 0 || showZeroScores);
  const visibleCred = allCred.filter(c => c.value > 0 || showZeroScores);
  const visibleRel = allRel.filter(c => c.value > 0 || showZeroScores);
  
  return ( 
    <div className="tab-content"> 
      <div className="component-section"> 
        <div className="component-section-header"> 
          <h4>Bias Details ({article.biasScore ?? 'N/A'}/100)</h4> 
          <div className="toggle-zero-scores"> 
            <label> <input type="checkbox" checked={showZeroScores} onChange={() => setShowZeroScores(!showZeroScores)} /> Show 0 Scores </label> 
          </div> 
        </div> 
        <div className="divider" /> 
        <div className="component-grid-v2 section-spacing"> 
          {visibleBias.length > 0 ? ( 
            visibleBias.map(comp => <CircularProgressBar key={comp.label} label={comp.label} value={comp.value} tooltip={getBreakdownTooltip(comp.label)} showTooltip={showTooltip} /> ) 
          ) : ( <p className="zero-score-note">All bias components scored 0. Enable toggle to see them.</p> )} 
        </div> 
      </div> 

      <div className="component-section"> 
        <div className="component-section-header"><h4>Credibility Details ({article.credibilityScore ?? 'N/V'}/100)</h4></div> 
        <div className="divider" /> 
        <div className="component-grid-v2 section-spacing"> 
          {visibleCred.length > 0 ? ( 
            visibleCred.map(comp => <CircularProgressBar key={comp.label} label={comp.label} value={comp.value} tooltip={getBreakdownTooltip(comp.label)} showTooltip={showTooltip} /> ) 
          ) : ( <p className="zero-score-note">All credibility components scored 0. Enable toggle to see them.</p> )} 
        </div> 
      </div> 

      <div className="component-section"> 
        <div className="component-section-header"><h4>Reliability Details ({article.reliabilityScore ?? 'N/V'}/100)</h4></div> 
        <div className="divider" /> 
        <div className="component-grid-v2 section-spacing"> 
          {visibleRel.length > 0 ? ( 
            visibleRel.map(comp => <CircularProgressBar key={comp.label} label={comp.label} value={comp.value} tooltip={getBreakdownTooltip(comp.label)} showTooltip={showTooltip} /> ) 
          ) : ( <p className="zero-score-note">All reliability components scored 0. Enable toggle to see them.</p> )} 
        </div> 
      </div> 
    </div> 
  );
};

function camelToTitle(str: string) {
  const result = str.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

const ScoreBox: React.FC<{ label: string; value: number | undefined; showTooltip: any }> = ({ label, value, showTooltip }) => { 
  let tooltip = ''; 
  switch(label) { 
    case 'Trust Score': tooltip = 'Overall Trust Score (0-100). Higher is better.'; break; 
    case 'Bias Score': tooltip = 'Overall Bias Score (0-100). Less is better.'; break; 
    case 'Credibility': tooltip = 'Credibility Score (0-100).'; break; 
    case 'Reliability': tooltip = 'Reliability Score (0-100).'; break; 
    default: tooltip = `${label} (0-100)`; 
  } 
  return ( 
    <div className="score-circle" title={tooltip} onClick={(e) => showTooltip(tooltip, e)}> 
      <div className="score-value" style={{ fontFamily: 'var(--font-heading)' }}>{value ?? 'N/A'}</div> 
      <div className="score-label">{label}</div> 
    </div> 
  ); 
};

const CircularProgressBar: React.FC<{ label: string; value: number; tooltip?: string; showTooltip: any }> = ({ label, value, tooltip, showTooltip }) => { 
  const numericValue = Math.max(0, Math.min(100, Number(value) || 0)); 
  const strokeWidth = 6; 
  const radius = 42; 
  const circumference = 2 * Math.PI * radius; 
  const offset = circumference - (numericValue / 100) * circumference; 
  
  const strokeColor = 'var(--accent-primary)'; 
  const finalTooltip = tooltip || `${label}: ${numericValue}/100`; 

  return ( 
    <div className="circle-progress-container" title={finalTooltip} onClick={(e) => showTooltip(finalTooltip, e)}> 
      <svg className="circle-progress-svg" width="100" height="100" viewBox="0 0 100 100"> 
        <circle className="circle-progress-bg" stroke="var(--bg-elevated)" strokeWidth={strokeWidth} fill="transparent" r={radius} cx="50" cy="50" /> 
        {numericValue > 0 && ( 
          <circle 
            className="circle-progress-bar" 
            stroke={strokeColor} 
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
            fill="transparent" 
            r={radius} 
            cx="50" 
            cy="50" 
            transform="rotate(-90 50 50)" 
          /> 
        )} 
        <text x="50" y="52" className="circle-progress-text-value" dominantBaseline="middle" textAnchor="middle" style={{ fontFamily: 'var(--font-heading)' }}> 
          {numericValue} 
        </text> 
      </svg> 
      <div className="circle-progress-label">{label}</div> 
    </div> 
  ); 
};

export default DetailedAnalysisModal;
