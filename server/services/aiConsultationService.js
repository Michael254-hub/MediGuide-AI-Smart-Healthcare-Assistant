/**
 * AI Consultation Service
 * Uses Google Gemini 3 API to provide clinical decision support
 */

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CLINICAL_SYSTEM_PROMPT = `You are an advanced clinical decision support AI assistant powered by medical knowledge and evidence-based guidelines. You have deep expertise in:

- Internal Medicine and Primary Care
- Clinical Pharmacology and Drug Interactions
- Diagnostic Decision-Making and Differential Diagnosis
- Evidence-Based Medicine and Clinical Guidelines
- Risk Stratification and Patient Safety

IMPORTANT GUIDELINES FOR RESPONSES:
1. Always provide evidence-based reasoning tied to clinical data
2. Consider differential diagnoses with probability estimates
3. Reference current clinical guidelines (ACC/AHA, ADA, etc.)
4. Include relevant drug interaction alerts
5. Recommend specific diagnostic workup and follow-up
6. Flag any patient safety concerns
7. Use structured, professional medical language
8. When uncertain, acknowledge limitations and recommend specialist consultation

FORMAT YOUR RESPONSES with:
- Clear clinical reasoning
- Differential diagnoses prioritized by probability
- Risk assessment
- Specific actionable recommendations
- Follow-up timeline and monitoring parameters

CRITICAL: This is a decision support tool to assist clinicians, NOT a replacement for clinical judgment. Always recommend human physician review of all recommendations.`;

const createConsultationMessage = (patientContext, userQuestion, imageData = null) => {
  let message = `Patient Context:
${patientContext}

Clinical Question:
${userQuestion}

Provide a detailed, evidence-based clinical consultation addressing the question with specific recommendations.`;

  if (imageData) {
    message += `\n\nNote: Visual information (images/rashes/visible symptoms) has been provided for analysis.`;
  }

  return message;
};

const consultWithAI = async (patientContext, userQuestion, conversationHistory = [], imageData = null) => {
  try {
    const model = client.getGenerativeModel({
      model: 'gemini-3-flash',
      systemInstruction: CLINICAL_SYSTEM_PROMPT,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    // Build content array for multimodal input
    const contents = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    // Create current message with optional image
    const messageParts = [];

    if (imageData) {
      // Add image data if provided
      messageParts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data
        }
      });
    }

    messageParts.push({
      text: createConsultationMessage(patientContext, userQuestion, imageData)
    });

    contents.push({
      role: 'user',
      parts: messageParts
    });

    const response = await model.generateContent({
      contents: contents,
    });

    const responseText = response.response.text();

    return {
      success: true,
      response: responseText,
      usage: {
        inputTokens: response.response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.response.usageMetadata?.candidatesTokenCount || 0
      }
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message,
      response: 'Unable to process consultation request. Please try again.'
    };
  }
};

// Streaming version for real-time responses
const consultWithAIStream = async (patientContext, userQuestion, conversationHistory = [], imageData = null) => {
  try {
    const model = client.getGenerativeModel({
      model: 'gemini-3-flash',
      systemInstruction: CLINICAL_SYSTEM_PROMPT,
    });

    // Build content array
    const contents = [];

    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    const messageParts = [];

    if (imageData) {
      messageParts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data
        }
      });
    }

    messageParts.push({
      text: createConsultationMessage(patientContext, userQuestion, imageData)
    });

    contents.push({
      role: 'user',
      parts: messageParts
    });

    const stream = await model.generateContentStream({
      contents: contents,
    });

    return stream;
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    throw error;
  }
};

// Generate quick suggestions based on patient data
const generateSuggestions = async (patientContext) => {
  const model = client.getGenerativeModel({
    model: 'gemini-3-flash',
  });

  const suggestionPrompt = `Based on this patient's data, suggest 3-4 specific clinical questions a physician might ask for decision support. Format as a JSON array of strings, each being a natural language question.

Patient Data:
${patientContext}

Respond ONLY with valid JSON array like: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`;

  try {
    const response = await model.generateContent(suggestionPrompt);
    const content = response.response.text();
    
    // Extract JSON array from response
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      return {
        success: true,
        suggestions: JSON.parse(jsonMatch[0])
      };
    }
    return { success: false, suggestions: [] };
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return { success: false, suggestions: [] };
  }
};

// Process image for symptom analysis
const analyzeSymptomImage = async (imageData, symptomDescription) => {
  const model = client.getGenerativeModel({
    model: 'gemini-3-flash',
  });

  const analysisPrompt = `Analyze this medical image in the context of the following symptom description. Provide clinical observations about what is visible.

Symptom Description: ${symptomDescription}

Please provide:
1. Visual observations
2. Potential clinical correlations
3. Recommendations for follow-up

Note: This is for clinical decision support only, not diagnosis.`;

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data
              }
            },
            {
              text: analysisPrompt
            }
          ]
        }
      ]
    });

    return {
      success: true,
      analysis: response.response.text()
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      success: false,
      error: error.message,
      analysis: 'Unable to analyze image. Please try again.'
    };
  }
};

module.exports = {
  consultWithAI,
  consultWithAIStream,
  generateSuggestions,
  analyzeSymptomImage,
  CLINICAL_SYSTEM_PROMPT
};
