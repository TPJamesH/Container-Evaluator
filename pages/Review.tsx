import React, { useEffect, useState } from 'react';
import { Inspection, ReviewStatus, Severity, UserRole, User, Language, ContainerSide } from '../types';
import { getInspectionById, updateInspectionDefects, getNextPendingManifestItem } from '../services/dbService';
import { BoundingBoxDisplay } from '../components/BoundingBoxDisplay';
import { Check, X, ChevronLeft, FileText, Image as ImageIcon, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';
import { t, tSide, tDefect } from '../i18n';

interface ReviewProps {
  inspectionId: string;
  user: User;
  onBack: () => void;
  onNextContainer: (containerNumber: string) => void;
  lang: Language;
}

export const Review: React.FC<ReviewProps> = ({ inspectionId, user, onBack, onNextContainer, lang }) => {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [nextContainer, setNextContainer] = useState<string | null>(null);

  useEffect(() => {
    const data = getInspectionById(inspectionId);
    if (data) {
      setInspection(data);
      if (data.images.length > 0) setActiveImageId(data.images[0].id);
      if (data.defects.length > 0) setSelectedDefectId(data.defects[0].id);
    }
    // Check if there is a next item in queue
    const pending = getNextPendingManifestItem();
    if (pending) {
        setNextContainer(pending.containerNumber);
    } else {
        setNextContainer(null);
    }
  }, [inspectionId]);

  useEffect(() => {
      if (selectedDefectId && inspection) {
          const defect = inspection.defects.find(d => d.id === selectedDefectId);
          if (defect && defect.imageId !== activeImageId) {
              setActiveImageId(defect.imageId);
          }
      }
  }, [selectedDefectId]);

  const handleDefectAction = (defectId: string, action: ReviewStatus) => {
    if (!inspection) return;
    
    const updatedDefects = inspection.defects.map(d => 
      d.id === defectId ? { ...d, status: action } : d
    );

    setInspection({ ...inspection, defects: updatedDefects });
    updateInspectionDefects(inspection.id, updatedDefects);
  };

  const generatePDF = () => {
    if (!inspection) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Inspection Report: ${inspection.containerNumber}`, 10, 10);
    doc.setFontSize(12);
    doc.text(`Inspector: ${inspection.inspectorId}`, 10, 20);
    doc.text(`Date: ${new Date(inspection.timestamp).toLocaleString()}`, 10, 30);
    doc.text(`Status: ${inspection.status}`, 10, 40);
    
    let y = 60;
    doc.setFontSize(14);
    doc.text("Defects Found:", 10, 50);
    doc.setFontSize(10);

    inspection.defects.forEach(d => {
        const status = d.status === ReviewStatus.REJECTED ? '(REJECTED)' : '';
        const img = inspection.images.find(i => i.id === d.imageId);
        const sideName = img ? tSide(lang, img.side) : 'Unknown';
        
        doc.text(`- [${sideName}] ${tDefect(lang, d.code)} (${d.severity}) - ${d.description} ${status}`, 10, y);
        y += 10;
        if (y > 280) { doc.addPage(); y = 10; }
    });
    
    doc.save(`report_${inspection.containerNumber}.pdf`);
  };

  if (!inspection) return <div className="p-10 text-center">Loading...</div>;

  const activeImage = inspection.images.find(i => i.id === activeImageId);
  const currentImageDefects = inspection.defects.filter(d => d.imageId === activeImageId);
  const isReviewer = user.role === UserRole.REVIEWER || user.role === UserRole.ADMIN;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-lg font-bold text-slate-800">{inspection.containerNumber}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inspection.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {t(lang, inspection.status.toLowerCase() as any) || inspection.status}
                </span>
            </div>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={generatePDF}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50"
            >
                <FileText className="w-4 h-4" />
                <span>{t(lang, 'export_pdf')}</span>
            </button>
            {nextContainer && (
                <button 
                    onClick={() => onNextContainer(nextContainer)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 shadow-md"
                >
                    <span>{t(lang, 'next_container')}</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Image Area */}
        <div className="flex-1 bg-slate-900 relative flex flex-col overflow-hidden">
             {/* View Tabs */}
             <div className="flex overflow-x-auto bg-slate-800 border-b border-slate-700 p-1 space-x-1 scrollbar-hide">
                {inspection.images.map(img => (
                    <button
                        key={img.id}
                        onClick={() => setActiveImageId(img.id)}
                        className={`px-3 py-2 text-xs font-medium whitespace-nowrap rounded flex items-center space-x-2 transition-colors ${activeImageId === img.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <ImageIcon className="w-3 h-3" />
                        <span>{tSide(lang, img.side)}</span>
                        <span className="ml-1 bg-slate-900/50 px-1.5 rounded-full text-[10px]">
                             {inspection.defects.filter(d => d.imageId === img.id).length}
                        </span>
                    </button>
                ))}
             </div>

             <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
                 {activeImage ? (
                    <div className="relative max-w-full max-h-full p-4">
                        <img 
                            ref={setImgRef}
                            src={activeImage.url} 
                            alt={activeImage.side} 
                            className="max-h-[80vh] w-auto object-contain rounded shadow-lg"
                        />
                        {imgRef && (
                            <BoundingBoxDisplay 
                                defects={currentImageDefects}
                                selectedDefectId={selectedDefectId}
                                onSelectDefect={setSelectedDefectId}
                                imageWidth={imgRef.width}
                                imageHeight={imgRef.height}
                            />
                        )}
                    </div>
                 ) : (
                     <div className="text-slate-500">Select an image</div>
                 )}
             </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-1/3 md:h-full shadow-xl z-30">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-700">
                    {t(lang, 'defects_detected')} <span className="text-slate-400 font-normal">({currentImageDefects.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    {activeImage ? `${tSide(lang, activeImage.side)} view` : ''}
                </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {currentImageDefects.length === 0 && (
                    <div className="text-center p-8 text-slate-400">
                        <Check className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>{t(lang, 'no_defects')}</p>
                    </div>
                )}
                {currentImageDefects.map(d => (
                    <div 
                        key={d.id}
                        onClick={() => setSelectedDefectId(d.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedDefectId === d.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${d.status === ReviewStatus.REJECTED ? 'bg-gray-200 text-gray-500 line-through' : 'bg-slate-100 text-slate-700'}`}>
                                    {tDefect(lang, d.code)}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    d.severity === Severity.HIGH ? 'bg-red-100 text-red-700' : 
                                    d.severity === Severity.MEDIUM ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-green-100 text-green-700'
                                }`}>
                                    {d.severity}
                                </span>
                            </div>
                            <div className="flex space-x-1">
                                {d.status === ReviewStatus.ACCEPTED && <Check className="w-4 h-4 text-green-500" />}
                                {d.status === ReviewStatus.REJECTED && <X className="w-4 h-4 text-red-500" />}
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">{d.description}</p>
                        
                        {selectedDefectId === d.id && isReviewer && (
                            <div className="flex space-x-2 mt-2 pt-2 border-t border-slate-100">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDefectAction(d.id, ReviewStatus.ACCEPTED); }}
                                    className={`flex-1 py-1.5 text-xs rounded font-medium flex items-center justify-center space-x-1 transition-colors ${d.status === ReviewStatus.ACCEPTED ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                >
                                    <Check className="w-3 h-3" /> <span>{t(lang, 'confirm')}</span>
                                </button>
                                <button 
                                     onClick={(e) => { e.stopPropagation(); handleDefectAction(d.id, ReviewStatus.REJECTED); }}
                                     className={`flex-1 py-1.5 text-xs rounded font-medium flex items-center justify-center space-x-1 transition-colors ${d.status === ReviewStatus.REJECTED ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                                >
                                    <X className="w-3 h-3" /> <span>{t(lang, 'reject')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};