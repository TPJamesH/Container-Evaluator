import { Inspection, Defect, ReviewStatus, DefectCode, Severity, ManifestItem, PricingRule } from '../types';
import { generateDefaultPricingRules } from '../constants';

const STORAGE_KEY = 'container_inspections_db_v3'; 
const MANIFEST_KEY = 'container_manifest_v1';
const PRICING_KEY = 'container_pricing_rules_v1';

// Initialize DB if empty
const init = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(MANIFEST_KEY)) {
    localStorage.setItem(MANIFEST_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(PRICING_KEY)) {
    localStorage.setItem(PRICING_KEY, JSON.stringify(generateDefaultPricingRules()));
  }
};

export const getInspections = (): Inspection[] => {
  init();
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getInspectionById = (id: string): Inspection | undefined => {
  const list = getInspections();
  return list.find(i => i.id === id);
};

export const saveInspection = (inspection: Inspection): void => {
  const list = getInspections();
  list.unshift(inspection); // Add to top
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const updateInspection = (inspection: Inspection): void => {
    const list = getInspections();
    const idx = list.findIndex(i => i.id === inspection.id);
    if (idx !== -1) {
        list[idx] = inspection;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
};

export const updateInspectionDefects = (inspectionId: string, updatedDefects: Defect[]): void => {
  const list = getInspections();
  const idx = list.findIndex(i => i.id === inspectionId);
  if (idx !== -1) {
    list[idx].defects = updatedDefects;
    
    const allReviewed = updatedDefects.every(d => d.status !== ReviewStatus.PENDING);
    if (allReviewed) {
      list[idx].status = 'COMPLETED';
    } else {
      list[idx].status = 'REVIEW_NEEDED';
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
};

// Manifest / Queue functions
export const getManifest = (): ManifestItem[] => {
  init();
  const data = localStorage.getItem(MANIFEST_KEY);
  return data ? JSON.parse(data) : [];
};

export const addToManifest = (containerNumbers: string[]) => {
  const current = getManifest();
  const newItems: ManifestItem[] = containerNumbers.map((num): ManifestItem => ({
    id: `man-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    containerNumber: num.toUpperCase().trim(),
    status: 'PENDING',
    addedAt: new Date().toISOString()
  })).filter(item => item.containerNumber.length > 0);
  
  localStorage.setItem(MANIFEST_KEY, JSON.stringify([...current, ...newItems]));
};

export const updateManifestStatus = (containerNumber: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
  const list = getManifest();
  const idx = list.findIndex(i => i.containerNumber === containerNumber && i.status !== 'COMPLETED');
  if (idx !== -1) {
    list[idx].status = status;
    localStorage.setItem(MANIFEST_KEY, JSON.stringify(list));
  }
};

export const clearManifest = () => {
    localStorage.removeItem(MANIFEST_KEY);
    init();
};

export const getNextPendingManifestItem = (): ManifestItem | undefined => {
    const list = getManifest();
    return list.find(i => i.status === 'PENDING');
};

// Pricing Rules
export const getPricingRules = (): PricingRule[] => {
    init();
    const data = localStorage.getItem(PRICING_KEY);
    return data ? JSON.parse(data) : [];
};

export const savePricingRules = (rules: PricingRule[]) => {
    localStorage.setItem(PRICING_KEY, JSON.stringify(rules));
};

// Stats
export const getDashboardStats = () => {
  const list = getInspections();
  const total = list.length;
  const pendingReview = list.filter(i => i.status === 'REVIEW_NEEDED' || i.status === 'ANALYZING').length;
  const completed = list.filter(i => i.status === 'COMPLETED').length;
  
  const defectsByType: Record<string, number> = {};
  list.forEach(i => {
    i.defects.forEach(d => {
      if (d.status !== ReviewStatus.REJECTED) {
        defectsByType[d.code] = (defectsByType[d.code] || 0) + 1;
      }
    });
  });

  const chartData = Object.entries(defectsByType).map(([name, value]) => ({ name, value }));
  
  return { total, pendingReview, completed, chartData };
};