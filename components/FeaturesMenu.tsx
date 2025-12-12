import React, { useState } from 'react';
import { AITriageModal } from './AITriageModal';
import { DocumentUploader } from './DocumentUploader';
import { Zap, Activity, FileText, Users, AlertTriangle, Package, X, CheckCircle, ArrowRight } from 'lucide-react';
import { simulateSurgeImpact, balanceStaffLoad, checkReorderNeeds } from '../services/aiFeatures';
import { HospitalState } from '../types';

interface Props {
  state: HospitalState;
  onRefresh: () => void; // Trigger data refresh
}

export const FeaturesMenu: React.FC<Props> = ({ state, onRefresh }) => {
  const [showTriage, setShowTriage] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [surgeResult, setSurgeResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Generic Results Modal State
  const [modalData, setModalData] = useState<{ title: string; content: React.ReactNode } | null>(null);

  const runLoadBalancer = async () => {
    setLoading(true);
    const res = await balanceStaffLoad(state.staff, state.patients.length);
    setLoading(false);
    
    if (res && res.suggestions) {
        setModalData({
            title: "AI Staff Load Balancing",
            content: (
                <div className="space-y-3">
                    {res.suggestions.length === 0 ? (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                            <p>Roster analysis complete. All staff fatigue levels are within safe operating limits.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-500 mb-2">The AI has detected fatigue risks and recommends the following roster adjustments:</p>
                            {res.suggestions.map((s: any, i: number) => {
                                const staffName = state.staff.find(st => st.id === s.staff_id)?.name || s.staff_id;
                                return (
                                    <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-blue-500" />
                                                {staffName}
                                            </div>
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">
                                                {s.action}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded mt-2 border border-slate-100">
                                            <span className="font-semibold text-slate-700">Reason:</span> {s.reason}
                                        </p>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )
        });
    } else {
         setModalData({
            title: "AI Analysis Failed",
            content: <p className="text-red-500">Unable to generate suggestions. Please check system connection.</p>
         });
    }
  };

  const runReorder = async () => {
    setLoading(true);
    const res = await checkReorderNeeds(state.inventory);
    setLoading(false);

    setModalData({
        title: "Predictive Supply Chain",
        content: (
             <div className="space-y-3">
                {res.length === 0 ? (
                     <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-lg border border-green-100">
                        <CheckCircle className="w-6 h-6" />
                        <div>
                            <h4 className="font-bold">Inventory Optimal</h4>
                            <p className="text-sm opacity-90">No low stock items detected based on current usage rates.</p>
                        </div>
                     </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                            <span>{res.length} items flagged for reorder</span>
                            <span className="text-xs italic">Based on predictive surgery volume</span>
                        </div>
                        {res.map((item: any, i: number) => (
                            <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center group hover:border-orange-300 transition-colors">
                                <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-slate-400" />
                                        {item.item_name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{item.reason}</div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-1 ${
                                        item.urgency === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {item.urgency} Priority
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                        + {item.suggested_qty} <span className="text-xs font-normal text-slate-400">units</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
             </div>
        )
    });
  };

  const runSurge = async () => {
    setLoading(true);
    const res = await simulateSurgeImpact(50);
    setSurgeResult(res);
    setLoading(false);
    setTimeout(() => setSurgeResult(null), 8000);
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3 items-end">
        {/* Surge Alert */}
        {surgeResult && (
            <div className="bg-red-600 text-white p-4 rounded-lg shadow-xl mb-4 animate-bounce w-64">
                <div className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Surge Analysis</div>
                <div className="text-xs mt-1">Impact: {surgeResult.bed_impact}</div>
                <div className="text-xs">Staff Needed: {surgeResult.staff_needed}</div>
            </div>
        )}

        <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-2">
            <button onClick={() => setShowTriage(true)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="AI Triage">
                <Activity className="w-4 h-4" /> <span className="hidden md:inline">AI Triage</span>
            </button>
            <button onClick={() => setShowDocs(!showDocs)} className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Docs">
                <FileText className="w-4 h-4" /> <span className="hidden md:inline">Analyze Docs</span>
            </button>
            <button onClick={runLoadBalancer} disabled={loading} className="p-2 hover:bg-green-50 text-green-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Staff Balance">
                <Users className="w-4 h-4" /> <span className="hidden md:inline">{loading ? 'Analyzing...' : 'Balance Staff'}</span>
            </button>
             <button onClick={runReorder} disabled={loading} className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Auto Reorder">
                <Package className="w-4 h-4" /> <span className="hidden md:inline">{loading ? 'Checking...' : 'Reorder'}</span>
            </button>
             <button onClick={runSurge} disabled={loading} className="p-2 hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Surge Sim">
                <Zap className="w-4 h-4" /> <span className="hidden md:inline">Simulate Surge</span>
            </button>
        </div>
      </div>

      {showTriage && <AITriageModal onClose={() => setShowTriage(false)} onTriageComplete={onRefresh} />}
      
      {showDocs && (
          <div className="fixed bottom-6 left-6 z-50 w-80 animate-fade-in-up">
              <div className="flex justify-between items-center bg-slate-900 text-white p-2 rounded-t-lg">
                  <span className="text-xs font-bold pl-2">Document Analysis</span>
                  <button onClick={() => setShowDocs(false)}><X className="w-4 h-4"/></button>
              </div>
              <DocumentUploader />
          </div>
      )}

      {/* Feature Result Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">{modalData.title}</h3>
                    <button onClick={() => setModalData(null)} className="text-slate-500 hover:text-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {modalData.content}
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={() => setModalData(null)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};