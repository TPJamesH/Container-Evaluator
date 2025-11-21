import React, { useState, useEffect } from 'react';
import { ManifestItem, Language } from '../types';
import { getManifest, addToManifest, clearManifest } from '../services/dbService';
import { t } from '../i18n';
import { Play, Plus, Trash2, FileSpreadsheet, ScanLine } from 'lucide-react';

interface ManifestProps {
  onStartInspection: (containerNumber: string) => void;
  lang: Language;
}

export const Manifest: React.FC<ManifestProps> = ({ onStartInspection, lang }) => {
  const [queue, setQueue] = useState<ManifestItem[]>([]);
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = () => {
    setQueue(getManifest());
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    const numbers = input.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
    addToManifest(numbers);
    setInput('');
    setShowInput(false);
    loadQueue();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the queue?')) {
        clearManifest();
        loadQueue();
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const numbers = text.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
            addToManifest(numbers);
            loadQueue();
        };
        reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t(lang, 'queue')}</h2>
        <div className="flex space-x-2">
            <button 
                onClick={handleClear}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title={t(lang, 'clear_queue')}
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setShowInput(!showInput)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
                <Plus className="w-4 h-4" />
                <span>{t(lang, 'add_containers')}</span>
            </button>
        </div>
      </div>

      {showInput && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6 animate-fade-in">
            <label className="block text-sm font-medium text-slate-700 mb-2">{t(lang, 'manifest_intro')}</label>
            <textarea 
                className="w-full bg-white border border-slate-300 rounded-lg p-3 h-32 font-mono text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="CNTR123456&#10;CNTR789012"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    <label className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-600 text-sm">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>{t(lang, 'upload_csv')}</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} />
                    </label>
                    <button className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-600 text-sm" onClick={() => alert('Not implemented in MVP')}>
                        <ScanLine className="w-4 h-4" />
                        <span>{t(lang, 'scan_barcode')}</span>
                    </button>
                </div>
                <button 
                    onClick={handleAdd}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                    {t(lang, 'add_to_queue')}
                </button>
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 font-semibold text-slate-700">{t(lang, 'container_number')}</th>
                    <th className="p-4 font-semibold text-slate-700">{t(lang, 'status')}</th>
                    <th className="p-4 font-semibold text-slate-700 text-right">{t(lang, 'action')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {queue.length === 0 && (
                    <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400">{t(lang, 'queue_empty')}</td>
                    </tr>
                )}
                {queue.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-medium text-slate-800">{item.containerNumber}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {t(lang, item.status.toLowerCase() as any)}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                            {item.status !== 'COMPLETED' && (
                                <button 
                                    onClick={() => onStartInspection(item.containerNumber)}
                                    className="inline-flex items-center space-x-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                    <span>{t(lang, 'start_inspection')}</span>
                                    <Play className="w-3 h-3" />
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};