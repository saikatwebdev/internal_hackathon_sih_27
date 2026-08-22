import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Plus, GraduationCap, Camera } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

const ClassroomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    room_code: '',
    room_name: '',
    building: '',
    scanner_id: '',
    scanner_secret: 'scanner123',
  });

  const loadRooms = async () => {
    try {
      const res = await axiosClient.get('/classrooms');
      setRooms(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadRooms(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/classrooms', formData);
      setShowModal(false);
      loadRooms();
    } catch (err) { alert('Failed to create classroom'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Classrooms & Scanner Kiosks</h3>
          <p className="text-xs text-slate-400">Configure lecture halls, labs, and assigned QR/Face scanner devices</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Classroom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rooms.map((r) => (
          <div key={r.id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{r.room_code}</h4>
                  <p className="text-xs text-slate-400">{r.room_name || r.building}</p>
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center">
                <Camera className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Scanner ID
              </span>
              <span className="font-mono font-bold text-white">{r.scanner_id}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Add Classroom Scanner</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" placeholder="Room Code (e.g. LAB-204)" required value={formData.room_code} onChange={(e) => setFormData({ ...formData, room_code: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <input type="text" placeholder="Room Name / Lab Title" value={formData.room_name} onChange={(e) => setFormData({ ...formData, room_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <input type="text" placeholder="Building Block" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <input type="text" placeholder="Unique Scanner ID (e.g. LAB204_SCANNER)" required value={formData.scanner_id} onChange={(e) => setFormData({ ...formData, scanner_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white" />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white">Save Classroom</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomManagement;
