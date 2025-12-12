export enum AcuityLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum StaffRole {
  NURSE = 'Nurse',
  DOCTOR = 'Doctor',
  SPECIALIST = 'Specialist',
  ADMIN = 'Admin'
}

export interface MedicalEvent {
  date: string;
  condition: string;
  treatment: string;
  notes?: string;
}

export interface ClinicalInsights {
  deterioration_probability: string; // "Low", "Moderate", "High"
  risk_factors: string[];
  suggested_labs: string[];
  recommended_intervention: string;
  last_updated: string;
}

export interface Vitals {
  hr?: number;
  bp_sys?: number;
  bp_dia?: number;
  spo2?: number;
  rr?: number;
  temp?: number;
}

export interface TriageEntry {
  score: number;
  severity: string;
  recommended_actions: string[];
  timestamp: string;
}

export interface Patient {
  id: string;
  name: string;
  acuity_score: AcuityLevel;
  condition: string;
  detailed_condition: string;
  history: MedicalEvent[];
  status: 'Waiting' | 'Admitted' | 'Discharged';
  assigned_bed_id: string | null;
  assigned_staff_id: string | null;
  clinical_insights?: ClinicalInsights; // New AI Field
  
  // New Fields
  vitals?: Vitals;
  triage_score?: number;
  triage_history?: TriageEntry[];
  risk_profile?: {
    sepsis_risk: number; // 0-100
    deterioration_risk: number; // 0-100
    rationale: string;
  };
}

export interface Bed {
  id: string;
  ward: string;
  is_occupied: boolean;
  is_reserved?: boolean;
  required_skill_level: number; // 1-10 scale
  assigned_patient_id: string | null;
  assigned_staff_id: string | null; // Primary nurse/doc
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  skill_level: number; // 1-10
  current_fatigue_score: number; // 0-100, where 100 is exhausted
  max_hours_shift: number;
  current_hours_worked: number;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  category: 'Consumable' | 'Surgical' | 'Pharma';
  current_stock: number;
  reorder_threshold: number;
  usage_rate_per_surgery: number; // Avg units used per procedure
  predicted_runout_date?: string;
  last_reorder_suggestion?: {
    suggested_qty: number;
    urgency: 'Low' | 'Medium' | 'High';
    reason: string;
  };
}

export interface Appointment {
  id: string;
  doctor_name: string;
  patient_name: string;
  time: string;
  reason: string;
  status: 'Confirmed' | 'Cancelled';
}

export interface MedicalDocument {
  id: string;
  patient_id?: string;
  filename: string;
  summary?: string;
  critical_flags?: string[];
  uploaded_at: string;
}

export interface ForecastData {
  horizon: 24 | 48;
  beds_free: number;
  inventory_alerts: number;
  staff_shortage: number;
}

export interface HospitalState {
  patients: Patient[];
  beds: Bed[];
  staff: Staff[];
  inventory: InventoryItem[];
  appointments: Appointment[];
  alerts: string[];
  // New state containers
  documents?: MedicalDocument[]; 
  forecasts?: ForecastData[];
}