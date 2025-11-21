import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDashboardStats } from '../services/dbService';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Language } from '../types';
import { t } from '../i18n';

interface DashboardProps {
  lang: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const [stats, setStats] = useState<ReturnType<typeof getDashboardStats>>({ 
      total: 0, pendingReview: 0, completed: 0, chartData: [] 
  });

  useEffect(() => {
    setStats(getDashboardStats());
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t(lang, 'dashboard')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
            <div className="bg-blue-100 p-4 rounded-full mr-4">
                <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{t(lang, 'pending_review')}</p>
                <p className="text-3xl font-bold text-slate-800">{stats.pendingReview}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
            <div className="bg-green-100 p-4 rounded-full mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{t(lang, 'completed')}</p>
                <p className="text-3xl font-bold text-slate-800">{stats.completed}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
            <div className="bg-indigo-100 p-4 rounded-full mr-4">
                <AlertTriangle className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{t(lang, 'total_inspections')}</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{t(lang, 'defect_frequency')}</h3>
        <div className="h-64 w-full">
            {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                    No data available.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
