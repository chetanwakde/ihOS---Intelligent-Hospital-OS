import { GoogleGenAI } from "@google/genai";
import { Patient, Vitals, InventoryItem, Staff } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const modelId = 'gemini-2.5-flash';

// --- 1. AI Triage Assistant ---
export const analyzeTriage = async (symptoms: string, vitals: Vitals, age: number) => {
  if (!apiKey) {
      // Mock Response for Demo
      return {
          triage_score: 75,
          severity: "High",
          recommended_bed_type: "Trauma",
          recommended_actions: ["Immediate IV Access", "ECG Monitoring", "Prepare for CT Scan"]
      };
  }
  const prompt = `
    Act as a Clinical Triage Officer.
    Patient: Age ${age}. Symptoms: "${symptoms}".
    Vitals: HR ${vitals.hr}, BP ${vitals.bp_sys}/${vitals.bp_dia}, SpO2 ${vitals.spo2}, Temp ${vitals.temp}.
    
    Return JSON:
    {
      "triage_score": number (0-100),
      "severity": "Critical" | "High" | "Moderate" | "Low",
      "recommended_bed_type": "ICU" | "Trauma" | "General",
      "recommended_actions": ["list", "of", "3", "actions"]
    }
  `;
  try {
    const resp = await ai.models.generateContent({ model: modelId, contents: prompt, config: { responseMimeType: 'application/json' } });
    return resp.text ? JSON.parse(resp.text) : null;
  } catch (e) { console.error(e); return null; }
};

// --- 2. Risk Prediction ---
export const predictPatientRisk = async (patient: Patient) => {
  if (!apiKey) {
      return {
          sepsis_risk: 45,
          deterioration_risk: 30,
          rationale: "Elevated heart rate and history of infection suggests moderate sepsis risk."
      };
  }
  const prompt = `
    Analyze risk for patient: ${patient.name}, Condition: ${patient.condition}.
    Vitals: ${JSON.stringify(patient.vitals || {})}.
    History: ${JSON.stringify(patient.history)}.
    
    Predict risk of Sepsis and General Deterioration (0-100).
    Return JSON:
    {
      "sepsis_risk": number,
      "deterioration_risk": number,
      "rationale": "one sentence explanation"
    }
  `;
  try {
    const resp = await ai.models.generateContent({ model: modelId, contents: prompt, config: { responseMimeType: 'application/json' } });
    return resp.text ? JSON.parse(resp.text) : null;
  } catch (e) { return null; }
};

// --- 3. Document Summarizer ---
export const summarizeDocumentContent = async (text: string) => {
  if (!apiKey) {
      return {
          summary: "Patient presents with acute symptoms consistent with previous history. Vitals stable but monitoring recommended.",
          critical_flags: ["Hypertension history", "Penicillin Allergy"]
      };
  }
  const prompt = `
    Summarize this medical text. Identify critical flags.
    Text: "${text.substring(0, 5000)}..."
    
    Return JSON:
    {
      "summary": "short summary",
      "critical_flags": ["flag1", "flag2"]
    }
  `;
  try {
    const resp = await ai.models.generateContent({ model: modelId, contents: prompt, config: { responseMimeType: 'application/json' } });
    return resp.text ? JSON.parse(resp.text) : null;
  } catch (e) { return null; }
};

// --- 4. Forecasting ---
export const generateForecast = async (bedsTotal: number, bedsOccupied: number, inventoryCount: number) => {
  if (!apiKey) {
      return {
        horizon: 24,
        beds_free: Math.max(0, bedsTotal - bedsOccupied - 2),
        inventory_alerts: 3,
        staff_shortage: 1
      };
  }
  const prompt = `
    Forecast hospital load for next 24h.
    Current: ${bedsOccupied}/${bedsTotal} beds occupied. Inventory items: ${inventoryCount}.
    Assume standard trauma center arrival rates.
    
    Return JSON:
    {
      "horizon": 24,
      "beds_free": number (predicted),
      "inventory_alerts": number (predicted low stock items),
      "staff_shortage": number (predicted staff deficit)
    }
  `;
  try {
    const resp = await ai.models.generateContent({ model: modelId, contents: prompt, config: { responseMimeType: 'application/json' } });
    return resp.text ? JSON.parse(resp.text) : null;
  } catch (e) { return null; }
};

// --- 5. Staff Load Balancer ---
export const balanceStaffLoad = async (staff: Staff[], patientsCount: number) => {
  // Mock logic if no API key
  if (!apiKey) {
      const fatiguedStaff = staff.filter(s => s.current_fatigue_score > 60);
      return {
          suggestions: fatiguedStaff.map(s => ({
              staff_id: s.id,
              action: "Mandatory Rest Period",
              reason: `Fatigue score ${s.current_fatigue_score}% indicates cognitive decline risk.`
          })).concat(fatiguedStaff.length === 0 ? [{
               staff_id: "General",
               action: "Maintain Roster",
               reason: "All staff within safety limits."
          }] : [])
      };
  }
  
  const prompt = `
    Analyze staff load. Total Patients: ${patientsCount}.
    Staff: ${JSON.stringify(staff.map(s => ({id: s.id, role: s.role, fatigue: s.current_fatigue_score})))}.
    
    Suggest reassignments to minimize fatigue > 70%.
    Return JSON:
    {
      "suggestions": [
        { "staff_id": "id", "action": "Reassign/Rest", "reason": "reason" }
      ]
    }
  `;
  try {
    const resp = await ai.models.generateContent({ model: modelId, contents: prompt, config: { responseMimeType: 'application/json' } });
    return resp.text ? JSON.parse(resp.text) : null;
  } catch (e) { return null; }
};

// --- 6. Inventory Reorder ---
export const checkReorderNeeds = async (inventory: InventoryItem[]) => {
  const lowItems = inventory.filter(i => i.current_stock <= i.reorder_threshold);
  
  if (!apiKey) {
      if (lowItems.length === 0) return [];
      return lowItems.map(i => ({
          item_name: i.item_name,
          suggested_qty: i.reorder_threshold * 3,
          urgency: i.current_stock === 0 ? 'High' : 'Medium',
          reason: `Stock (${i.current_stock}) below safety threshold (${i.reorder_threshold}).`
      }));
  }

  if (lowItems.length === 0) return [];
  
  const prompt = `
    Analyze inventory needs.
    Items: ${JSON.stringify(lowItems.map(i => ({name: i.item_name, stock: i.current_stock})))}.
    
    Return JSON Array:
    [
      { "item_name": "name", "suggested_qty": number, "urgency": "High/Medium/Low", "reason": "reason" }
    ]
  `;
  try {
    const resp = await ai.models.generateContent({ model: modelId, contents: prompt, config: { responseMimeType: 'application/json' } });
    return resp.text ? JSON.parse(resp.text) : [];
  } catch (e) { return []; }
};

// --- 7. Surge Simulator ---
export const simulateSurgeImpact = async (patientCount: number) => {
    if (!apiKey) {
        return {
            bed_impact: "Critical",
            staff_needed: 12,
            critical_resources: ["Trauma Beds", "O Negative Blood", "Surgical Teams"]
        };
    }

    const prompt = `
        Simulate impact of ${patientCount} mass casualty patients.
        Return JSON:
        {
            "bed_impact": "Severe/Moderate/Low",
            "staff_needed": number,
            "critical_resources": ["blood", "O2", "surgical_kits"]
        }
    `;
    try {
        const resp = await ai.models.generateContent({ model: modelId, contents: prompt, config: { responseMimeType: 'application/json' } });
        return resp.text ? JSON.parse(resp.text) : null;
    } catch (e) { return null; }
};