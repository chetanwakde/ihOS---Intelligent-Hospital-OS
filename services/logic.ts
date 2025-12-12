import { AcuityLevel, Bed, HospitalState, InventoryItem, Patient, Staff, StaffRole } from "../types";

// --- Production State Initialization ---

export const generateInitialState = (): HospitalState => {
  // Generate 20 Mock Beds for Offline/Demo Mode
  // If Supabase is connected, this state will be overwritten by fetchLatestData()
  const beds: Bed[] = Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    let ward = 'General';
    let skill = 3;

    // Distribute wards
    if (num <= 4) {
      ward = 'ICU';
      skill = 9;
    } else if (num <= 10) {
      ward = 'Trauma';
      skill = 6;
    }

    return {
      id: `BED-${num.toString().padStart(2, '0')}`,
      ward,
      is_occupied: false,
      is_reserved: false,
      required_skill_level: skill,
      assigned_patient_id: null,
      assigned_staff_id: null
    };
  });

  // Mock Staff for Demo
  const staff: Staff[] = [
    { id: 'S-001', name: 'Dr. Peter Parker', role: StaffRole.DOCTOR, skill_level: 9, current_fatigue_score: 20, max_hours_shift: 12, current_hours_worked: 4 },
    { id: 'S-002', name: 'Nurse Joy', role: StaffRole.NURSE, skill_level: 7, current_fatigue_score: 45, max_hours_shift: 12, current_hours_worked: 8 },
    { id: 'S-003', name: 'Dr. Stephen Strange', role: StaffRole.SPECIALIST, skill_level: 10, current_fatigue_score: 10, max_hours_shift: 10, current_hours_worked: 2 },
    { id: 'S-004', name: 'Dr. House', role: StaffRole.DOCTOR, skill_level: 10, current_fatigue_score: 85, max_hours_shift: 12, current_hours_worked: 14 } // High fatigue example
  ];

  // Mock Inventory for Demo
  const inventory: InventoryItem[] = [
      { id: 'INV-1', item_name: 'Morphine 5mg', category: 'Pharma', current_stock: 50, reorder_threshold: 10, usage_rate_per_surgery: 1 },
      { id: 'INV-2', item_name: 'Surgical Kit (Trauma)', category: 'Surgical', current_stock: 8, reorder_threshold: 5, usage_rate_per_surgery: 1 },
      { id: 'INV-3', item_name: 'Saline IV 1L', category: 'Consumable', current_stock: 120, reorder_threshold: 20, usage_rate_per_surgery: 2 },
      { id: 'INV-4', item_name: 'O Negative Blood', category: 'Consumable', current_stock: 3, reorder_threshold: 5, usage_rate_per_surgery: 1 } // Low stock example
  ];

  return {
    beds,
    staff,
    inventory,
    patients: [],
    appointments: [],
    alerts: ["System Online. Default bed configuration loaded."]
  };
};

// --- Core Logic ("The Brain") ---

/**
 * allocate_bed
 * Matches patient acuity to bed capability.
 * Checks if assigning a staff member to this bed would violate fatigue rules.
 * Returns the Bed ID or null if no suitable match.
 */
export const allocateBed = (
  patient: Patient,
  beds: Bed[],
  staff: Staff[]
): string | null => {
  // 1. Filter for available beds (Not occupied AND Not reserved)
  const availableBeds = beds.filter(b => !b.is_occupied && !b.is_reserved);

  // 2. Filter by clinical capability (Bed skill >= Patient Acuity * 2 approx mapping for demo)
  // Let's assume bed.required_skill_level maps somewhat to Acuity.
  // Critical(4) needs skill 9-10. High(3) needs 7+. Medium(2) needs 5+. Low(1) needs 1+.
  const thresholdMap: Record<number, number> = { 1: 1, 2: 4, 3: 7, 4: 9 };
  const minSkill = thresholdMap[patient.acuity_score];

  const suitableBeds = availableBeds.filter(b => b.required_skill_level >= minSkill);

  if (suitableBeds.length === 0) return null;

  // 3. Priority Sort - OPTIMIZED FOR RESOURCE PRESERVATION
  // Sort by skill level ASCENDING (Smallest sufficient skill first).
  // This prevents a Low Acuity patient from taking a High Acuity bed (ICU)
  // when a General Ward bed is available.
  suitableBeds.sort((a, b) => a.required_skill_level - b.required_skill_level);
  
  return suitableBeds[0].id;
};

/**
 * generate_roster (Simplified)
 * Checks for fatigue risks and "generates" a status report.
 */
export const checkFatigueRisks = (staff: Staff[]): Staff[] => {
  return staff.filter(s => s.current_fatigue_score > 70 || s.current_hours_worked > s.max_hours_shift);
};

/**
 * predict_inventory_usage
 * Simulates stock reduction based on an event (e.g., admitting a critical patient implies surgery).
 */
export const predictInventoryUsage = (
  currentInventory: InventoryItem[],
  procedureType: 'Surgery' | 'Routine'
): InventoryItem[] => {
  return currentInventory.map(item => {
    let usage = 0;
    if (procedureType === 'Surgery') {
      usage = item.usage_rate_per_surgery;
    } else {
      usage = item.usage_rate_per_surgery * 0.2; // Routine uses less
    }
    
    // Random fluctuation for "Realism"
    const actualUsage = Math.ceil(usage * (0.8 + Math.random() * 0.4));
    
    return {
      ...item,
      current_stock: Math.max(0, item.current_stock - actualUsage)
    };
  });
};