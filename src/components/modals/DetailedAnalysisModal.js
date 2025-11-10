// In file: src/components/modals/DetailedAnalysisModal.js
import React, { useState } from 'react';
import '../../App.css'; // For modal styles
import { getBreakdownTooltip, getSentimentClass } from '../../utils/helpers'; // <-- IMPORT PATH CORRECTED

// --- Detailed Analysis Modal ---
function DetailedAnalysisModal({ article, onClose, showTooltip }) {
  const [activeTab, setActiveTab] = useState('overview');
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) { onClose(); } };
  if (!article) { 
      return null; // Or some error state
  }
  const isReview = article.analysisType === 'SentimentOnly';

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{article.headline.substring(0, 60)}{article.headline.length > 60 ? '...' : ''}</h2>
          <button className="close-btn" onClick={onClose} title="Close analysis">×</button>
        </div>
        {!isReview && (
          <div className="modal-tabs">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={activeTab === 'breakdown' ? 'active' : ''} onClick={() => setActiveTab('breakdown')}>Breakdown</button>
          </div>
        )}
        <div className="modal-content">
          {isReview ? ( <ReviewOverviewTab article={article} showTooltip={showTooltip} /> )
          : (
            <>
              {activeTab === 'overview' && <OverviewTab article={article} showTooltip={showTooltip} />}
              {activeTab === 'breakdown' && <OverviewBreakdownTab article={article} showTooltip={showTooltip} />}
            </>
          )}
        </div>
        <div className="modal-footer"><button onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

// --- Analysis Tab Components ---

function ReviewOverviewTab({ article, showTooltip }) {
  // getSentimentClass is now imported from helpers
  return ( 
    <div className="tab-content" style={{ textAlign: 'center', padding: '20px' }}> 
      <h3 style={{ color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}> Opinion / Review Analysis </h3> 
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '450px', margin: '10px auto 25px auto' }}> This article is identified as an opinion, review, or summary. A full bias and credibility analysis is not applicable. </p> 
      <div className="score-circle" style={{ maxWidth: '200px', margin: '0 auto' }} title="The article's overall sentiment towards its main subject." onClick={(e) => showTooltip("The article's overall sentiment towards its main subject.", e)}> 
        <div className={`score-value ${getSentimentClass(article.sentiment)}`} style={{ fontSize: '28px' }}> {article.sentiment} </div> 
        <div className="score-label">Overall Sentiment</div> 
      </div> 
    </div> 
  );
}

function OverviewTab({ article, showTooltip }) {
  return ( 
    <div className="tab-content"> 
      <div className="overview-grid"> 
        <ScoreBox label="Trust Score" value={article.trustScore} showTooltip={showTooltip} /> 
        <ScoreBox label="Bias Score" value={article.biasScore} showTooltip={showTooltip} /> 
        <ScoreBox label="Credibility" value={article.credibilityScore} showTooltip={showTooltip} /> 
        <ScoreBox label="Reliability" value={article.reliabilityScore} showTooltip={showTooltip} /> 
      </div> 
      {article.keyFindings && article.keyFindings.length > 0 && ( 
        <div className="recommendations"> 
          <h4>Key Findings</h4> 
          <ul> {article.keyFindings.map((finding, i) => <li key={`kf-${i}`}>{finding}</li>)} </ul> 
        </div> 
      )} 
      {article.recommendations && article.recommendations.length > 0 && ( 
        <div className="recommendations" style={{ marginTop: '20px' }}> 
          <h4>Recommendations</h4> 
          <ul> {article.recommendations.map((rec, i) => <li key={`rec-${i}`}>{rec}</li>)} </ul> 
        </div> 
      )} 
      {(!article.keyFindings || article.keyFindings.length === 0) && (!article.recommendations || article.recommendations.length === 0) && ( 
        <p style={{color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '30px'}}> No specific key findings or recommendations were generated. </p> 
      )} 
    </div> 
  );
}

function OverviewBreakdownTab({ article, showTooltip }) {
  const [showZeroScores, setShowZeroScores] = useState(false);
  const biasComps = article.biasComponents || {};
  const allBiasComponents = [ { label: "Sentiment Polarity", value: biasComps.linguistic?.sentimentPolarity }, { label: "Emotional Language", value: biasComps.linguistic?.emotionalLanguage }, { label: "Loaded Terms", value: biasComps.linguistic?.loadedTerms }, { label: "Complexity Bias", value: biasComps.linguistic?.complexityBias }, { label: "Source Diversity", value: biasComps.sourceSelection?.sourceDiversity }, { label: "Expert Balance", value: biasComps.sourceSelection?.expertBalance }, { label: "Attribution Transparency", value: biasComps.sourceSelection?.attributionTransparency }, { label: "Gender Balance", value: biasComps.demographic?.genderBalance }, { label:"Racial Balance", value: biasComps.demographic?.racialBalance }, { label: "Age Representation", value: biasComps.demographic?.ageRepresentation }, { label: "Headline Framing", value: biasComps.framing?.headlineFraming }, { label: "Story Selection", value: biasComps.framing?.storySelection }, { label: "Omission Bias", value: biasComps.framing?.omissionBias }, ].map(c => ({ ...c, value: Number(c.value) || 0 }));
  const credComps = article.credibilityComponents || {};
  const allCredibilityComponents = [ { label: "Source Credibility", value: credComps.sourceCredibility }, { label: "Fact Verification", value: credComps.factVerification }, { label: "Professionalism", value: credComps.professionalism }, { label: "Evidence Quality", value: credComps.evidenceQuality }, { label: "Transparency", value: credComps.transparency }, { label: "Audience Trust", value: credComps.audienceTrust }, ].map(c => ({ ...c, value: Number(c.value) || 0 }));
  const relComps = article.reliabilityComponents || {};
  const allReliabilityComponents = [ { label: "Consistency", value: relComps.consistency }, { label: "Temporal Stability", value: relComps.temporalStability }, { label: "Quality Control", value: relComps.qualityControl }, { label: "Publication Standards", value: relComps.publicationStandards }, { label: "Corrections Policy", value: relComps.correctionsPolicy }, { label: "Update Maintenance", value: relComps.updateMaintenance }, ].map(c => ({ ...c, value: Number(c.value) || 0 }));
  
  // getBreakdownTooltip is now imported from helpers
  const visibleBias = allBiasComponents.filter(c => c.value > 0 || showZeroScores);
  const visibleCredibility = allCredibilityComponents.filter(c => c.value > 0 || showZeroScores);
  const visibleReliability = allReliabilityComponents.filter(c => c.value > 0 || showZeroScores);
  
  return ( 
    <div className="tab-content"> 
      <div className="component-section"> 
        <div className="component-section-header"> 
          <h4>Bias Details ({article.biasScore ?? 'N/A'}/100)</h4> 
          <div className="toggle-zero-scores"> <label> <input type="checkbox" checked={showZeroScores} onChange={() => setShowZeroScores(!showZeroScores)} /> Show Parameters Not Scored </label> </div> 
        </div> 
        <div className="divider" /> 
        <div className="component-grid-v2 section-spacing"> 
          {visibleBias.length > 0 ? ( visibleBias.map(comp => ( <CircularProgressBar key={comp.label} label={comp.label} value={comp.value} tooltip={getBreakdownTooltip(comp.label)} showTooltip={showTooltip} /> )) ) : ( <p className="zero-score-note">All bias components scored 0. Enable toggle to see them.</p> )} 
        </div> 
      </div> 
      <div className="component-section"> 
        <div className="component-section-header"> 
          <h4>Credibility Details ({article.credibilityScore ?? 'N/V'}/100)</h4> 
        </div> 
        <div className="divider" /> 
        <div className="component-grid-v2 section-spacing"> 
          {visibleCredibility.length > 0 ? ( visibleCredibility.map(comp => ( <CircularProgressBar key={comp.label} label={comp.label} value={comp.value} tooltip={getBreakdownTooltip(comp.label)} showTooltip={showTooltip} /> )) ) : ( <p className="zero-score-note">All credibility components scored 0. Enable toggle to see them.</p> )} 
        </div> 
      </div> 
      <div className="component-section"> 
        <div className="component-section-header"> 
          <h4>Reliability Details ({article.reliabilityScore ?? 'N/V'}/100)</h4> 
        </div> 
        <div className="divider" /> 
        <div className="component-grid-v2 section-spacing"> 
          {visibleReliability.length > 0 ? ( visibleReliability.map(comp => ( <CircularProgressBar key={comp.label} label={comp.label} value={comp.value} tooltip={getBreakdownTooltip(comp.label)} showTooltip={showTooltip} /> )) ) : ( <p className="zero-score-note">All reliability components scored 0. Enable toggle to see them.</p> )} 
        </div> 
      </div> 
    </div> 
  );
}


// --- Reusable UI Components ---

function ScoreBox({ label, value, showTooltip }) { 
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
      <div className="score-value">{value ?? 'N/A'}</div> 
      <div className="score-label">{label}</div> 
    </div> 
  ); 
}

function CircularProgressBar({ label, value, tooltip, showTooltip }) { 
  const numericValue = Math.max(0, Math.min(100, Number(value) || 0)); 
  const strokeWidth = 8; 
  const radius = 40; 
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
        <text x="50" y="50" className="circle-progress-text-value" dominantBaseline="middle" textAnchor="middle"> 
          {numericValue} 
        </text> 
      </svg> 
      <div className="circle-progress-label">{label}</div> 
    </div> 
  ); 
}

export default DetailedAnalysisModal;
