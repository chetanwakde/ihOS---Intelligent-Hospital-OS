import React, { useState } from 'react';
import { analyzeTriage } from '../services/aiFeatures';
import { supabase } from '../services/supabase';
import { Activity, Mic, MicOff, Save, X, AlertTriangle, FileText } from 'lucide-react';

interface Props {
  onClose: () => void;
  onTriageComplete: () => void;
}

export const AITriageModal: React.FC<Props> = ({ onClose, onTriageComplete }) => {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState(30);
  const [vitals, setVitals] = useState({ hr: 80, bp_sys: 120, bp_dia: 80, spo2: 98, temp: 37.0 });
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggleVoice = () => {
    // Simple Web Speech API integration
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    if (!isListening) {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (e: any) => {
        setSymptoms(prev => prev + ' ' + e.results[0][0].transcript);
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    const data = await analyzeTriage(symptoms, vitals, age);
    setResult(data);
    setLoading(false);
    setStep(2);
  };

  const handleSave = async () => {
    if (!result) return;
    
    // Create new patient record
    const { error } = await supabase.from('patients').insert({
        id: `P-${Date.now()}`,
        name: `Anonymous (${age})`,
        acuity_score: result.severity === 'Critical' ? 4 : result.severity === 'High' ? 3 : result.severity === 'Moderate' ? 2 : 1,
        condition: symptoms.substring(0, 30) + '...',
        detailed_condition: symptoms,
        vitals: vitals,
        triage_score: result.triage_score,
        triage_history: [{
            score: result.triage_score,
            severity: result.severity,
            recommended_actions: result.recommended_actions,
            timestamp: new Date().toISOString()
        }],
        status: 'Waiting'
    });

    if (!error) {
        onTriageComplete();
        onClose();
    } else {
        alert("Failed to save patient.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2">
            <Activity className="w-5 h-5" /> AI Triage Assistant
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                <input type="number" value={age} onChange={e => setAge(parseInt(e.target.value))} className="w-full p-2 border rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">HR</label>
                    <input type="number" value={vitals.hr} onChange={e => setVitals({...vitals, hr: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">SpO2</label>
                    <input type="number" value={vitals.spo2} onChange={e => setVitals({...vitals, spo2: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">BP (Sys)</label>
                    <input type="number" value={vitals.bp_sys} onChange={e => setVitals({...vitals, bp_sys: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Temp</label>
                    <input type="number" value={vitals.temp} onChange={e => setVitals({...vitals, temp: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
                 </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Symptoms</label>
                    <button onClick={toggleVoice} className={`text-xs flex items-center gap-1 ${isListening ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                        {isListening ? <MicOff className="w-3 h-3"/> : <Mic className="w-3 h-3"/>}
                        {isListening ? 'Listening...' : 'Voice Input'}
                    </button>
                </div>
                <textarea 
                    value={symptoms} 
                    onChange={e => setSymptoms(e.target.value)} 
                    className="w-full p-2 border rounded h-24"
                    placeholder="Describe patient condition..."
                />
              </div>
              <button 
                onClick={handleAnalyze} 
                disabled={loading || !symptoms}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Predict Severity'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className={`text-2xl font-bold ${result.severity === 'Critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {result.severity}
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-slate-500 uppercase">Triage Score</div>
                        <div className="h-2 bg-slate-200 rounded-full mt-1">
                            <div className="h-full bg-blue-600 rounded-full" style={{width: `${result.triage_score}%`}}></div>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-slate-700">{result.triage_score}/100</div>
                </div>

                <div>
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Recommended Actions
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                        {result.recommended_actions.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                        ))}
                    </ul>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 p-3 rounded text-amber-800 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    AI suggestions are advisory only. Final clinical judgment rests with medical staff.
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(1)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded">Back</button>
                    <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> Admit Patient
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
