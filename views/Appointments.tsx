import React, { useState } from 'react';
import { Appointment, HospitalState, StaffRole } from '../types';
import { Calendar, Plus, Search, User, Clock, CheckCircle, XCircle, FileText, X, Save, Stethoscope } from 'lucide-react';

interface Props {
  state: HospitalState;
  onAdd: (appt: Omit<Appointment, 'id'>) => void;
  onUpdate: (appt: Appointment) => void;
}

export const Appointments: React.FC<Props> = ({ state, onAdd, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Confirmed' | 'Cancelled'>('All');
  
  const [formData, setFormData] = useState<Partial<Appointment>>({
      patient_name: '',
      doctor_name: '',
      time: '',
      reason: '',
      status: 'Confirmed'
  });

  const doctors = state.staff.filter(s => s.role === StaffRole.DOCTOR || s.role === StaffRole.SPECIALIST);

  const filteredAppointments = state.appointments.filter(appt => {
      const matchesSearch = appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            appt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' || appt.status === filter;
      return matchesSearch && matchesFilter;
  });

  const handleOpenAdd = () => {
      setFormData({
          patient_name: '',
          doctor_name: doctors.length > 0 ? doctors[0].name : '',
          time: '',
          reason: '',
          status: 'Confirmed'
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.patient_name && formData.doctor_name && formData.time) {
          onAdd(formData as Omit<Appointment, 'id'>);
          // Reset filter to 'All' so the user sees the new appointment immediately
          setFilter('All'); 
          setIsModalOpen(false);
      }
  };

  const toggleStatus = (appt: Appointment) => {
      const newStatus = appt.status === 'Confirmed' ? 'Cancelled' : 'Confirmed';
      onUpdate({ ...appt, status: newStatus });
  };

  const formatDateTime = (dateStr: string) => {
      try {
          return new Date(dateStr).toLocaleString([], { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          });
      } catch (e) {
          return dateStr;
      }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm text-indigo-500">
                  <Calendar className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="font-bold text-indigo-800 text-lg">{state.appointments.filter(a => a.status === 'Confirmed').length}</h3>
                  <p className="text-indigo-600 text-xs">Confirmed Visits</p>
              </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
               <div className="bg-white p-3 rounded-full shadow-sm text-slate-500">
                  <User className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="font-bold text-slate-800 text-lg">{doctors.length}</h3>
                  <p className="text-slate-600 text-xs">Available Doctors</p>
              </div>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-sm flex items-center justify-center gap-2 font-medium transition-colors"
          >
              <Plus className="w-6 h-6" /> New Appointment
          </button>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg">Scheduled Visits</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search patient or doctor..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer"
                >
                    <option value="All">All Status</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                          <th className="p-4 border-b border-slate-100">Date & Time</th>
                          <th className="p-4 border-b border-slate-100">Patient</th>
                          <th className="p-4 border-b border-slate-100">Doctor</th>
                          <th className="p-4 border-b border-slate-100">Reason</th>
                          <th className="p-4 border-b border-slate-100">Status</th>
                          <th className="p-4 border-b border-slate-100 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredAppointments.length === 0 ? (
                          <tr>
                              <td colSpan={6} className="p-10 text-center text-slate-400">
                                  No appointments found.
                              </td>
                          </tr>
                      ) : (
                          filteredAppointments.map((appt, idx) => (
                              <tr key={appt.id || idx} className="hover:bg-slate-50 transition-colors group">
                                  <td className="p-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                                          <Clock className="w-4 h-4 text-slate-400" />
                                          {formatDateTime(appt.time)}
                                      </div>
                                  </td>
                                  <td className="p-4 font-medium text-slate-900">
                                      {appt.patient_name}
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-center gap-2 text-slate-600">
                                          <Stethoscope className="w-4 h-4 text-blue-500" />
                                          {appt.doctor_name}
                                      </div>
                                  </td>
                                  <td className="p-4 text-slate-500 text-sm">
                                      {appt.reason}
                                  </td>
                                  <td className="p-4">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                          appt.status === 'Confirmed' 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : 'bg-red-50 text-red-700 border-red-200'
                                      }`}>
                                          {appt.status === 'Confirmed' ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                                          {appt.status}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right">
                                      <button 
                                          onClick={() => toggleStatus(appt)}
                                          className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors border ${
                                              appt.status === 'Confirmed' 
                                                ? 'text-red-600 border-red-200 hover:bg-red-50' 
                                                : 'text-green-600 border-green-200 hover:bg-green-50'
                                          }`}
                                      >
                                          {appt.status === 'Confirmed' ? 'Cancel' : 'Reconfirm'}
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                  <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-blue-600" /> New Appointment
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Patient Name</label>
                          <input 
                              type="text" 
                              required
                              value={formData.patient_name}
                              onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                              placeholder="e.g. Sarah Connor"
                              className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date & Time</label>
                             <input 
                                  type="datetime-local" 
                                  required
                                  value={formData.time || ''}
                                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                                  className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                              />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Doctor</label>
                             <select
                                  value={formData.doctor_name}
                                  onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
                                  className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                              >
                                  <option value="">Select Doctor</option>
                                  {doctors.map(d => (
                                      <option key={d.id} value={d.name}>{d.name} ({d.role})</option>
                                  ))}
                                  <option value="Dr. On Call">Dr. On Call</option>
                              </select>
                        </div>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reason for Visit</label>
                          <textarea 
                              value={formData.reason}
                              onChange={(e) => setFormData({...formData, reason: e.target.value})}
                              placeholder="e.g. Annual checkup, Flu symptoms..."
                              className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none h-20 text-slate-900"
                          />
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                          <button 
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                          >
                              <Save className="w-4 h-4" /> Save Appointment
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};