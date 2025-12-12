import React, { useState } from 'react';
import { summarizeDocumentContent } from '../services/aiFeatures';
import { supabase } from '../services/supabase';
import { FileText, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const DocumentUploader: React.FC = () => {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text) return;
    setAnalyzing(true);
    const result = await summarizeDocumentContent(text);
    setSummary(result);
    
    // Save to DB
    if (result && supabase) {
        await supabase.from('documents').insert({
            filename: `Note-${new Date().toLocaleTimeString()}`,
            content_text: text,
            summary: result.summary,
            critical_flags: result.critical_flags
        });
    }
    setAnalyzing(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-600" /> Document Analysis
      </h3>
      
      {!summary ? (
        <div className="space-y-3">
            <textarea 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none h-32"
                placeholder="Paste medical report text here (mocking OCR)..."
                value={text}
                onChange={e => setText(e.target.value)}
            />
            <button 
                onClick={handleAnalyze}
                disabled={!text || analyzing}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {analyzing ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {analyzing ? 'Analyzing...' : 'Extract Insights'}
            </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase">Summary</span>
                <p className="text-sm text-slate-700 mt-1">{summary.summary}</p>
            </div>
            
            {summary.critical_flags?.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                     <span className="text-xs font-bold text-red-600 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Critical Flags
                     </span>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {summary.critical_flags.map((flag: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-white text-red-700 text-xs rounded border border-red-200 font-medium">
                                {flag}
                            </span>
                        ))}
                     </div>
                </div>
            )}
            
            <button onClick={() => {setSummary(null); setText('');}} className="text-xs text-blue-600 hover:underline">
                Analyze Another
            </button>
        </div>
      )}
    </div>
  );
};