import React, { useState } from 'react';
import { Bed, HospitalState, Patient, AcuityLevel, Staff, ClinicalInsights } from '../types';
import { allocateBed } from '../services/logic';
import { suggestBedAllocation, assessClinicalRisk } from '../services/geminiService';
import { AlertCircle, User, Activity, CheckCircle, BrainCircuit, UserPlus, X, Stethoscope, FileText, Calendar, Syringe, Filter, Lock, Unlock, Sparkles, AlertTriangle, ChevronDown, ChevronUp, UserMinus, ArrowRight, Zap, Microscope, TrendingUp, Plus } from 'lucide-react';

interface Props {
  state: HospitalState;
  onAllocate: (patientId: string, bedId: string) => void;
  onAddPatient: (patient: Patient) => void;
  onAssignStaff: (patientId: string, staffId: string | null) => void;
  onTreat: (patientId: string, treatment: string, notes: string, newDetailedCondition?: string) => void;
  onToggleReserve: (bedId: string) => void;
  onSurge: () => void;
  onAddBed: (ward: string, skill: number) => void;
}

const AcuityBadge = ({ level }: { level: AcuityLevel }) => {
  const colors = {
    [AcuityLevel.LOW]: 'bg-green-100 text-green-800 border-green-200',
    [AcuityLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [AcuityLevel.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
    [AcuityLevel.CRITICAL]: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  };
  const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[level]}`}>
      {labels[level]}
    </span>
  );
};

const PatientCard: React.FC<{
  patient: Patient;
  staff: Staff[];
  isSelected: boolean;
  isThinking: boolean;
  onSelect: () => void;
  onAllocate: () => void;
  onAssignStaff: (e: React.MouseEvent) => void;
  onTreat: (e: React.MouseEvent) => void;
  onViewRisk: (e: React.MouseEvent) => void; // New Prop
}> = ({ patient, staff, isSelected, isThinking, onSelect, onAllocate, onAssignStaff, onTreat, onViewRisk }) => {
  const assignedStaff = staff.find(s => s.id === patient.assigned_staff_id);
  const isAdmitted = patient.status === 'Admitted';
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
      onClick={onSelect}
    >
      {/* Header with Name and Acuity */}
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-slate-900">{patient.name}</span>
        <AcuityBadge level={patient.acuity_score} />
      </div>
      
      {/* Status Details */}
      <div className="flex flex-wrap gap-2 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${isAdmitted ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {patient.status}
          </span>
          {patient.assigned_bed_id ? (
              <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  Bed: {patient.assigned_bed_id}
              </span>
          ) : (
             <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                  No Bed
             </span>
          )}
          {assignedStaff && (
               <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                  Staff: {assignedStaff.name} • {assignedStaff.role}
              </span>
          )}
      </div>

      <p className="text-sm font-semibold text-slate-800 mb-1">{patient.condition}</p>
      <p className="text-xs text-slate-500 mb-2 italic leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
          {patient.detailed_condition}
      </p>

      {/* History Toggle */}
      <button 
        onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
        className="w-full mb-3 py-1.5 flex items-center justify-center text-[10px] font-medium text-slate-500 hover:text-blue-600 hover:bg-slate-100/50 rounded transition-colors gap-1.5 border border-transparent hover:border-slate-200"
      >
        {showHistory ? (
            <>
                <ChevronUp className="w-3 h-3" /> Hide Medical History
            </>
        ) : (
            <>
                <ChevronDown className="w-3 h-3" /> View Medical History {patient.history.length > 0 && `(${patient.history.length})`}
            </>
        )}
      </button>

      {/* History Section */}
      {showHistory && (
          <div className="mb-4 animate-fade-in bg-slate-50/50 rounded border border-slate-100 p-2">
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <FileText className="w-3 h-3" /> Past Records
              </h4>
              <div className="space-y-2">
                  {patient.history && patient.history.length > 0 ? (
                      patient.history.map((h, i) => (
                          <div key={i} className="bg-white p-2 rounded border border-slate-200 text-xs shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold text-slate-700">{h.condition}</span>
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <Calendar className="w-3 h-3" /> {h.date}
                                  </span>
                              </div>
                              <div className="text-slate-500">{h.treatment}</div>
                              {h.notes && (
                                <div className="mt-1 pt-1 border-t border-slate-100 text-slate-400 text-[10px] italic">
                                  Note: {h.notes}
                                </div>
                              )}
                          </div>
                      ))
                  ) : (
                      <div className="text-xs text-slate-400 italic text-center py-1">No prior records found.</div>
                  )}
              </div>
          </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2">
          {!isAdmitted && (
            <button 
                onClick={(e) => { e.stopPropagation(); onAllocate(); }}
                disabled={isThinking}
                className="flex-1 text-xs bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
            {isThinking && isSelected ? 'Consulting AI...' : 'Auto-Allocate Bed'}
            </button>
          )}
          <div className="flex gap-2 ml-auto">
             <button 
                onClick={onViewRisk}
                className="flex items-center justify-center px-3 py-2 rounded-md border text-xs font-medium transition-colors bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                title="AI Clinical Analysis"
              >
                 <BrainCircuit className="w-4 h-4" />
              </button>
             <button 
                onClick={onTreat}
                className="flex items-center justify-center px-3 py-2 rounded-md border text-xs font-medium transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                title="Record Treatment"
              >
                 <Syringe className="w-4 h-4" />
              </button>
              <button 
                onClick={onAssignStaff}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors ${assignedStaff ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                title={assignedStaff ? "Edit Assignment" : "Assign Staff"}
              >
                 {assignedStaff ? <Stethoscope className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                 {assignedStaff ? "Edit" : "Assign"}
              </button>
          </div>
      </div>
    </div>
  );
};

export const TraumaCenter: React.FC<Props> = ({ state, onAllocate, onAddPatient, onAssignStaff, onTreat, onToggleReserve, onSurge, onAddBed }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [assigningPatientId, setAssigningPatientId] = useState<string | null>(null);
  const [showBedMenu, setShowBedMenu] = useState(false);

  // Treatment Modal State
  const [treatingPatientId, setTreatingPatientId] = useState<string | null>(null);
  const [treatmentForm, setTreatmentForm] = useState({ treatment: '', notes: '', conditionDetails: '' });

  // Risk Modal State
  const [viewingRiskPatientId, setViewingRiskPatientId] = useState<string | null>(null);
  const [currentRiskAnalysis, setCurrentRiskAnalysis] = useState<ClinicalInsights | null>(null);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'admitted'>('all');

  // Show patients based on filter and SORT BY RISK (Acuity)
  const activePatients = state.patients
    .filter(p => {
      if (p.status === 'Discharged') return false;
      if (filterStatus === 'waiting' && p.status !== 'Waiting') return false;
      if (filterStatus === 'admitted' && p.status !== 'Admitted') return false;
      return true;
    })
    .sort((a, b) => {
      // 1. Sort by Status: 'Waiting' patients come before 'Admitted' to prioritize triage
      if (a.status === 'Waiting' && b.status !== 'Waiting') return -1;
      if (a.status !== 'Waiting' && b.status === 'Waiting') return 1;

      // 2. Sort by Acuity: Higher Acuity Score (4=Critical) comes first
      return b.acuity_score - a.acuity_score;
    });

  const selectedPatient = state.patients.find(p => p.id === selectedPatientId);

  const handleAutoAllocate = async (patient: Patient) => {
    // 1. Core Logic First
    const recommendedBedId = allocateBed(patient, state.beds, state.staff);
    
    if (recommendedBedId) {
      onAllocate(patient.id, recommendedBedId);
      setAiSuggestion(null);
    } else {
      // If logic fails, ask AI for advice
      setIsThinking(true);
      const availableBedIds = state.beds.filter(b => !b.is_occupied && !b.is_reserved).map(b => b.id);
      const suggestion = await suggestBedAllocation(patient.name, patient.acuity_score, availableBedIds);
      setAiSuggestion(suggestion);
      setIsThinking(false);
    }
  };

  const createRandomPatient = (): Patient => {
    const conditions = [
        { short: 'Chest Pain', detail: 'Acute onset crushing substernal chest pain. ECG shows ST elevation.' },
        { short: 'Abdominal Pain', detail: 'Severe RLQ tenderness with guarding. Fever 39°C.' },
        { short: 'Laceration', detail: 'Deep laceration to forearm from power tool. Active bleeding.' },
        { short: 'Respiratory Distress', detail: 'History of asthma. O2 saturation 88% on room air. Audible wheezing.' },
        { short: 'Head Injury', detail: 'Fall from ladder. Brief LOC. Confusion and repetitive questioning.' }
    ];
    const selected = conditions[Math.floor(Math.random() * conditions.length)];

    return {
        id: `P-${Math.floor(Math.random() * 10000)}`,
        name: `New Patient ${Math.floor(Math.random() * 100)}`,
        acuity_score: Math.floor(Math.random() * 4) + 1,
        condition: selected.short,
        detailed_condition: selected.detail,
        history: [], 
        status: 'Waiting',
        assigned_bed_id: null,
        assigned_staff_id: null
    };
  };

  const handleSimulateAdmission = () => {
     onAddPatient(createRandomPatient());
  }

  const handleAITriage = async () => {
    const newPatient = createRandomPatient();
    onAddPatient(newPatient);
    setSelectedPatientId(newPatient.id);
    
    setIsThinking(true);
    // Find beds that are neither occupied nor reserved
    const availableBedIds = state.beds.filter(b => !b.is_occupied && !b.is_reserved).map(b => b.id);
    const suggestion = await suggestBedAllocation(newPatient.name, newPatient.acuity_score, availableBedIds);
    setAiSuggestion(suggestion);
    setIsThinking(false);
  }

  const openStaffModal = (e: React.MouseEvent, patientId: string) => {
      e.stopPropagation();
      setAssigningPatientId(patientId);
      setShowStaffModal(true);
  }

  const confirmStaffAssignment = (staffId: string | null) => {
      if (assigningPatientId) {
          onAssignStaff(assigningPatientId, staffId);
          setShowStaffModal(false);
          setAssigningPatientId(null);
      }
  }

  const openTreatmentModal = (e: React.MouseEvent, patientId: string) => {
      e.stopPropagation();
      const patient = state.patients.find(p => p.id === patientId);
      if (patient) {
        setTreatmentForm({
          treatment: '',
          notes: '',
          conditionDetails: patient.detailed_condition
        });
        setTreatingPatientId(patientId);
      }
  }

  const openRiskModal = async (e: React.MouseEvent, patientId: string) => {
      e.stopPropagation();
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      setViewingRiskPatientId(patientId);
      setIsAnalyzingRisk(true);
      setCurrentRiskAnalysis(null);

      const insights = await assessClinicalRisk(patient);
      setCurrentRiskAnalysis(insights);
      setIsAnalyzingRisk(false);
  }

  const submitTreatment = () => {
    if (treatingPatientId && treatmentForm.treatment) {
      onTreat(treatingPatientId, treatmentForm.treatment, treatmentForm.notes, treatmentForm.conditionDetails);
      setTreatingPatientId(null);
    }
  }

  // Helper for visualizing compatibility
  const getMinRequiredSkill = (acuity: number) => {
    const thresholdMap: Record<number, number> = { 1: 1, 2: 4, 3: 7, 4: 9 };
    return thresholdMap[acuity] || 1;
  };

  // Dynamic Matching Logic
  const getBedMatchStatus = (bed: Bed, patient: Patient | null | undefined) => {
      if (bed.is_occupied) return 'occupied';
      if (bed.is_reserved) return 'reserved';
      
      if (!patient) return 'available'; // Default state if no patient selected

      const required = getMinRequiredSkill(patient.acuity_score);
      
      // Incompatible: Bed skill too low
      if (bed.required_skill_level < required) return 'incompatible';

      // Match Logic: Differentiate between Optimal (Efficient) and Suboptimal (Wasteful but compatible)
      // Optimal: Bed skill is sufficient and not excessive (within +3 levels)
      // Suboptimal: Bed skill is vastly higher than required (e.g. putting low acuity in ICU)
      const diff = bed.required_skill_level - required;
      if (diff >= 0 && diff <= 3) return 'optimal';
      
      return 'suboptimal';
  };
  
  // Check if any staff has high fatigue for the modal banner
  const hasHighFatigueStaff = state.staff.some(s => s.current_fatigue_score > 70);
  const currentAssignedStaffId = assigningPatientId ? state.patients.find(p => p.id === assigningPatientId)?.assigned_staff_id : null;

  return (
    <div className="space-y-6 relative">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500">Bed Occupancy</p>
                <p className="text-2xl font-bold text-slate-900">
                    {state.beds.filter(b => b.is_occupied).length} / {state.beds.length}
                </p>
            </div>
            <Activity className="text-blue-500 w-8 h-8" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500">Active Patients</p>
                <p className="text-2xl font-bold text-slate-900">{activePatients.length}</p>
            </div>
            <AlertCircle className="text-red-500 w-8 h-8" />
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleSimulateAdmission}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-sm flex items-center justify-center gap-2 font-medium transition-colors text-sm">
                <User className="w-5 h-5" /> Arrival
            </button>
            <button 
                onClick={onSurge}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl shadow-sm flex items-center justify-center gap-2 font-medium transition-colors text-sm animate-pulse">
                <Zap className="w-5 h-5" /> Surge Sim
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-semibold text-slate-800">Active Patients</h3>
            <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200">
               <button 
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded transition-all ${filterStatus === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 All
               </button>
               <button 
                  onClick={() => setFilterStatus('waiting')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded transition-all ${filterStatus === 'waiting' ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Wait
               </button>
               <button 
                  onClick={() => setFilterStatus('admitted')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded transition-all ${filterStatus === 'admitted' ? 'bg-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 Adm
               </button>
            </div>
          </div>
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {activePatients.length === 0 && (
                <div className="text-center text-slate-400 py-10">
                    {filterStatus === 'waiting' ? 'No patients waiting.' : 
                     filterStatus === 'admitted' ? 'No patients admitted.' : 
                     'No active patients.'}
                </div>
            )}
            {activePatients.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                staff={state.staff}
                isSelected={selectedPatientId === patient.id}
                isThinking={isThinking}
                onSelect={() => setSelectedPatientId(patient.id)}
                onAllocate={() => handleAutoAllocate(patient)}
                onAssignStaff={(e) => openStaffModal(e, patient.id)}
                onTreat={(e) => openTreatmentModal(e, patient.id)}
                onViewRisk={(e) => openRiskModal(e, patient.id)}
              />
            ))}
          </div>
          {aiSuggestion && (
              <div className="p-4 bg-amber-50 border-t border-amber-100">
                  <div className="flex items-center gap-2 mb-1 text-amber-700 font-semibold text-sm">
                      <BrainCircuit className="w-4 h-4" /> AI Suggestion
                  </div>
                  <p className="text-xs text-amber-800">{aiSuggestion}</p>
              </div>
          )}
        </div>

        {/* Bed Grid Container - Updated Layout for Fixed Header */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
          {/* Header - Fixed Height & Non-Scrolling */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-xl z-10 relative">
              <h3 className="font-semibold text-slate-800">Live Bed Status</h3>
              <div className="flex items-center gap-2">
                 {/* ADD BED DROPDOWN */}
                 <div className="relative">
                    <button 
                        onClick={() => setShowBedMenu(!showBedMenu)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium transition-colors border border-slate-200"
                        title="Add new bed"
                    >
                        <Plus className="w-4 h-4" /> Add Bed
                    </button>
                    {showBedMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowBedMenu(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-200 z-50 flex flex-col p-1 animate-fade-in-up">
                                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Select Type</div>
                                <button 
                                    onClick={() => { onAddBed('General', 3); setShowBedMenu(false); }}
                                    className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
                                >
                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div> General
                                </button>
                                <button 
                                    onClick={() => { onAddBed('Trauma', 6); setShowBedMenu(false); }}
                                    className="text-left px-3 py-2 text-xs text-orange-700 hover:bg-orange-50 rounded flex items-center gap-2"
                                >
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div> Trauma
                                </button>
                                <button 
                                    onClick={() => { onAddBed('ICU', 9); setShowBedMenu(false); }}
                                    className="text-left px-3 py-2 text-xs text-red-700 hover:bg-red-50 rounded flex items-center gap-2"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div> ICU
                                </button>
                            </div>
                        </>
                    )}
                 </div>
                 
                 {selectedPatient && (
                    <div className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 flex items-center gap-2">
                        <span className="font-bold">Allocating:</span> {selectedPatient.name} (Acuity: {selectedPatient.acuity_score})
                        <span className="text-slate-400">|</span>
                        <span>Req. Skill: {getMinRequiredSkill(selectedPatient.acuity_score)}+</span>
                    </div>
                )}
              </div>
          </div>
          
          {/* Grid Content - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {state.beds.map(bed => {
                const status = getBedMatchStatus(bed, selectedPatient);

                // --- Dynamic Visualization Logic based on Status ---
                let borderClass = '';
                let bgClass = '';
                let opacityClass = 'opacity-100';
                let statusText = '';
                let statusColor = '';
                let icon = null;
                
                switch (status) {
                    case 'occupied':
                        borderClass = 'border-red-200';
                        bgClass = 'bg-red-50/50';
                        statusText = 'Occupied';
                        statusColor = 'text-slate-800';
                        icon = <User className="w-4 h-4 text-red-400" />;
                        break;
                    case 'reserved':
                        borderClass = 'border-amber-200 hover:border-amber-300';
                        bgClass = 'bg-amber-50';
                        statusText = 'Reserved';
                        statusColor = 'text-amber-700 font-medium';
                        icon = <Lock className="w-4 h-4 text-amber-500" />;
                        break;
                    case 'incompatible':
                        borderClass = 'border-slate-200';
                        bgClass = 'bg-slate-50';
                        opacityClass = 'opacity-60 grayscale';
                        statusText = 'Incompatible';
                        statusColor = 'text-slate-400';
                        icon = <AlertTriangle className="w-4 h-4 text-slate-300" />;
                        break;
                    case 'suboptimal':
                        borderClass = 'border-blue-200 ring-1 ring-blue-100';
                        bgClass = 'bg-blue-50';
                        statusText = 'Over-resourced';
                        statusColor = 'text-blue-600 font-medium';
                        icon = <CheckCircle className="w-4 h-4 text-blue-400" />;
                        break;
                    case 'optimal':
                        borderClass = 'border-emerald-400 ring-2 ring-emerald-100';
                        bgClass = 'bg-emerald-50';
                        statusText = 'Optimal Match';
                        statusColor = 'text-emerald-700 font-bold';
                        icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
                        break;
                    default: // 'available'
                        borderClass = 'border-emerald-100 hover:border-emerald-300';
                        bgClass = 'bg-emerald-50/30';
                        statusText = 'Available';
                        statusColor = 'text-emerald-600';
                        icon = <CheckCircle className="w-4 h-4 text-emerald-400" />;
                        break;
                }

                return (
                  <div 
                    key={bed.id}
                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-32 ${borderClass} ${bgClass} ${opacityClass}`}
                    style={bed.is_reserved ? { backgroundImage: 'repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.1) 0, rgba(251, 191, 36, 0.1) 10px, transparent 10px, transparent 20px)' } : {}}
                  >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{bed.id}</span>
                        {icon}
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-400">{bed.ward} Ward</span>
                            <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Lvl {bed.required_skill_level}</span>
                        </div>
                        {bed.is_occupied ? (
                            <div className={`text-sm font-semibold ${statusColor}`}>
                                 Patient {state.patients.find(p => p.id === bed.assigned_patient_id)?.name || 'Unknown'}
                            </div>
                        ) : (
                            <div className={`text-sm ${statusColor}`}>{statusText}</div>
                        )}
                    </div>
                    
                    {/* Action Bar at bottom */}
                    <div className="flex justify-end items-end mt-2">
                       {!bed.is_occupied && (
                           <button 
                              onClick={() => onToggleReserve(bed.id)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${bed.is_reserved ? 'bg-amber-200 text-amber-800 hover:bg-amber-300' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                              title={bed.is_reserved ? "Release Bed" : "Reserve Bed"}
                           >
                              {bed.is_reserved ? (
                                  <>
                                      <Unlock className="w-3 h-3" /> Release
                                  </>
                              ) : (
                                  <>
                                      <Lock className="w-3 h-3" /> Reserve
                                  </>
                              )}
                           </button>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Assignment Modal */}
      {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                  <div className="bg-slate-100 p-4 border-b border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-slate-800">Assign Staff Member</h3>
                        <button onClick={() => setShowStaffModal(false)} className="text-slate-500 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                      </div>
                      {hasHighFatigueStaff && (
                          <div className="flex items-center gap-2 text-xs bg-red-100 text-red-800 p-2 rounded-md border border-red-200 mt-2">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="font-semibold">Warning:</span> Some staff members exceed 70% fatigue.
                          </div>
                      )}
                  </div>
                  <div className="p-2 overflow-y-auto max-h-[60vh]">
                      {currentAssignedStaffId && (
                           <button 
                             onClick={() => confirmStaffAssignment(null)}
                             className="w-full text-left p-3 mb-2 rounded-lg flex items-center justify-between group transition-colors bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200"
                           >
                               <div className="text-sm font-medium text-slate-600 group-hover:text-red-700 flex items-center gap-2">
                                   <UserMinus className="w-4 h-4" /> Unassign Current Staff
                               </div>
                           </button>
                      )}
                      
                      {state.staff.map(staff => {
                          const isHighFatigue = staff.current_fatigue_score > 70;
                          const isAssigned = staff.id === currentAssignedStaffId;
                          return (
                            <button 
                                key={staff.id}
                                onClick={() => confirmStaffAssignment(staff.id)}
                                className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0 
                                    ${isAssigned ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : ''}
                                    ${isHighFatigue ? 'bg-red-50 hover:bg-red-100 border-red-100' : 'hover:bg-blue-50'}
                                `}
                            >
                                <div>
                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                        {staff.name}
                                        {isHighFatigue && (
                                            <span className="flex items-center gap-1 text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded-full font-bold">
                                                <AlertTriangle className="w-3 h-3" /> High Fatigue
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500">{staff.role} • Skill: {staff.skill_level}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`text-xs font-bold ${isHighFatigue ? 'text-red-600' : 'text-green-500'}`}>
                                        Fatigue: {staff.current_fatigue_score}%
                                    </div>
                                    <div className={`opacity-0 group-hover:opacity-100 ${isHighFatigue ? 'text-red-600' : 'text-blue-600'}`}>
                                        {isHighFatigue ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                    </div>
                                    {isAssigned && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                </div>
                            </button>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* Clinical Risk Analysis Modal */}
      {viewingRiskPatientId && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
               <div className="bg-purple-700 p-4 border-b border-purple-800 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-purple-200" />
                      <h3 className="font-bold">Clinical Risk Assessment</h3>
                    </div>
                    <button onClick={() => setViewingRiskPatientId(null)} className="text-purple-200 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {isAnalyzingRisk ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <p className="text-sm text-slate-500 animate-pulse">Consulting AI Knowledge Base...</p>
                        </div>
                    ) : currentRiskAnalysis ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-sm font-semibold text-slate-600">Deterioration Risk:</span>
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                    currentRiskAnalysis.deterioration_probability === 'High' || currentRiskAnalysis.deterioration_probability === 'Critical' ? 'bg-red-100 text-red-700' : 
                                    currentRiskAnalysis.deterioration_probability === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {currentRiskAnalysis.deterioration_probability}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Risk Factors
                                </h4>
                                <ul className="space-y-1">
                                    {currentRiskAnalysis.risk_factors.map((rf, idx) => (
                                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 flex-shrink-0"></span>
                                            {rf}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <Microscope className="w-3 h-3" /> Suggested Labs/Imaging
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentRiskAnalysis.suggested_labs.map((lab, idx) => (
                                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                            {lab}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Recommended Intervention
                                </h4>
                                <p className="text-sm text-emerald-900 font-medium">
                                    {currentRiskAnalysis.recommended_intervention}
                                </p>
                            </div>

                            <p className="text-[10px] text-right text-slate-400 mt-2">
                                Generated at {currentRiskAnalysis.last_updated}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500">Analysis failed. Please try again.</div>
                    )}
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                     <button 
                      onClick={() => setViewingRiskPatientId(null)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300"
                    >
                      Close Report
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* Treatment Modal */}
      {treatingPatientId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-emerald-600 p-4 border-b border-emerald-700 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                      <Syringe className="w-5 h-5 text-emerald-100" />
                      <h3 className="font-bold">Record Treatment</h3>
                    </div>
                    <button onClick={() => setTreatingPatientId(null)} className="text-emerald-100 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Provided</label>
                      <input 
                        type="text" 
                        value={treatmentForm.treatment}
                        onChange={(e) => setTreatmentForm({...treatmentForm, treatment: e.target.value})}
                        placeholder="e.g. Administered 5mg Morphine"
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Notes (Optional)</label>
                      <textarea 
                        value={treatmentForm.notes}
                        onChange={(e) => setTreatmentForm({...treatmentForm, notes: e.target.value})}
                        placeholder="Additional observations..."
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none h-20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Update Condition Details</label>
                      <textarea 
                        value={treatmentForm.conditionDetails}
                        onChange={(e) => setTreatmentForm({...treatmentForm, conditionDetails: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none h-24 text-sm font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-1">Modify the current condition description if the status has changed.</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                      onClick={() => setTreatingPatientId(null)}
                      className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitTreatment}
                      disabled={!treatmentForm.treatment}
                      className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Save Record
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};