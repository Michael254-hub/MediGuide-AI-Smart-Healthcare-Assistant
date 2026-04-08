# MediGuide Clinical Decision Support System

## 🏥 Overview

MediGuide is a comprehensive AI-powered clinical decision support system that integrates with the Google Gemini 3 Flash API to provide evidence-based clinical guidance. The system analyzes patient data across multiple dimensions and delivers intelligent recommendations to support clinical decision-making.

### ✨ Version 2.0 Enhancements

- **Multimodal AI Processing**: Google Gemini 3 can analyze text, images, and voice input simultaneously
- **Voice Input Support**: Patients can describe symptoms naturally via speech-to-text
- **Image Analysis**: Medical images, rashes, and visible symptoms are analyzed by the AI
- **Enhanced Context**: Richer clinical information from multiple input modalities

## 🎯 System Architecture

### Frontend Components

#### **SubmitSymptoms Page** (`client/src/pages/SubmitSymptoms.jsx`) - NEW in 2.0

Enhanced symptom input with multiple modalities:

- **Text Input**: Traditional symptom description textarea
- **Voice Recording**: Web Speech API integration for natural language input
- **Image Upload**: Multiple image upload with preview gallery
- **Severity Selection**: Mild/Moderate/Severe classification
- **Duration Selection**: Symptom timeline selection
- **Real-time Transcription**: Live voice-to-text conversion with visual feedback

**Voice Features:**

- Continuous speech recognition
- Real-time transcription display
- Start/Stop recording controls
- Error handling and user feedback

**Image Features:**

- Multiple file selection
- Image preview thumbnails
- Individual image removal
- Automatic MIME type validation

#### **Clinical Dashboard Tab** (`client/src/pages/ClinicalDashboard.jsx`)

The clinical dashboard is a multi-tab interface with real-time AI consultation:

##### **1. Dashboard Tab**

- **Patient Demographics**: Name, age, height, weight, BMI
- **Vital Signs Panel**: Temperature, BP, HR, RR, O₂ Sat with status indicators
- **Risk Assessment Card**: Overall risk score (0-100) with contributing factors
- **Action Items**: Prioritized clinical tasks (HIGH/MEDIUM/LOW)

##### **2. AI Consultation Tab**

- **Real-time Chat Interface**: Bidirectional communication with Gemini 3 Flash
- **Multimodal Context**: AI understands patient context from all input types
- **Suggested Questions**: AI-generated clinical questions tailored to patient data
- **Conversation History**: Maintains context across multiple questions
- **Token Usage Tracking**: Shows input/output token consumption

##### **3. Differential Diagnosis Tab**

- **Ranked Diagnoses**: Probability-weighted differential diagnoses
- **Clinical Reasoning**: Evidence-based justification for each diagnosis
- **Recommendations**: Specific diagnostic workup and follow-up plans

##### **4. Medications Tab**

- **Current Regimen**: All active medications with dosage/frequency
- **Drug Interaction Alerts**: High-risk interactions flagged
- **Expandable Details**: Full medication information on demand

##### **5. Lab Results Tab**

- **Structured Results Table**: All recent lab values
- **Reference Ranges**: Normal ranges for comparison
- **Status Indicators**: Abnormal results highlighted
- **Trend Analysis**: Arrows showing if values are improving/worsening

### Backend Services

#### **Clinical Data Service** (`server/services/clinicalDataService.js`)

```javascript
generateMockPatientData(userId); // Returns complete patient object
buildClinicalContext(patientData); // Formats data for AI processing
```

**Mock Data Structure:**

- Patient demographics
- Vitals (temperature, BP, HR, RR, O₂ sat)
- Active medical problems
- Current medications with interactions
- Lab results with reference ranges
- Differential diagnoses
- Risk assessment scoring
- Prioritized action items

#### **AI Consultation Service** (`server/services/aiConsultationService.js`) - UPGRADED for Gemini 3

```javascript
consultWithAI(patientContext, question, conversationHistory, imageData);
consultWithAIStream(patientContext, question, conversationHistory, imageData);
analyzeSymptomImage(imageData, symptomDescription);
generateSuggestions(patientContext);
```

**Gemini 3 Flash Model Features:**

✅ **Multimodal Input**: Accepts text + images + voice transcriptions
✅ **Real-time Streaming**: Fast token generation for responsive UI
✅ **Safety Settings**: Configured for clinical context (harassment, hate speech, etc.)
✅ **Image Analysis**: Analyzes symptom photos, rashes, physical ailments
✅ **Context Preservation**: Maintains conversation history across requests

**System Prompt:**
The service includes a specialized clinical system prompt that:

- Emphasizes evidence-based reasoning
- Includes clinical guidelines (ACC/AHA, ADA, etc.)
- Flags drug interactions and safety concerns
- Provides differential diagnosis reasoning
- Recommends specific diagnostic workup
- Includes risk stratification
- Processes visual symptom information

#### **Clinical Controller** (`server/controllers/clinicalController.js`)

Routes:

- `GET /api/v1/clinical/patient-data` - Get complete patient data
- `GET /api/v1/clinical/differential-diagnosis` - Get ranked diagnoses
- `GET /api/v1/clinical/medications` - Get medications with interactions
- `GET /api/v1/clinical/labs` - Get lab results with trends
- `GET /api/v1/clinical/suggestions` - Get suggested clinical questions
- `POST /api/v1/clinical/consult` - Send consultation question with optional images
- `POST /api/v1/clinical/consult-stream` - Stream consultation response

## 🔧 Setup & Configuration

### 1. Install Dependencies

**Server:**

```bash
cd server
npm install @google/generative-ai
```

**Client:** (Already installed)

- React 19.2+
- Lucide React (icons)
- Axios (API client)

### 2. Environment Variables

`.env` file in server directory:

```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=AIza-... # Get from https://aistudio.google.com/app/apikeys
```

### 3. Obtain Google Gemini API Key

1. Go to https://aistudio.google.com/app/apikeys
2. Sign in with your Google account
3. Click **Create API Key** or select an existing project
4. Copy the API key (format: `AIza...`)
5. Paste into `.env` file as `GEMINI_API_KEY`

**Note:** Gemini API includes free tier with generous daily limits.

### 4. Start Services

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Visit: `http://localhost:5173`

## 📊 AI Integration Details

### Google Gemini 3 Flash Model

**Model ID:** `gemini-3-flash`

**Capabilities:**

- Context window: 1M tokens (supports long conversations)
- Multimodal input: Text, images, and voice transcriptions
- Strong clinical reasoning with medical knowledge
- Fast token generation (~100ms per token)
- Image analysis for visual symptoms
- Real-time streaming responses

### Multimodal Input Support

The system now supports three types of input simultaneously:

**1. Text Input**

```
Patient describes symptoms: "I've had a sharp pain in my chest when I breathe deeply"
```

**2. Voice Input (Transcribed)**

```
Patient speaks naturally: "When I was exercising, I felt dizzy"
→ Automatically transcribed to text for AI processing
```

**3. Image Input**

```
Patient uploads photos of:
- Rashes or skin lesions
- Swelling or inflammation
- Other visible symptoms
```

### Clinical Context Injection

Every consultation includes full patient context enriched with multimodal data:

```
PATIENT DEMOGRAPHICS:
- Age: 45 years old, M
- BMI: 28.7 kg/m²

CURRENT VITALS:
- Blood Pressure: 142/92 mmHg (Status: elevated)
- Heart Rate: 78 bpm
- Temperature: 98.6°F

SYMPTOM INFORMATION:
- Text Description: "Sharp chest pain when breathing"
- Voice Notes: Transcription of patient's verbal description
- Visual Evidence: Attached images showing visible symptoms

RISK ASSESSMENT:
- Overall Risk: MODERATE (Score: 65/100)

ACTIVE MEDICAL PROBLEMS:
- Hypertension (Status: active, Severity: moderate)
- Type 2 Diabetes Mellitus (Status: active, Severity: moderate)

CURRENT MEDICATIONS:
- Lisinopril 10mg daily (for Hypertension)
- Metformin 1000mg twice daily (for Type 2 Diabetes)
- Atorvastatin 20mg daily (for Hyperlipidemia)

RECENT LAB RESULTS:
- Hemoglobin A1c: 7.8% (Reference: <5.7%) [HIGH]
- Total Cholesterol: 245 mg/dL (Reference: <200) [HIGH]
```

### Conversation History

The system maintains conversation history to enable:

- **Context continuity**: AI remembers previous questions
- **Follow-up queries**: Build on prior conclusions
- **Clinical reasoning chains**: Track diagnostic thinking
- **Multimodal understanding**: Remembers images and voice context
- **Token efficiency**: Avoids repeating context where possible

## 💡 Clinical Use Cases

### 1. Visual Symptom Analysis

```
User: Uploads photo of rash + describes itching
AI Response: Analyzes image + text description for differential diagnosis
```

### 2. Voice-Based Symptom Collection

```
Patient: Speaks naturally about symptoms (hands-free)
AI Response: Transcribes, processes, and generates recommendations
```

### 3. Medication Optimization

```
User: "Should we adjust the patient's antidiabetic regimen?"
AI Response: Analyzes A1c, current medications, side effects, voice/image context
```

### 4. Differential Diagnosis Support

```
User: "What's the likely diagnosis given the patient's presentation?"
AI Response: Considers all input modalities and provides probability-weighted diagnoses
```

### 5. Drug Interaction Checking

```
User: "Is it safe to add atorvastatin to this regimen?"
AI Response: Analyzes current medications and flags relevant interactions
```

### 6. Risk Stratification

```
User: "What's this patient's cardiovascular risk?"
AI Response: Calculates risk using clinical guidelines and multimodal data
```

## 🔐 Security Considerations

### Protected Endpoints

All `/api/v1/clinical/*` and `/api/v1/symptoms/*` routes require:

- JWT authentication (`Authorization: Bearer {token}`)
- User must be logged in
- Admin routes may require additional permissions

### Data Privacy

- Patient data sent to Gemini API only for consultation (request context)
- Conversations not logged on Google servers
- Images processed in real-time only, not stored
- All sensitive data remains within your infrastructure
- HIPAA-compliant if infrastructure is configured appropriately

### Rate Limiting

- API rate limiting: 100 requests per 15 minutes
- Anthropic API rate limit: Based on your subscription

## 📈 Token Usage

Each consultation call includes token metrics:

```javascript
{
  inputTokens: 2450,    // Tokens in request
  outputTokens: 1200    // Tokens in response
}
```

**Estimate costs:**

- Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens
- Average consultation: ~3,650 tokens = ~$0.06

## 🚀 Production Deployment

### For Real EHR Integration:

#### 1. FHIR API Integration

Replace `generateMockPatientData()` with actual EHR connection:

```javascript
// server/services/clinicalDataService.js
const fetchPatientFromEHR = async (patientId) => {
  // Connect via FHIR APIs to:
  // - Epic (get.epic.com)
  // - Cerner (cerner.com)
  // - HL7 FHIR servers
  const response = await fhirClient.read("Patient", patientId);
  return transformFhirToMediGuide(response);
};
```

#### 2. Drug Interaction Database

Integrate with:

- **DrFirst Medispan**: Production-grade drug interaction checking
- **Lexicomp**: Comprehensive drug reference
- **FDA/NIH databases**: Evidence-based guidelines

```javascript
const checkDrugInteractions = async (medications) => {
  const response = await meditextAPI.checkInteractions(medications);
  return response.interactions;
};
```

#### 3. Clinical Guidelines Engine

Index and retrieve relevant guidelines:

```javascript
const getRelevantGuidelines = async (diagnosis, patientData) => {
  // Search PubMed, UpToDate, clinical guidelines
  const guidelines = await guidelineSearch.find({
    condition: diagnosis,
    age: patientData.patient.age,
  });
  return guidelines;
};
```

#### 4. Structured Output

Parse AI responses into structured data:

```javascript
const parseAIConsultation = (response) => {
  return {
    differential_diagnoses: [...],
    recommended_tests: [...],
    medication_recommendations: [...],
    follow_up_timeline: {...}
  };
};
```

### Deployment Stack

**Recommended:**

- Backend: Node.js on AWS ECS / Google Cloud Run
- Database: PostgreSQL on RDS / Cloud SQL
- Cache: Redis for conversation history
- Frontend: Deploy to Vercel / Netlify
- EHR Integration: VPN to health system servers

## 🧪 Testing the System

### 1. Test Login

```bash
# Register new account
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "email": "jane@hospital.com",
    "password": "secure123"
  }'
```

### 2. Test Clinical Endpoints

```bash
# Get patient data
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:5000/api/v1/clinical/patient-data

# Get AI consultation
curl -X POST http://localhost:5000/api/v1/clinical/consult \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Is the patient at risk for acute kidney injury?",
    "conversationHistory": []
  }'
```

### 3. Test Frontend

Navigate to:

- `http://localhost:5173/clinical` - Full clinical dashboard
- Use the AI Consultation tab to ask questions
- Click suggested questions to test auto-generation

## 🐛 Troubleshooting

### "Anthropic API key not found"

- Set `ANTHROPIC_API_KEY` in `.env`
- Restart server: `npm run dev`

### "API returns 401 Unauthorized"

- Verify JWT token is valid
- User must be logged in
- Check token expiration (30 days)

### "Claude model not responding"

- Check Anthropic API status: https://status.anthropic.com/
- Verify API key has active quota
- Check rate limits

### "Slow responses"

- Normal for first request (~2-3s)
- Subsequent requests cached
- Consider using streaming for UX improvement

## 📚 Resources

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude 3.5 Sonnet](https://www.anthropic.com/news/claude-3-5-sonnet)
- [FHIR Standard](https://www.hl7.org/fhir/)
- [Clinical Guidelines (ACC/AHA)](https://www.heart.org/en/guidelines)
- [Drug Interaction Checking (FDA)](https://www.fda.gov/)

## 📝 Future Enhancements

- [ ] Real-time patient waveform monitoring
- [ ] Genomic data integration
- [ ] Imaging AI (radiology case review)
- [ ] Predictive analytics (sepsis risk, readmission risk)
- [ ] Multi-model consultation (cardiology, nephrology specialists)
- [ ] Evidence retrieval from PubMed/UpToDate API
- [ ] Custom clinical institution guidelines
- [ ] HIPAA audit logging
- [ ] Team collaboration features
- [ ] Mobile app with offline support

## 📞 Support

For issues or questions:

1. Check troubleshooting section
2. Review Anthropic API documentation
3. Check server logs: `npm run dev` output
4. Verify .env configuration
5. Test each endpoint independently

---

**Version:** 1.0.0  
**Last Updated:** April 2026  
**Status:** Production Ready with Mock Data
