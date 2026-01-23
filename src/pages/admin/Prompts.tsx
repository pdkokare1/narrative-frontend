// src/pages/admin/Prompts.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IPrompt } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminBadge } from '../../components/admin/AdminBadge';
import './Admin.css';

// DEFAULTS EXTRACTED FROM BACKEND (promptManager.ts)
const DEFAULT_PROMPTS = [
  {
    type: 'ANALYSIS',
    description: "The main brain for processing incoming news articles. Handles summarization, bias detection, and categorization.",
    text: `Role: You are a Lead Editor for a global news wire.
Task: Analyze the following story and structure the data for our database.

Input Article:
Headline: "{{headline}}"
Description: "{{description}}"
Snippet: "{{content}}"
Date: {{date}}

--- INSTRUCTIONS ---

1. **Summarize (News Wire Style)**:
   - **DIRECT REPORTING:** Act as the primary source. Do NOT say "The article states" or "The report highlights." Just state the facts.
   - **TITLE ACCURACY:** Use the EXACT titles found in the source text.
   - Tone: {{ai_tone}}
   - **Length: {{ai_length}}**
   - Vocabulary: Do NOT use these words: {{ai_forbidden}}

2. **Categorize**:
   - Choose ONE: Politics, Business, Economy, Global Conflict, Tech, Science, Health, Justice, Sports, Entertainment, Lifestyle, Crypto & Finance, Gaming.

3. **CONDITIONAL BIAS & LEAN ANALYSIS (CRITICAL)**:
   - **IF Category is "Politics", "Economy", "Global Conflict", "Justice", "Policy", or "Social Issues":**
     - Political Lean: Left, Left-Leaning, Center, Right-Leaning, Right.
     - Bias Score (0-100): 0 = Neutral, 100 = Propaganda.
   - **IF Category is "Sports", "Entertainment", "Tech", "Science", "Lifestyle", "Gaming", or "Health":**
     - Political Lean: "Not Applicable".
     - Bias Score: 0.
     - Sentiment: "Neutral" (Unless it is clearly an opinion/review).

4. **Trust Score (0-100)**:
   - Based on source credibility and tone (applies to ALL categories).

5. **Smart Briefing**:
   - **Key Findings**: Extract exactly 5 distinct, bullet-point facts.
   - **Recommendations**: Provide 3 actionable tips (e.g., "Watch the match highlights", "Read the bill text").

6. **Extract Entities**:
   - Primary Noun: The main subject.
   - Secondary Noun: The context.

--- OUTPUT FORMAT ---
Respond ONLY in valid JSON. Do not add markdown blocks.

{
  "summary": "Direct, factual news brief.",
  "category": "CategoryString",
  "politicalLean": "Center",
  "analysisType": "Full",
  "sentiment": "Neutral",
  "clusterTopic": "Main Event Name",
  "country": "Global",
  "primaryNoun": "Subject",
  "secondaryNoun": "Context",
  "biasScore": 10, 
  "biasLabel": "Minimal Bias",
  "biasComponents": {
    "linguistic": {"sentimentPolarity": 0, "emotionalLanguage": 0, "loadedTerms": 0, "complexityBias": 0},
    "sourceSelection": {"sourceDiversity": 0, "expertBalance": 0, "attributionTransparency": 0},
    "demographic": {"genderBalance": 0, "racialBalance": 0, "ageRepresentation": 0},
    "framing": {"headlineFraming": 0, "storySelection": 0, "omissionBias": 0}
  },
  "credibilityScore": 90, "credibilityGrade": "A",
  "credibilityComponents": {"sourceCredibility": 0, "factVerification": 0, "professionalism": 0, "evidenceQuality": 0, "transparency": 0, "audienceTrust": 0},
  "reliabilityScore": 90, "reliabilityGrade": "A",
  "reliabilityComponents": {"consistency": 0, "temporalStability": 0, "qualityControl": 0, "publicationStandards": 0, "correctionsPolicy": 0, "updateMaintenance": 0},
  "trustLevel": "High",
  "keyFindings": ["Fact 1", "Fact 2", "Fact 3", "Fact 4", "Fact 5"],
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
}`
  },
  {
    type: 'SUMMARY_ONLY',
    description: "A cheaper, faster prompt for when the system falls back to Basic mode (handling huge volumes or errors).",
    text: `Role: You are a News Curator.
Task: Summarize this story concisely.

Input Article:
Headline: "{{headline}}"
Description: "{{description}}"
Snippet: "{{content}}"

--- INSTRUCTIONS ---
1. Summarize: Provide a factual summary with **{{ai_length}}**.
2. Categorize: Choose the most relevant category.
3. Sentiment: Determine if the story is Positive, Negative, or Neutral.

--- OUTPUT FORMAT ---
Respond ONLY in valid JSON:
{
  "summary": "String",
  "category": "String",
  "sentiment": "String",
  "politicalLean": "Not Applicable",
  "analysisType": "SentimentOnly"
}`
  }
];

const Prompts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<IPrompt[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const fetchPrompts = async () => {
    try {
      const res = await adminService.getSystemPrompts();
      setPrompts(res.data.data.prompts);
    } catch (err) { alert('Error loading prompts'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleSave = async (id: string) => {
    await adminService.updateSystemPrompt(id, { text: editText }).then(() => {
        setEditId(null); fetchPrompts(); alert('Prompt updated.');
    });
  };

  const toggleActive = async (prompt: IPrompt) => {
    await adminService.updateSystemPrompt(prompt._id, { active: !prompt.active }).then(fetchPrompts);
  };

  const seedDefaults = async () => {
    if(!window.confirm("This will attempt to create default prompts if they don't exist. Continue?")) return;
    setLoading(true);
    try {
        let added = 0;
        for(const p of DEFAULT_PROMPTS) {
            // Check if already exists in our local list to avoid API errors
            if(!prompts.find(existing => existing.type === p.type)) {
                await adminService.createSystemPrompt(p);
                added++;
            }
        }
        await fetchPrompts();
        alert(`Process complete. Added ${added} new prompts.`);
    } catch (e) {
        alert("Error seeding prompts. Check console.");
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (loading && !prompts.length) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader 
        title="AI Brain" 
        description="Manage system prompts." 
        actions={
            <button onClick={seedDefaults} className="btn btn-outline btn-sm">Seed Defaults</button>
        }
      />
      
      {prompts.length === 0 ? (
        <div className="admin-empty-state">
            <h3>No Prompts Found</h3>
            <p>Your database currently has no prompt templates. Click "Seed Defaults" above to initialize them.</p>
        </div>
      ) : (
        <div style={{display:'grid', gap:'24px'}}>
            {prompts.map((prompt) => (
            <AdminCard key={prompt._id} className={prompt.active ? '' : 'opacity-75'}>
                <div className="flex-between" style={{marginBottom:'16px'}}>
                    <div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <h2 style={{fontSize:'1.2rem', fontWeight:'bold'}}>{prompt.type}</h2>
                        <AdminBadge variant={prompt.active ? 'success' : 'neutral'}>{prompt.active ? 'Active' : 'Inactive'}</AdminBadge>
                    </div>
                    <p style={{fontSize:'0.9rem', color:'#64748b', marginTop:'4px'}}>{prompt.description}</p>
                    </div>
                    <div className="flex-end">
                    <button onClick={() => toggleActive(prompt)} className="btn btn-outline btn-sm">
                        {prompt.active ? 'Deactivate' : 'Activate'}
                    </button>
                    {editId !== prompt._id && (
                        <button onClick={() => { setEditId(prompt._id); setEditText(prompt.text); }} className="btn btn-primary btn-sm">Edit</button>
                    )}
                    </div>
                </div>

                {editId === prompt._id ? (
                <div>
                    <textarea className="form-textarea font-mono" style={{minHeight:'300px', fontSize:'13px'}} value={editText} onChange={e => setEditText(e.target.value)} />
                    <div className="flex-end" style={{marginTop:'16px'}}>
                        <button onClick={() => setEditId(null)} className="btn btn-outline">Cancel</button>
                        <button onClick={() => handleSave(prompt._id)} className="btn btn-primary">Save New Version</button>
                    </div>
                </div>
                ) : (
                <div className="font-mono" style={{background:'#f8fafc', padding:'16px', borderRadius:'8px', maxHeight:'200px', overflowY:'auto', whiteSpace:'pre-wrap', fontSize:'12px'}}>
                    {prompt.text}
                </div>
                )}
            </AdminCard>
            ))}
        </div>
      )}
    </div>
  );
};

export default Prompts;
