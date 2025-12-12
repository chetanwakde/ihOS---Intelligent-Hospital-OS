import React, { useState } from 'react';
import { HospitalState, InventoryItem } from '../types';
import { Package, TrendingDown, Plus, Search, Edit2, AlertTriangle, CheckCircle, X, Save } from 'lucide-react';

interface Props {
  state: HospitalState;
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem: (item: InventoryItem) => void;
}

export const Inventory: React.FC<Props> = ({ state, onAddItem, onUpdateItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Default form state for new item
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
      category: 'Consumable',
      current_stock: 0,
      reorder_threshold: 10,
      usage_rate_per_surgery: 1
  });

  // Filter logic
  const filteredInventory = state.inventory.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = state.inventory.filter(i => i.current_stock <= i.reorder_threshold);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
        id: `INV-${Math.floor(Math.random() * 10000)}`,
        category: 'Consumable',
        current_stock: 0,
        reorder_threshold: 10,
        usage_rate_per_surgery: 1,
        item_name: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
      setEditingItem(item);
      setFormData({ ...item });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.item_name || formData.current_stock === undefined) return;

      if (editingItem) {
          onUpdateItem(formData as InventoryItem);
      } else {
          onAddItem(formData as InventoryItem);
      }
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm text-red-500">
                  <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="font-bold text-red-800 text-lg">{lowStockItems.length} Critical Items</h3>
                  <p className="text-red-600 text-xs">Below reorder threshold</p>
              </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm text-blue-500">
                  <Package className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="font-bold text-blue-800 text-lg">{state.inventory.length} Total SKUs</h3>
                  <p className="text-blue-600 text-xs">Pharma, Surgical, Consumable</p>
              </div>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl shadow-sm flex items-center justify-center gap-2 font-medium transition-colors"
          >
              <Plus className="w-6 h-6" /> Add Medicine / Item
          </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        {/* Table Header / Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg">Inventory Master List</h3>
            <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search medicines..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="p-4 border-b border-slate-100">Item Name</th>
                        <th className="p-4 border-b border-slate-100">Category</th>
                        <th className="p-4 border-b border-slate-100 text-center">Stock Level</th>
                        <th className="p-4 border-b border-slate-100 text-center">Threshold</th>
                        <th className="p-4 border-b border-slate-100 text-center">Status</th>
                        <th className="p-4 border-b border-slate-100 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredInventory.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                No inventory items found matching "{searchTerm}".
                            </td>
                        </tr>
                    ) : (
                        filteredInventory.map(item => {
                            const isCritical = item.current_stock <= item.reorder_threshold;
                            return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 font-medium text-slate-900">
                                        {item.item_name}
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs border ${
                                            item.category === 'Pharma' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            item.category === 'Surgical' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-slate-800">{item.current_stock}</div>
                                    </td>
                                    <td className="p-4 text-center text-slate-500">
                                        {item.reorder_threshold}
                                    </td>
                                    <td className="p-4 text-center">
                                        {isCritical ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                                <AlertTriangle className="w-3 h-3" /> Reorder
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                <CheckCircle className="w-3 h-3" /> OK
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleOpenEdit(item)}
                                            className="text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-colors"
                                            title="Edit Stock"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
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
                        {editingItem ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
                        {editingItem ? 'Edit Inventory Item' : 'Add New Medicine / Item'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Item Name</label>
                        <input 
                            type="text" 
                            required
                            value={formData.item_name}
                            onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                            placeholder="e.g. Amoxicillin 500mg"
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            >
                                <option value="Consumable">Consumable</option>
                                <option value="Pharma">Pharma</option>
                                <option value="Surgical">Surgical</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usage Rate</label>
                             <input 
                                type="number" 
                                min="0" step="0.1"
                                value={formData.usage_rate_per_surgery}
                                onChange={(e) => setFormData({...formData, usage_rate_per_surgery: parseFloat(e.target.value)})}
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Current Stock</label>
                             <input 
                                type="number" 
                                required
                                min="0"
                                value={formData.current_stock}
                                onChange={(e) => setFormData({...formData, current_stock: parseInt(e.target.value)})}
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reorder Threshold</label>
                             <input 
                                type="number" 
                                required
                                min="0"
                                value={formData.reorder_threshold}
                                onChange={(e) => setFormData({...formData, reorder_threshold: parseInt(e.target.value)})}
                                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors ${editingItem ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            <Save className="w-4 h-4" /> {editingItem ? 'Save Changes' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};