import React, { useState } from 'react';
import { HospitalState, Staff, StaffRole } from '../types';
import { checkFatigueRisks } from '../services/logic';
import { Clock, AlertTriangle, Battery, BatteryWarning, BatteryCharging, Plus, Edit2, X, CheckCircle, User, Briefcase, Activity } from 'lucide-react';

interface Props {
  state: HospitalState;
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (staff: Staff) => void;
}

export const Staffing: React.FC<Props> = ({ state, onAddStaff, onUpdateStaff }) => {
  const atRiskStaff = checkFatigueRisks(state.staff);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<Partial<Staff>>({});

  const getFatigueColor = (score: number) => {
    if (score < 30) return 'text-green-500';
    if (score < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFatigueIcon = (score: number) => {
      if (score < 30) return <BatteryCharging className={`w-5 h-5 ${getFatigueColor(score)}`} />;
      if (score < 70) return <Battery className={`w-5 h-5 ${getFatigueColor(score)}`} />;
      return <BatteryWarning className={`w-5 h-5 ${getFatigueColor(score)} animate-pulse`} />;
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      id: `S-${Math.floor(Math.random() * 1000) + 100}`,
      name: '',
      role: StaffRole.NURSE,
      skill_level: 5,
      current_fatigue_score: 0,
      max_hours_shift: 12,
      current_hours_worked: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({ ...staff });
    setIsModalOpen(true);
  };

  const calculateAutoFatigue = (current: number, max: number) => {
    if (max <= 0) return 0;
    const ratio = current / max;
    let fatigue = ratio * 100;
    
    // Simulate non-linear fatigue accumulation
    // If working more than 8 hours, fatigue accelerates
    if (current > 8) {
        fatigue += (current - 8) * 5; 
    }
    
    return Math.min(100, Math.max(0, Math.round(fatigue)));
  };

  const handleHoursChange = (value: string, field: 'current' | 'max') => {
    const numValue = Math.max(0, parseInt(value) || 0);
    
    setFormData(prev => {
        const current = field === 'current' ? numValue : (prev.current_hours_worked || 0);
        const max = field === 'max' ? numValue : (prev.max_hours_shift || 12);
        
        return {
            ...prev,
            [field === 'current' ? 'current_hours_worked' : 'max_hours_shift']: numValue,
            current_fatigue_score: calculateAutoFatigue(current, max)
        };
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.id) return;

    if (editingStaff) {
      onUpdateStaff(formData as Staff);
    } else {
      onAddStaff(formData as Staff);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Risk Dashboard */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-xl font-bold mb-1">Fatigue Management Monitor</h2>
                <p className="text-slate-400 text-sm">Real-time monitoring of staff physical and cognitive load.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-slate-800 p-3 rounded-lg text-center min-w-[100px]">
                    <div className="text-3xl font-bold text-red-400">{atRiskStaff.length}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Critical Risks</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg text-center min-w-[100px]">
                    <div className="text-3xl font-bold text-blue-400">{state.staff.length}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Active Staff</div>
                </div>
            </div>
        </div>
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Current Duty Roster</h3>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Staff
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="p-4">Staff ID</th>
                        <th className="p-4">Staff Member</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Shift Hours</th>
                        <th className="p-4">Fatigue Score</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {state.staff.map(staff => {
                        const isRisk = staff.current_fatigue_score > 70;
                        return (
                            <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono text-xs text-slate-400">{staff.id}</td>
                                <td className="p-4 font-medium text-slate-900">{staff.name}</td>
                                <td className="p-4 text-slate-600">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                                        {staff.role}
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-1">Skill Lvl: {staff.skill_level}</div>
                                </td>
                                <td className="p-4 text-slate-600 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {staff.current_hours_worked} / {staff.max_hours_shift} hrs
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${isRisk ? 'bg-red-500' : 'bg-green-500'}`} 
                                                style={{ width: `${staff.current_fatigue_score}%` }}
                                            />
                                        </div>
                                        <span className={`text-sm font-bold ${getFatigueColor(staff.current_fatigue_score)}`}>
                                            {staff.current_fatigue_score}%
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {isRisk ? (
                                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                                            <AlertTriangle className="w-4 h-4" /> Risk
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <button 
                                      onClick={() => openEditModal(staff)}
                                      className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                                      title="Edit Details"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {editingStaff ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                {editingStaff ? 'Edit Staff Assignments' : 'Add New Staff'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Staff ID</label>
                  <input 
                    type="text" 
                    value={formData.id || ''}
                    disabled={!!editingStaff} // ID usually immutable after creation
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-500 font-mono text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Dr. John Doe"
                      className="w-full pl-9 p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as StaffRole})}
                      className="w-full pl-9 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-900"
                    >
                      {Object.values(StaffRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Skill Level (1-10)</label>
                  <input 
                    type="number" 
                    min="1" max="10"
                    value={formData.skill_level || 1}
                    onChange={(e) => setFormData({...formData, skill_level: parseInt(e.target.value)})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Shift Hours</label>
                   <div className="flex items-center gap-2">
                     <div className="w-full">
                        <label className="sr-only">Current Hours</label>
                        <input 
                            type="number" 
                            min="0"
                            value={formData.current_hours_worked || 0}
                            onChange={(e) => handleHoursChange(e.target.value, 'current')}
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                     </div>
                     <span className="text-slate-400 font-bold">/</span>
                     <div className="w-full">
                        <label className="sr-only">Max Hours</label>
                        <input 
                            type="number" 
                            min="1"
                            value={formData.max_hours_shift || 12}
                            onChange={(e) => handleHoursChange(e.target.value, 'max')}
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                     </div>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fatigue Score (%)</label>
                  <div className="relative">
                    <Activity className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={formData.current_fatigue_score || 0}
                      onChange={(e) => setFormData({...formData, current_fatigue_score: parseInt(e.target.value)})}
                      className="w-full pl-9 p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">*Auto-calculates based on shift hours</p>
                </div>

              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!formData.name}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> {editingStaff ? 'Update Staff' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};