import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AuthPage } from './views/AuthPage';
import { TraumaCenter } from './views/TraumaCenter';
import { Staffing } from './views/Staffing';
import { Inventory } from './views/Inventory';
import { Appointments } from './views/Appointments'; // NEW
import { ChatBot } from './components/ChatBot';
import { HospitalState, Patient, MedicalEvent, Staff, InventoryItem, Appointment, Bed } from './types';
import { generateInitialState, predictInventoryUsage } from './services/logic';
import { generateHospitalReport, generateSurgeScenario } from './services/geminiService';
import { supabase } from './services/supabase';
import { Sparkles, X, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';
import { FeaturesMenu } from './components/FeaturesMenu';
import { ForecastWidget } from './components/ForecastWidget';

interface AuthUser {
  name: string;
  role: string;
}

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState('trauma');
  const [hospitalState, setHospitalState] = useState<HospitalState>(generateInitialState());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // AI Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Surge State
  const [isSurgeLoading, setIsSurgeLoading] = useState(false);
  const [surgeAlert, setSurgeAlert] = useState<string | null>(null);

  // --- Supabase Synchronization ---

  const fetchLatestData = async () => {
      if (!supabase) return;
      try {
        const [patientsRes, bedsRes, staffRes, inventoryRes, appointmentsRes] = await Promise.all([
          supabase.from('patients').select('*'),
          supabase.from('beds').select('*'),
          supabase.from('staff').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('appointments').select('*')
        ]);

        if (patientsRes.error) throw patientsRes.error;

        setHospitalState(prev => ({
            ...prev,
            patients: (patientsRes.data as any[]) || [],
            beds: (bedsRes.data as any[]) || [], 
            staff: (staffRes.data as any[]) || [],
            inventory: (inventoryRes.data as any[]) || [],
            appointments: (appointmentsRes.data as any[]) || [],
            alerts: ["System Online. Synced with Live Database."]
        }));
      } catch (e) {
          console.error("Fetch error:", e);
      }
  };

  useEffect(() => {
    if (!supabase) return;

    const initSupabase = async () => {
      try {
        setConnectionError(null);
        await fetchLatestData();
        setIsSupabaseConnected(true);
      } catch (e: any) {
        console.error("Supabase Sync Error:", e);
        // Check for common error: Missing Tables
        if (e.message?.includes('does not exist') || e.code === '42P01') {
            setConnectionError("Tables missing in Supabase. Please run SQL setup.");
        } else {
            setConnectionError("Connection Failed");
        }
        setIsSupabaseConnected(false);
      }
    };

    initSupabase();

    // Realtime Subscriptions
    const channels = [
      supabase.channel('patients-all').on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        handleRealtimeUpdate('patients', payload);
      }).subscribe(),
      supabase.channel('beds-all').on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, (payload) => {
        handleRealtimeUpdate('beds', payload);
      }).subscribe(),
      supabase.channel('staff-all').on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
        handleRealtimeUpdate('staff', payload);
      }).subscribe(),
      supabase.channel('inventory-all').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        handleRealtimeUpdate('inventory', payload);
      }).subscribe(),
      supabase.channel('appointments-all').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        handleRealtimeUpdate('appointments', payload);
      }).subscribe(),
    ];

    return () => {
      channels.forEach(c => c.unsubscribe());
    };
  }, []);

  const handleRealtimeUpdate = (table: keyof HospitalState, payload: any) => {
      if (payload.eventType === 'INSERT') {
          setHospitalState(prev => {
             // Avoid duplicate insertions if we processed it locally already (simple check by ID)
             const exists = (prev[table] as any[]).some(item => item.id === payload.new.id);
             if (exists) return prev;
             return { ...prev, [table]: [...(prev[table] as any[]), payload.new] };
          });
      } else if (payload.eventType === 'UPDATE') {
          setHospitalState(prev => ({ ...prev, [table]: (prev[table] as any[]).map(item => item.id === payload.new.id ? payload.new : item) }));
      } else if (payload.eventType === 'DELETE') {
          setHospitalState(prev => ({ ...prev, [table]: (prev[table] as any[]).filter(item => item.id !== payload.old.id) }));
      }
  };

  // --- Logic Handlers ---

  const handleAllocateBed = async (patientId: string, bedId: string) => {
    // 1. Calculate Inventory Impact (Business Logic)
    const patient = hospitalState.patients.find(p => p.id === patientId);
    let updatedInventory = hospitalState.inventory;
    const procedureType = (patient && (patient.acuity_score === 3 || patient.acuity_score === 4)) ? 'Surgery' : 'Routine';
    
    // We calculate the NEW inventory state locally to know what values to push to DB
    updatedInventory = predictInventoryUsage(hospitalState.inventory, procedureType);

    if (isSupabaseConnected && supabase) {
        // DB Updates
        await supabase.from('patients').update({ status: 'Admitted', assigned_bed_id: bedId }).eq('id', patientId);
        await supabase.from('beds').update({ is_occupied: true, assigned_patient_id: patientId }).eq('id', bedId);
        
        // Batch update inventory (Not efficient for large datasets but fine for demo)
        updatedInventory.forEach(async (item) => {
           // Only update if changed to save bandwidth? For now, simple update.
           await supabase.from('inventory').update({ current_stock: item.current_stock }).eq('id', item.id);
        });
    } else {
        // Local Updates
        setHospitalState(prev => {
            const updatedPatients = prev.patients.map(p => 
                p.id === patientId ? { ...p, status: 'Admitted' as const, assigned_bed_id: bedId } : p
            );
            
            const updatedBeds = prev.beds.map(b => 
                b.id === bedId ? { ...b, is_occupied: true, assigned_patient_id: patientId } : b
            );

            return {
                ...prev,
                patients: updatedPatients,
                beds: updatedBeds,
                inventory: updatedInventory
            };
        });
    }
  };

  const handleToggleReserve = async (bedId: string) => {
    const bed = hospitalState.beds.find(b => b.id === bedId);
    if (!bed) return;

    if (isSupabaseConnected && supabase) {
        await supabase.from('beds').update({ is_reserved: !bed.is_reserved }).eq('id', bedId);
    } else {
        setHospitalState(prev => ({
            ...prev,
            beds: prev.beds.map(b => 
                b.id === bedId ? { ...b, is_reserved: !b.is_reserved } : b
            )
        }));
    }
  };

  const handleAddPatient = async (patient: Patient) => {
    if (isSupabaseConnected && supabase) {
        await supabase.from('patients').insert(patient);
    } else {
        setHospitalState(prev => ({
            ...prev,
            patients: [...prev.patients, patient]
        }));
    }
  };

  const handleAddBed = async (ward: string, skillLevel: number) => {
    // Robust ID Generation: Find the max existing ID number and increment
    const maxId = hospitalState.beds.reduce((max, bed) => {
        const parts = bed.id.split('-');
        if (parts.length === 2) {
             const num = parseInt(parts[1]);
             return !isNaN(num) ? Math.max(max, num) : max;
        }
        return max;
    }, 0);
    
    const newBedId = `BED-${(maxId + 1).toString().padStart(2, '0')}`;
    const newBed: Bed = {
        id: newBedId,
        ward: ward,
        is_occupied: false,
        is_reserved: false,
        required_skill_level: skillLevel,
        assigned_patient_id: null,
        assigned_staff_id: null
    };

    if (isSupabaseConnected && supabase) {
        await supabase.from('beds').insert(newBed);
    } else {
        setHospitalState(prev => ({
            ...prev,
            beds: [...prev.beds, newBed]
        }));
    }
  };

  const handleSurge = async () => {
      setIsSurgeLoading(true);
      const scenario = await generateSurgeScenario();
      
      if (scenario) {
          // Prepare patients
          const patientsToAdd = scenario.generatedPatients.map((p, idx) => ({
              ...p,
              id: `SURGE-${Date.now()}-${idx}`,
              history: [],
              status: 'Waiting',
              assigned_bed_id: null,
              assigned_staff_id: null
          } as Patient));

          // Bulk Insert
          if (isSupabaseConnected && supabase) {
              await supabase.from('patients').insert(patientsToAdd);
          } else {
              setHospitalState(prev => ({
                  ...prev,
                  patients: [...prev.patients, ...patientsToAdd]
              }));
          }
          
          setSurgeAlert(`MCI ALERT: ${scenario.scenarioTitle} - ${scenario.scenarioDescription}`);
          setTimeout(() => setSurgeAlert(null), 10000); // Clear alert after 10s
      }
      
      setIsSurgeLoading(false);
  }

  const handleAssignStaff = async (patientId: string, staffId: string | null) => {
    if (isSupabaseConnected && supabase) {
        await supabase.from('patients').update({ assigned_staff_id: staffId }).eq('id', patientId);
    } else {
        setHospitalState(prev => ({
            ...prev,
            patients: prev.patients.map(p => 
                p.id === patientId ? { ...p, assigned_staff_id: staffId } : p
            )
        }));
    }
  };

  const handleTreatPatient = async (patientId: string, treatment: string, notes: string, newDetailedCondition?: string) => {
    const patient = hospitalState.patients.find(p => p.id === patientId);
    if (!patient) return;

    const newEvent: MedicalEvent = {
        date: new Date().toLocaleDateString(),
        condition: patient.condition,
        treatment: treatment,
        notes: notes
    };
    
    const newHistory = [newEvent, ...patient.history];
    const updates: any = { history: newHistory };
    if (newDetailedCondition) updates.detailed_condition = newDetailedCondition;

    if (isSupabaseConnected && supabase) {
        await supabase.from('patients').update(updates).eq('id', patientId);
    } else {
        setHospitalState(prev => ({
            ...prev,
            patients: prev.patients.map(p => {
                if (p.id !== patientId) return p;
                return {
                    ...p,
                    history: newHistory,
                    detailed_condition: newDetailedCondition || p.detailed_condition
                };
            })
        }));
    }
  };

  const handleAddStaff = async (newStaff: Staff) => {
    if (isSupabaseConnected && supabase) {
        await supabase.from('staff').insert(newStaff);
    } else {
        setHospitalState(prev => ({
            ...prev,
            staff: [...prev.staff, newStaff]
        }));
    }
  };

  const handleUpdateStaff = async (updatedStaff: Staff) => {
    if (isSupabaseConnected && supabase) {
        await supabase.from('staff').update(updatedStaff).eq('id', updatedStaff.id);
    } else {
        setHospitalState(prev => ({
            ...prev,
            staff: prev.staff.map(s => s.id === updatedStaff.id ? updatedStaff : s)
        }));
    }
  };

  // --- Inventory Handlers ---

  const handleAddInventoryItem = async (item: InventoryItem) => {
    if (isSupabaseConnected && supabase) {
        await supabase.from('inventory').insert(item);
    } else {
        setHospitalState(prev => ({
            ...prev,
            inventory: [...prev.inventory, item]
        }));
    }
  };

  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    if (isSupabaseConnected && supabase) {
        await supabase.from('inventory').update(updatedItem).eq('id', updatedItem.id);
    } else {
        setHospitalState(prev => ({
            ...prev,
            inventory: prev.inventory.map(i => i.id === updatedItem.id ? updatedItem : i)
        }));
    }
  };

  // --- Appointment Handlers (Refined with Optimistic Updates) ---

  const handleAddAppointment = async (appt: Omit<Appointment, 'id'>) => {
    // Fallback ID for local/offline usage
    const tempId = `APT-${Date.now()}`;
    const newAppt = { ...appt, id: tempId };

    if (isSupabaseConnected && supabase) {
        try {
            // Try DB insert and select the returned record to get the real ID
            const { data, error } = await supabase.from('appointments').insert(appt).select();
            if (error) throw error;
            
            // If we get data back, update local state immediately to ensure UI reflects change
            if (data && data.length > 0) {
                const insertedAppt = data[0] as Appointment;
                setHospitalState(prev => ({
                    ...prev,
                    appointments: [...prev.appointments, insertedAppt]
                }));
            }
        } catch (e) {
            console.warn("Supabase insert failed, falling back to local state", e);
            // Fallback: If DB fails (e.g. permissions), ensure it's at least in local state
            setHospitalState(prev => ({
                ...prev,
                appointments: [...prev.appointments, newAppt]
            }));
        }
    } else {
        setHospitalState(prev => ({
            ...prev,
            appointments: [...prev.appointments, newAppt]
        }));
    }
  };

  const handleUpdateAppointment = async (updatedAppt: Appointment) => {
    // 1. Optimistic Update: Update local state IMMEDIATELY
    // This ensures the UI is responsive even if the network is slow or fails
    setHospitalState(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === updatedAppt.id ? updatedAppt : a)
    }));

    // 2. Sync with Supabase (if connected)
    if (isSupabaseConnected && supabase) {
        try {
            const { error } = await supabase.from('appointments').update(updatedAppt).eq('id', updatedAppt.id);
            if (error) {
                console.error("Supabase update failed:", error);
                // Optional: Revert local state here if strict consistency is required, 
                // but for this prototype, keeping local state allows the user to continue working.
            }
        } catch (e) {
            console.error("Supabase network error:", e);
        }
    }
  };

  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    setShowReportModal(true);
    const report = await generateHospitalReport(hospitalState);
    setReportText(report);
    setIsGeneratingReport(false);
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- Render ---

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'trauma':
        return (
          <div className="space-y-6">
            <ForecastWidget state={hospitalState} />
            <TraumaCenter 
              state={hospitalState} 
              onAllocate={handleAllocateBed} 
              onAddPatient={handleAddPatient}
              onAssignStaff={handleAssignStaff}
              onTreat={handleTreatPatient}
              onToggleReserve={handleToggleReserve}
              onSurge={handleSurge}
              onAddBed={handleAddBed}
            />
          </div>
        );
      case 'staffing':
        return <Staffing 
          state={hospitalState} 
          onAddStaff={handleAddStaff}
          onUpdateStaff={handleUpdateStaff}
        />;
      case 'inventory':
        return <Inventory 
          state={hospitalState} 
          onAddItem={handleAddInventoryItem}
          onUpdateItem={handleUpdateInventoryItem}
        />;
      case 'appointments':
        return <Appointments 
            state={hospitalState}
            onAdd={handleAddAppointment}
            onUpdate={handleUpdateAppointment}
        />;
      default:
        return <TraumaCenter 
          state={hospitalState} 
          onAllocate={handleAllocateBed} 
          onAddPatient={handleAddPatient} 
          onAssignStaff={handleAssignStaff}
          onTreat={handleTreatPatient}
          onToggleReserve={handleToggleReserve}
          onSurge={handleSurge}
          onAddBed={handleAddBed}
        />;
    }
  };

  return (
    <>
      <Layout 
        currentTab={activeTab} 
        onTabChange={setActiveTab} 
        user={currentUser}
        onLogout={handleLogout}
      >
        {/* Status Bar */}
        <div className={`px-6 py-2 text-xs font-semibold flex justify-end items-center gap-2 ${isSupabaseConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {isSupabaseConnected ? (
                <>
                    <Wifi className="w-3 h-3" /> Live Database Connected
                </>
            ) : (
                <>
                    <WifiOff className="w-3 h-3" /> 
                    {connectionError ? `Offline (${connectionError})` : 'Offline Demo Mode'}
                    {connectionError && (
                        <button onClick={() => window.location.reload()} className="ml-2 underline hover:text-slate-800" title="Retry">
                             <RefreshCw className="w-3 h-3 inline" />
                        </button>
                    )}
                </>
            )}
        </div>
        
        {/* Surge Alert Banner */}
        {surgeAlert && (
            <div className="bg-red-600 text-white px-6 py-3 font-bold flex items-center gap-3 animate-fade-in-down shadow-lg">
                <Zap className="w-5 h-5 animate-pulse text-yellow-300" />
                {surgeAlert}
            </div>
        )}

        {/* Global Loading Overlay (for Surge) */}
        {isSurgeLoading && (
             <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                 <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
                     <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
                     <h3 className="text-xl font-bold text-red-700">SIMULATING DISASTER</h3>
                     <p className="text-slate-500">Generating Mass Casualty Scenario via AI...</p>
                 </div>
             </div>
        )}

        {renderContent()}
      </Layout>

      {/* Floating Menus & Widgets */}
      <ChatBot state={hospitalState} />
      
      {/* New AI Features Menu */}
      <FeaturesMenu state={hospitalState} onRefresh={fetchLatestData} />

      {/* Floating AI Report Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={handleGenerateAIReport}
          className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg shadow-purple-900/40 flex items-center justify-center transition-transform hover:scale-105"
          title="Generate AI SitRep"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* AI Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold text-lg">ihOS Intelligence Report</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="hover:bg-white/20 p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 min-h-[200px] max-h-[70vh] overflow-y-auto">
              {isGeneratingReport ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 animate-pulse">Analyzing hospital metrics...</p>
                </div>
              ) : (
                <div className="prose prose-slate">
                  <p className="whitespace-pre-line text-slate-700 leading-relaxed">{reportText}</p>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300"
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

export default App;