import React from 'react';
import { motion } from 'motion/react';
import { Save, RefreshCw, Trash2, Plus, Loader2 } from 'lucide-react';
import { ApiConnectionErrorDisplay } from '../components/ApiConnectionErrorDisplay';
import { theme } from '../theme';

export function TransmutationSettings({ data, onSave, onAdd, onUpdate, onDelete, syncStandards, isLoading, syncError }) {
  const [localData, setLocalData] = React.useState([]);

  // Keep local state in sync when data prop updates from API
  React.useEffect(() => {
    if (data && data.length > 0) {
      setLocalData([...data].sort((a, b) => b.min - a.min));
    }
  }, [data]);

  // Handle early returns after hooks are initialized
  if (syncError) return <ApiConnectionErrorDisplay />;

  const handleUpdate = (index, field, value) => {
    const updatedRow = { ...localData[index], [field]: value };
    setLocalData(prev => prev.map((row, i) => i === index ? updatedRow : row));
  };

  const handleAdd = async () => {
    const newEntry = { min: 0, max: 0, transmutedValue: 60 };
    try {
      const response = await onAdd(newEntry);
      // Assuming onAdd returns the newly created entry with its ID
      setLocalData(prev => [...prev, response.data].sort((a, b) => b.min - a.min));
      alert("Entry added successfully!");
    } catch (err) {
      alert("Failed to add entry: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRemove = async (index) => {
    const item = localData[index];
    const itemId = item.id || item.Id;

    if (itemId && itemId > 0) {
      if (window.confirm(`Are you sure you want to delete this entry (Min: ${item.min}, Max: ${item.max})? This cannot be undone.`)) {
        try {
          await onDelete(itemId);
          setLocalData(prev => prev.filter((_, i) => i !== index));
          alert("Entry deleted successfully!");
        } catch (err) {
          alert("Failed to delete entry: " + (err.response?.data?.message || err.message));
        }
      }
    } else {
      // If it's a new unsaved row, just remove it from local state
      setLocalData(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveRow = async (index) => {
    const row = localData[index];
    const itemId = row.id || row.Id;

    if (itemId && itemId > 0) {
      try {
        await onUpdate(itemId, row);
        alert("Entry updated successfully!");
      } catch (err) {
        alert("Failed to update entry: " + (err.response?.data?.message || err.message));
      }
    } else {
      // This case should ideally be handled by handleAdd, but as a fallback
      alert("This entry needs to be added first before it can be updated.");
    }
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
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 ${theme.styles.card}`}>
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
            onClick={onSave} // onSave now triggers a full re-sync
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span className="font-bold uppercase tracking-widest text-xs">Loading Transmutation Table...</span>
        </div>
      )}

      <div className={`${theme.styles.card} overflow-hidden`}>
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
              <tr key={idx} className="hover:bg-white/50 transition-colors">
                <td className="p-4">
                  <input
                    type="number"
                    step="0.01"
                    value={row.min}
                    onChange={(e) => handleUpdate(idx, 'min', parseFloat(e.target.value || '0'))}
                    onBlur={() => handleSaveRow(idx)} // Save on blur
                    className={`w-full bg-transparent font-bold text-slate-700 outline-none focus:text-blue-600 ${theme.styles.input} !p-0 !px-1 !border-none !shadow-none`}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    step="0.01"
                    value={row.max}
                    onChange={(e) => handleUpdate(idx, 'max', parseFloat(e.target.value || '0'))}
                    onBlur={() => handleSaveRow(idx)} // Save on blur
                    className={`w-full bg-transparent font-bold text-slate-700 outline-none focus:text-blue-600 ${theme.styles.input} !p-0 !px-1 !border-none !shadow-none`}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={row.transmutedValue}
                    onChange={(e) => handleUpdate(idx, 'transmutedValue', parseInt(e.target.value || '0'))}
                    onBlur={() => handleSaveRow(idx)} // Save on blur
                    className={`w-full bg-transparent font-black text-slate-900 outline-none focus:text-blue-600 ${theme.styles.input} !p-0 !px-1 !border-none !shadow-none`}
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