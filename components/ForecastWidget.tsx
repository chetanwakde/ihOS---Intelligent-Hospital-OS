import React from 'react';
import { TrendingUp, Users, Package, AlertCircle } from 'lucide-react';
import { HospitalState } from '../types';

export const ForecastWidget: React.FC<{ state: HospitalState }> = ({ state }) => {
  // Calculate real-time metrics for accuracy
  const totalBeds = state.beds.length;
  const occupiedBeds = state.beds.filter(b => b.is_occupied).length;
  const bedsFree = totalBeds - occupiedBeds;
  
  const lowStockCount = state.inventory.filter(i => i.current_stock <= i.reorder_threshold).length;
  const staffFatigueCount = state.staff.filter(s => s.current_fatigue_score > 70).length;

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-700">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-blue-300">
        <TrendingUp className="w-4 h-4" /> Live Capacity Monitor
      </h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
            <div className="text-2xl font-bold text-emerald-400">{bedsFree}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Beds Available</div>
        </div>
        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>{lowStockCount}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Low Stock</div>
        </div>
        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
            <div className={`text-2xl font-bold ${staffFatigueCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{staffFatigueCount}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Staff Alerts</div>
        </div>
      </div>
    </div>
  );
};