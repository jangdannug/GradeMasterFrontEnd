
import React from 'react';
import { motion } from 'motion/react';
import { Save, Plus, Trash2 } from 'lucide-react';

export function DescriptorSettings({ data, onSave }) {
  const [localData, setLocalData] = React.useState([...data]);

  const handleUpdate = (index, field, value) => {
    const next = [...localData];
    next[index] = { ...next[index], [field]: value };
    setLocalData(next);
  };

  const handleAdd = () => {
    setLocalData([...localData, { min: 0, max: 50, label: 'NEW', color: 'text-slate-500' }]);
  };

  const handleRemove = (index) => {
    setLocalData(localData.filter((_, i) => i !== index));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Grading Descriptors</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Define the labels and ranges for finalized term grades.</p>
        </div>
        <button 
          onClick={() => onSave(localData)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Save size={14} /> Save Changes
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Min Grade</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Max Grade</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Label</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Color (TW Class)</th>
              <th className="p-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {localData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <input 
                    type="number" 
                    value={row.min}
                    onChange={(e) => handleUpdate(idx, 'min', parseInt(e.target.value))}
                    className="w-16 bg-transparent font-bold text-slate-700 outline-none"
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="number" 
                    value={row.max}
                    onChange={(e) => handleUpdate(idx, 'max', parseInt(e.target.value))}
                    className="w-16 bg-transparent font-bold text-slate-700 outline-none"
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="text" 
                    value={row.label}
                    onChange={(e) => handleUpdate(idx, 'label', e.target.value)}
                    className={`w-full bg-transparent font-black uppercase italic outline-none ${row.color}`}
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="text" 
                    value={row.color}
                    onChange={(e) => handleUpdate(idx, 'color', e.target.value)}
                    className="w-full bg-transparent font-mono text-[10px] text-slate-400 outline-none"
                  />
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleRemove(idx)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button 
          onClick={handleAdd}
          className="w-full p-4 flex items-center justify-center gap-2 text-xs font-black uppercase text-blue-600 hover:bg-blue-50 transition-all border-t border-slate-100"
        >
          <Plus size={16} /> Add New Entry
        </button>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h4 className="text-blue-800 font-bold text-sm mb-2 uppercase tracking-tight">Available Colors</h4>
        <div className="flex flex-wrap gap-2">
          {['text-emerald-600', 'text-blue-600', 'text-amber-600', 'text-orange-600', 'text-rose-600', 'text-slate-600', 'text-indigo-600', 'text-purple-600'].map(c => (
            <span key={c} className={`px-2 py-1 bg-white rounded text-[10px] font-bold border border-blue-100 ${c}`}>{c}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}