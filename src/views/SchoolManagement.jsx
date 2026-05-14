import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Plus, Pencil, Trash2, X, Save, Loader2, MapPin } from 'lucide-react';
import schoolService from '../services/schoolService';
import { theme } from '../theme';

export function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const data = await schoolService.getSchools();
      setSchools(data);
    } catch (err) { alert(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSchool) {
        await schoolService.updateSchool(editingSchool.id, formData);
      } else {
        await schoolService.createSchool(formData);
      }
      setIsModalOpen(false);
      fetchSchools();
    } catch (err) { alert(err); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this school?")) return;
    try {
      await schoolService.deleteSchool(id);
      fetchSchools();
    } catch (err) { alert(err); }
  };

  const openModal = (school = null) => {
    setEditingSchool(school);
    setFormData(school || { id: '', name: '', address: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Manage Schools</h2>
            <p className="text-xs text-slate-500 font-medium">Configure Department of Education recognized institutions.</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg"
        >
          <Plus size={16} /> Add School
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">School ID</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Address</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map(school => (
                <tr key={school.id} className="hover:bg-white/50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-blue-600">{school.id}</td>
                  <td className="p-4 font-black text-slate-800 uppercase text-sm">{school.name}</td>
                  <td className="p-4 text-slate-500 text-xs flex items-center gap-2">
                    <MapPin size={12} className="shrink-0" /> {school.address}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(school)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(school.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmit}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-black uppercase tracking-tight">{editingSchool ? 'Edit School' : 'Register New School'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School ID (Numeric)</label>
                  <input 
                    required
                    disabled={!!editingSchool}
                    type="text" 
                    placeholder="e.g. 300123"
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className={`${theme.styles.input} disabled:opacity-50`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. STO. NINO HIGH SCHOOL"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    className={theme.styles.input}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                  <textarea 
                    required
                    placeholder="Street, Barangay, City, Province"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                    className={`${theme.styles.input} h-24 resize-none`}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`${theme.styles.button} ${theme.styles.buttonPrimary} w-full py-4 mt-2 disabled:opacity-50`}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {editingSchool ? 'Update School' : 'Save School'}</>}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}