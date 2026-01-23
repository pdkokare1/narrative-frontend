// src/pages/admin/SystemConfig.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ISystemConfig } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import './Admin.css';

// Default Seeder Data for the Client Side to push if needed
const DEFAULT_CONFIGS = [
  {
    key: 'ai_personality',
    value: {
        length_instruction: "Minimum 50 words and Maximum 60 words",
        tone: "Objective, authoritative, and direct (News Wire Style)",
        forbidden_words: "delves, underscores, crucial, tapestry, landscape, moreover, notably, the article, the report"
    },
    description: "Controls the specific instructions injected into every AI prompt."
  },
  {
    key: 'scoring_weights',
    value: {
        image_bonus: 2,
        missing_image_penalty: -2,
        missing_image_untrusted_penalty: -10,
        trusted_source_bonus: 5,
        junk_keyword_penalty: -20,
        min_score_cutoff: 0
    },
    description: "Adjusts how the feed algorithm ranks incoming news."
  },
  {
    key: 'tts_rules',
    value: [
        { pattern: "\\$([0-9\\.,]+)\\s?([mM]illion|[bB]illion|[tT]rillion)", flags: "gi", replacement: "$1 $2 dollars" },
        { pattern: "[-—–]", flags: "g", replacement: " " },
        { pattern: ":", flags: "g", replacement: ". . " }
    ],
    description: "Regex rules to fix pronunciation errors before TTS generation."
  }
];

const SystemConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ISystemConfig[]>([]);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchConfigs = async () => {
    try {
      const res = await adminService.getSystemConfigs();
      setConfigs(res.data.data.configs);
    } catch (err) { alert('Error loading configs'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async (key: string) => {
    let finalValue: any = editValue;

    // Try to parse JSON if it looks like an object/array
    if (editValue.trim().startsWith('{') || editValue.trim().startsWith('[')) {
       try { 
           finalValue = JSON.parse(editValue); 
       } catch (e) { 
           alert('Invalid JSON Syntax. Please check your commas and quotes.'); 
           return; 
       }
    }

    await adminService.updateSystemConfig(key, finalValue).then(() => {
        setEditKey(null); fetchConfigs();
    });
  };

  const seedDefaults = async () => {
      if(!window.confirm("This will overwrite existing keys with defaults. Continue?")) return;
      setLoading(true);
      try {
          for(const conf of DEFAULT_CONFIGS) {
              await adminService.updateSystemConfig(conf.key, conf.value);
          }
          await fetchConfigs();
          alert("Defaults seeded successfully!");
      } catch(e) {
          alert("Error seeding defaults.");
      } finally {
          setLoading(false);
      }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <AdminPageHeader title="System Configuration" description="Global variables and logic control." />
      
      <div className="flex-between" style={{marginBottom:'24px', background:'#fffbeb', padding:'16px', borderRadius:'8px', border:'1px solid #fcd34d'}}>
        <div style={{color:'#92400e'}}>
            <strong>⚠️ Warning:</strong> Changes here affect the live algorithm immediately.
        </div>
        <button onClick={seedDefaults} className="btn btn-outline btn-sm">Seed Defaults</button>
      </div>

      <div style={{display:'grid', gap:'16px'}}>
        {configs.map((config) => (
          <AdminCard key={config._id}>
             <div className="flex-between" style={{marginBottom:'12px'}}>
                <div>
                   <h3 style={{fontSize:'1.1rem', fontWeight:'bold'}}>{config.key}</h3>
                   <p style={{fontSize:'0.85rem', color:'#64748b', marginTop:'2px'}}>{config.description || "No description provided."}</p>
                </div>
                {editKey !== config.key && (
                  <button onClick={() => {
                        setEditKey(config.key);
                        // Pretty print JSON
                        const val = typeof config.value === 'object' ? JSON.stringify(config.value, null, 2) : String(config.value);
                        setEditValue(val);
                    }} className="btn btn-outline btn-sm">Edit</button>
                )}
             </div>
             
             {editKey === config.key ? (
               <div>
                 <textarea 
                    className="form-textarea font-mono" 
                    rows={10} 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    style={{fontSize:'0.85rem', background:'#1e293b', color:'#f8fafc', border:'none'}}
                 />
                 <div className="flex-end" style={{marginTop:'12px'}}>
                    <button onClick={() => setEditKey(null)} className="btn btn-outline btn-sm">Cancel</button>
                    <button onClick={() => handleSave(config.key)} className="btn btn-primary btn-sm">Save Changes</button>
                 </div>
               </div>
             ) : (
               <div className="font-mono" style={{background:'#f8fafc', padding:'12px', borderRadius:'6px', wordBreak:'break-all', fontSize:'0.8rem'}}>
                  <pre style={{margin:0, whiteSpace:'pre-wrap'}}>
                      {typeof config.value === 'object' ? JSON.stringify(config.value, null, 2) : config.value}
                  </pre>
               </div>
             )}
          </AdminCard>
        ))}
      </div>
    </div>
  );
};

export default SystemConfig;
