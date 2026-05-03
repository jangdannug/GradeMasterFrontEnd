
import React from 'react';
import { motion } from 'motion/react';
import { Save, RefreshCw, Trash2, Plus } from 'lucide-react';

export function TransmutationSettings({ data, onSave }) {
  const [localData, setLocalData] = React.useState([...data].sort((a, b) => b.min - a.min));

  const handleUpdate = (index, field, value) => {
    const next = [...localData];
    next[index] = { ...next[index], [field]: value };
    setLocalData(next);
  };

  const handleAdd = () => {
    setLocalData([{ min: 0, max: 0, transmutedValue: 60 }, ...localData]);
  };

  const handleRemove = (index) => {
    setLocalData(localData.filter((_, i) => i !== index));
  };

  const sortByMin = () => {
    setLocalData([...localData].sort((a, b) => b.min - a.min));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Transmutation Table</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Configure the relationship between Initial Grades and Transmuted Grades (DepEd Order 8, s. 2015).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={sortByMin}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all"
          >
            <RefreshCw size={14} /> Sort High to Low
          </button>
          <button
            onClick={() => onSave(localData)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Min. Initial Grade</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Max. Initial Grade</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Transmuted Grade</th>
              <th className="p-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {localData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <input
                    type="number"
                    step="0.01"
                    value={row.min}
                    onChange={(e) => handleUpdate(idx, 'min', parseFloat(e.target.value))}
                    className="w-full bg-transparent font-bold text-slate-700 outline-none focus:text-blue-600"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    step="0.01"
                    value={row.max}
                    onChange={(e) => handleUpdate(idx, 'max', parseFloat(e.target.value))}
                    className="w-full bg-transparent font-bold text-slate-700 outline-none focus:text-blue-600"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={row.transmutedValue}
                    onChange={(e) => handleUpdate(idx, 'transmutedValue', parseInt(e.target.value))}
                    className="w-full bg-transparent font-black text-slate-900 outline-none focus:text-blue-600"
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
    </motion.div>
  );
}