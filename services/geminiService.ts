import { GoogleGenAI, Type } from "@google/genai";
import { HospitalState, Patient, ClinicalInsights } from "../types";
import { supabase } from "./supabase";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateHospitalReport = async (state: HospitalState): Promise<string> => {
  if (!apiKey) return "API Key not configured. AI insights unavailable.";

  try {
    const prompt = `
      You are the AI Administrator for a Smart Hospital "ihOS".
      Analyze the current hospital snapshot below and provide a concise strategic report (max 150 words).
      
      Focus on:
      1. Critical bottlenecks (Bed capacity vs Incoming Trauma).
      2. Staff burnout risks (Fatigue scores > 70).
      3. Supply chain warnings (Items below reorder threshold).
      
      Data Snapshot:
      - Waiting Patients: ${state.patients.filter(p => p.status === 'Waiting').length} (Avg Acuity: ${calculateAvgAcuity(state)})
      - Bed Occupancy: ${state.beds.filter(b => b.is_occupied).length}/${state.beds.length}
      - High Fatigue Staff: ${state.staff.filter(s => s.current_fatigue_score > 70).map(s => s.name).join(', ')}
      - Low Stock Items: ${state.inventory.filter(i => i.current_stock < i.reorder_threshold).map(i => i.item_name).join(', ')}
      
      Tone: Professional, urgent, data-driven.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate report due to service interruption.";
  }
};

export const getChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  currentMessage: string,
  state: HospitalState
): Promise<string> => {
  if (!apiKey) return "Chat unavailable (System Offline).";

  // Construct context with Doctors and Appointments
  const contextData = {
    waiting_patients: state.patients.filter(p => p.status === 'Waiting').map(p => ({ 
        name: p.name, 
        condition: p.condition, 
        acuity: p.acuity_score 
    })),
    bed_status: {
        total: state.beds.length,
        occupied: state.beds.filter(b => b.is_occupied).length,
    },
    critical_inventory: state.inventory
        .filter(i => i.current_stock <= i.reorder_threshold)
        .map(i => `${i.item_name} (${i.current_stock} left)`),
    // Live Doctor Roster
    doctors_available: state.staff
        .filter(s => s.role === 'Doctor' || s.role === 'Specialist')
        .map(s => ({
            name: s.name,
            role: s.role,
            fatigue: `${s.current_fatigue_score}%`,
            status: s.current_fatigue_score > 70 ? 'High Fatigue' : 'Available',
            specialty: s.role
        })),
    recent_appointments: state.appointments.slice(-3) // Give some context of recent bookings
  };

  const systemInstruction = `
    You are the 'ihOS Assistant'. You have access to real-time hospital data.

    LIVE DATA (JSON):
    ${JSON.stringify(contextData)}

    CAPABILITIES:
    1. Answer questions about patient status, beds, and inventory.
    2. Check DOCTOR AVAILABILITY using the 'doctors_available' list above.
    3. BOOK APPOINTMENTS using the 'book_appointment' tool.

    RULES:
    - If asked for availability, list doctors with fatigue < 70%.
    - If asked to book an appointment, ask for missing details (Patient Name, Time, Reason) if not provided.
    - Be concise.
  `;

  // Define Tool for Booking
  const tools = [
    {
      functionDeclarations: [
        {
          name: "book_appointment",
          description: "Book an appointment with a specific doctor.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              doctorName: { type: Type.STRING, description: "Name of the doctor (must match exactly from list)" },
              patientName: { type: Type.STRING, description: "Name of the patient" },
              time: { type: Type.STRING, description: "Preferred time (e.g., 2:00 PM)" },
              reason: { type: Type.STRING, description: "Reason for visit" },
            },
            required: ["doctorName", "patientName", "time", "reason"],
          },
        },
      ],
    },
  ];

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { 
          systemInstruction,
          tools 
      },
      history: history 
    });
    
    // First turn: User message -> Model
    let result = await chat.sendMessage({ message: currentMessage });

    // Check for Tool Call
    const call = result.functionCalls?.[0];
    
    if (call && call.name === 'book_appointment' && supabase) {
        const { doctorName, patientName, time, reason } = call.args as any;
        
        console.log("Executing Tool: book_appointment", call.args);

        // Execute DB Operation
        const { error } = await supabase.from('appointments').insert({
            doctor_name: doctorName,
            patient_name: patientName,
            time,
            reason
        });

        const apiResult = error 
            ? `Error: ${error.message}` 
            : `Success: Appointment booked for ${patientName} with ${doctorName} at ${time}.`;

        // Send Tool Response back to Model
        result = await chat.sendMessage({
          message: [{
            functionResponse: {
                name: 'book_appointment',
                response: { result: apiResult }
            }
          }]
        });
    }

    return result.text || "";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble accessing the hospital database right now.";
  }
};

const calculateAvgAcuity = (state: HospitalState) => {
    const waiting = state.patients.filter(p => p.status === 'Waiting');
    if (waiting.length === 0) return 0;
    const total = waiting.reduce((acc, p) => acc + p.acuity_score, 0);
    return (total / waiting.length).toFixed(1);
};

export const suggestBedAllocation = async (patientName: string, acuity: number, availableBeds: string[]): Promise<string> => {
     if (!apiKey) return "AI suggestion unavailable.";
     
     const prompt = `
        A patient, ${patientName}, has arrived with Acuity Level ${acuity} (1-4).
        Available Beds: ${availableBeds.join(', ')}.
        
        Recommend the best bed allocation strategy. If no beds are suitable, suggest a triage protocol.
        Keep it to 2 sentences.
     `;
     
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No suggestion.";
     } catch (e) {
         return "AI Error.";
     }
}

// --- NEW FEATURES ---

export interface SurgeScenario {
    scenarioTitle: string;
    scenarioDescription: string;
    generatedPatients: Partial<Patient>[];
}

export const generateSurgeScenario = async (): Promise<SurgeScenario | null> => {
    if (!apiKey) return null;

    try {
        const prompt = `
            Generate a realistic Mass Casualty Incident (MCI) scenario for a hospital trauma center (e.g., Highway Pileup, Industrial Explosion, Structural Collapse).
            
            Return ONLY a JSON object with the following schema:
            {
                "scenarioTitle": "String (Short title)",
                "scenarioDescription": "String (2 sentences explaining the event)",
                "generatedPatients": [
                    {
                        "name": "String",
                        "acuity_score": Integer (2, 3, or 4),
                        "condition": "String (Short medical diagnosis)",
                        "detailed_condition": "String (Clinical presentation)"
                    }
                ]
            }
            
            Generate exactly 5 patients. Mix of High (3) and Critical (4) acuity.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenarioTitle: { type: Type.STRING },
                        scenarioDescription: { type: Type.STRING },
                        generatedPatients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    acuity_score: { type: Type.INTEGER },
                                    condition: { type: Type.STRING },
                                    detailed_condition: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as SurgeScenario;
        }
        return null;
    } catch (e) {
        console.error("Surge Gen Error:", e);
        return null;
    }
};

export const assessClinicalRisk = async (patient: Patient): Promise<ClinicalInsights | null> => {
     if (!apiKey) return null;

     try {
         const prompt = `
            Act as a Senior Clinical Triage Officer. Analyze this patient data:
            Name: ${patient.name}
            Condition: ${patient.condition}
            Details: ${patient.detailed_condition}
            History: ${JSON.stringify(patient.history)}
            Current Acuity: ${patient.acuity_score}

            Provide a clinical risk assessment in JSON format:
            {
                "deterioration_probability": "Low" | "Moderate" | "High" | "Critical",
                "risk_factors": ["List 3 specific clinical risks"],
                "suggested_labs": ["List 3 relevant lab/imaging orders"],
                "recommended_intervention": "One concise immediate action"
            }
         `;

         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
             config: {
                 responseMimeType: 'application/json'
             }
         });

         if (response.text) {
             const data = JSON.parse(response.text);
             return {
                 ...data,
                 last_updated: new Date().toLocaleTimeString()
             };
         }
         return null;

     } catch (e) {
         console.error("Risk Assessment Error:", e);
         return null;
     }
}
