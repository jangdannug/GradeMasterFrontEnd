import React from "react";
import { motion } from "motion/react";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import { ApiConnectionErrorDisplay } from "../components/ApiConnectionErrorDisplay";
import { theme } from "../theme";
import api from "../services/api";

export function DescriptorSettings({
  data,
  onSave,
  onDelete,
  syncStandards,
  isLoading,
  syncError,
}) {
  // localData acts as a "Draft" buffer so typing is fast and responsive.
  // We sync it with the "data" prop (the source of truth from the API) whenever it changes.
  const [localData, setLocalData] = React.useState(data || []);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    // ALWAYS sync local state when the parent data (API source of truth) changes.
    // This ensures that after a Save, the local rows receive their database IDs.
    if (data) setLocalData([...data]);
  }, [data]);

  // Handle early returns after hooks are initialized
  if (syncError) return <ApiConnectionErrorDisplay />;

  const handleUpdate = (index, field, value) => {
    const next = [...localData];
    next[index] = { ...next[index], [field]: value };
    setLocalData(next);
  };

  const handleAdd = () => {
    setLocalData([
      ...localData,
      { min: 0, max: 50, label: "NEW", color: "text-slate-500" },
    ]);
  };

  const handleRemove = async (index) => {
    const item = localData[index];
    // Robust ID detection: Check for 'id', 'Id', or 'dbId'
    // We also check if it's NOT a placeholder or zero
    const itemId = item.id !== undefined ? item.id : item.Id;

    console.log(`[DescriptorSettings] Attempting delete for:`, { label: item.label, itemId });

    // If the item has a valid ID that isn't null/undefined/empty
    if (itemId !== undefined && itemId !== null && itemId !== "" && itemId !== 0) {
      const confirmMsg = `Are you sure you want to delete "${item.label}"?\n\nThis will remove it from the database immediately.`;
      
      if (window.confirm(confirmMsg)) {
        try {
          // If you don't see this in your console, the itemId check above failed.
          console.log(`%c [API] CALLING HttpDelete -> /api/standards/deleteDescriptors/${itemId} `, 'background: #222; color: #bada55; font-weight: bold;');
          
          if (typeof onDelete === 'function') {
            await onDelete(itemId);
          } else {
            throw new Error("onDelete function is missing from props. Check App.jsx drilling.");
          }
          setLocalData(localData.filter((_, i) => i !== index));
        } catch (err) {
          alert("Failed to delete descriptor: " + err);
        }
      }
    } else {
      // Just a new row not yet saved to the database
      console.log("[DescriptorSettings] Unsaved item. Removing from view only.");
      setLocalData(localData.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use the onSave handler which now calls the correct POST endpoint via service/hook
      const result = await onSave(localData);
      // Immediately re-sync to get the latest IDs for any newly inserted rows
      if (syncStandards) {
        await syncStandards();
      }
      alert(result?.message || "Descriptors saved successfully.");
    } catch (err) {
      alert("Failed to save descriptors: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const colorMap = {
    "text-emerald-600": "#059669",
    "text-blue-600": "#2563eb",
    "text-amber-600": "#d97706",
    "text-orange-600": "#ea580c",
    "text-rose-600": "#e11d48",
    "text-slate-600": "#475569",
    "text-indigo-600": "#4f46e5",
    "text-purple-600": "#9333ea",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 ${theme.styles.card}`}
      >
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">
            Grading Descriptors
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Define the labels and ranges for finalized term grades.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span className="font-bold uppercase tracking-widest text-xs">
            Loading Descriptors...
          </span>
        </div>
      )}

      <div className={`${theme.styles.card} overflow-hidden`}>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Min Grade
              </th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Max Grade
              </th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Label
              </th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Color (TW Class)
              </th>
              <th className="p-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {localData.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/50 transition-colors">
                <td className="p-4">
                  <input
                    type="number"
                    value={row.min}
                    onChange={(e) =>
                      handleUpdate(idx, "min", parseInt(e.target.value))
                    }
                    className={`w-16 bg-transparent font-bold text-slate-700 outline-none ${theme.styles.input} !p-0 !px-1 !border-none !shadow-none`}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={row.max}
                    onChange={(e) =>
                      handleUpdate(idx, "max", parseInt(e.target.value))
                    }
                    className={`w-16 bg-transparent font-bold text-slate-700 outline-none ${theme.styles.input} !p-0 !px-1 !border-none !shadow-none`}
                  />
                </td>
                <td className="p-4">
                  <input
                    key={`${idx}-${row.color}`}
                    type="text"
                    value={row.label}
                    onChange={(e) => handleUpdate(idx, "label", e.target.value)}
                    style={{
                      color: colorMap[row.color] || "#475569",
                    }}
                    className={`w-full bg-transparent font-black uppercase italic outline-none ${theme.styles.input} !p-0 !px-1 !border-none !shadow-none`}
                  />
                </td>
                <td className="p-4">
                  <select
                    value={row.color}
                    onChange={(e) => handleUpdate(idx, "color", e.target.value)}
                    style={{ color: colorMap[row.color] }}
                    className={`w-full bg-transparent font-mono text-[10px] font-bold outline-none ${theme.styles.input} !p-0 !px-1 !border-none !shadow-none`}
                  >
                    {Object.keys(colorMap).map((colorClass) => (
                      <option
                        key={colorClass}
                        value={colorClass}
                        style={{ color: colorMap[colorClass] }}
                        className="bg-white"
                      >
                        {colorClass.replace("text-", "").toUpperCase()}
                      </option>
                    ))}
                  </select>
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

      {/* <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h4 className="text-blue-800 font-bold text-sm mb-2 uppercase tracking-tight">
          Available Colors
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            "text-emerald-600",
            "text-blue-600",
            "text-amber-600",
            "text-orange-600",
            "text-rose-600",
            "text-slate-600",
            "text-indigo-600",
            "text-purple-600",
          ].map((c) => (
            <span
              key={c}
              className={`px-2 py-1 bg-white rounded text-[10px] font-bold border border-blue-100 ${c}`}
            >
              {c}
            </span>
          ))}
        </div>
      </div> */}
    </motion.div>
  );
}
