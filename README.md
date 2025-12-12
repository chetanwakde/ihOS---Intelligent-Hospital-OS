# ihOS - Intelligent Hospital Operating System

ihOS is a next-generation Smart Hospital Operating System prototype designed to optimize patient flow, manage staff fatigue, and predict resource shortages using Google's Gemini AI.

## 🏥 Overview

This application serves as a "vertical slice" of a hospital command center. It integrates real-time data from beds, patients, staff, and inventory with predictive AI to assist administrators in making life-saving decisions. It functions in two modes: **Live Connected** (synced with Supabase) or **Offline Demo** (using local mock data).

## ✨ Key Features

### 1. 🚑 Trauma Center Command
- **Live Bed Map**: Visual grid of bed occupancy, reservations, and skill-level requirements (General, Trauma, ICU).
- **AI Triage Assistant**: 
  - Voice-enabled symptom reporting (Web Speech API).
  - Automatic Acuity Scoring (1-4) using Gemini 2.5 Flash.
  - Recommended clinical actions and bed type suggestions.
- **Clinical Risk Analysis**: Real-time evaluation of patient deterioration and sepsis risk based on vitals and history.
- **Surge Simulator**: Generates realistic Mass Casualty Incident (MCI) scenarios via AI to test hospital capacity and resource resilience.

### 2. 👩‍⚕️ Intelligent Staffing
- **Fatigue Monitoring**: Tracks hours worked and calculates real-time fatigue scores.
- **AI Load Balancer**: Analyzes current roster load and suggests reassignments or mandatory rest periods to prevent burnout.
- **Role Management**: Manage Doctors, Nurses, and Specialists with skill-level tracking.

### 3. 📦 Predictive Inventory
- **Real-time Stock Tracking**: Monitors Pharmaceuticals, Surgical Kits, and Consumables.
- **Smart Reorder**: AI analyzes usage rates to predict runouts and suggests reorder quantities before stock hits critical levels.

### 4. 📅 Appointment Scheduling
- Manage patient visits and doctor availability.
- Search, filter, and status tracking (Confirmed/Cancelled).
- Optimistic UI updates for instant feedback.

### 5. 🤖 AI Companion & Tools
- **Chat Assistant**: Context-aware chatbot that can answer questions about hospital status ("Who is the on-call doctor?", "Any beds free?") and perform actions like booking appointments using Function Calling.
- **Document Analysis**: Upload medical notes to get concise summaries and critical red flags extracted by AI.
- **Forecasting Widget**: 24-hour prediction of bed availability, staff shortages, and resource crunches.

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide React
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`) via `@google/genai` SDK
- **Backend & Realtime**: Supabase (PostgreSQL)
- **State Management**: React Hooks + Optimistic UI updates

## 🚀 Setup & Configuration

### Environment Variables
To enable AI features and Database persistence, the application looks for the following environment variables (or hardcoded fallbacks for the demo):

- `API_KEY`: Your Google Gemini API Key.
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_KEY`: Your Supabase Anon/Public Key.

*Note: If Supabase keys are missing, the app automatically defaults to "Offline Demo Mode" using local state.*

### Database Schema
A SQL setup script is provided in `scripts/supabase_script.txt`. It sets up:
- Core tables: `patients`, `beds`, `staff`, `inventory`, `appointments`
- AI feature tables: `documents`, `audit_logs`
- Realtime subscriptions enabled for all core tables.

## 🧠 AI Integration Details

The system leverages the Gemini 2.5 Flash model for high-speed reasoning:
- **Triage**: Uses structured JSON output generation to parse unstructured symptom descriptions into clinical data.
- **Chat**: Implements Function Calling to bridge natural language requests with database actions (e.g., `book_appointment`).
- **Surge Sim**: Uses generative capabilities to invent complex disaster scenarios with realistic patient profiles.
