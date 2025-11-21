import React from 'react';
import { Defect, ReviewStatus, BoundingBox } from '../types';
import { DEFECT_COLORS } from '../constants';

interface Props {
  defects: Defect[];
  selectedDefectId: string | null;
  onSelectDefect: (id: string) => void;
  imageWidth: number;
  imageHeight: number;
}

export const BoundingBoxDisplay: React.FC<Props> = ({ 
  defects, 
  selectedDefectId, 
  onSelectDefect 
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {defects.map((defect) => {
        // Hide rejected defects from view unless needed, but typically we want to see them crossed out
        const isRejected = defect.status === ReviewStatus.REJECTED;
        const isSelected = defect.id === selectedDefectId;
        
        // Coordinates are % (0-100)
        const { ymin, xmin, ymax, xmax } = defect.boundingBox;
        
        const style: React.CSSProperties = {
            top: `${ymin}%`,
            left: `${xmin}%`,
            width: `${xmax - xmin}%`,
            height: `${ymax - ymin}%`,
            position: 'absolute',
        };

        const colorClass = isRejected ? 'border-gray-400 bg-gray-400/20' : DEFECT_COLORS[defect.code] || DEFECT_COLORS['MISC'];
        const borderStyle = isSelected ? 'border-4 shadow-lg z-10' : 'border-2 opacity-80';

        return (
          <div
            key={defect.id}
            style={style}
            className={`pointer-events-auto cursor-pointer transition-all duration-200 hover:opacity-100 ${colorClass} ${borderStyle}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelectDefect(defect.id);
            }}
          >
            {isSelected && (
                <span className="absolute -top-6 left-0 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-sm whitespace-nowrap">
                    {defect.code} ({Math.round(defect.confidence * 100)}%)
                </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
