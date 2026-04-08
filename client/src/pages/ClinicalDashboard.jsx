import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  AlertCircle,
  Pill,
  TestTube,
  Brain,
  Send,
  Loader,
  TrendingUp,
  Heart,
  Droplets,
  Wind,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import api from "../services/api";

/**
 * Comprehensive Clinical Decision Support System
 * AI-powered dashboard with patient data integration and Anthropic Claude 3.5 Sonnet
 */

const ClinicalDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [patientData, setPatientData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Consultation state
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);
  const messagesEndRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadPatientData();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      const [patientRes, suggestionsRes] = await Promise.all([
        api.get("/clinical/patient-data"),
        api.get("/clinical/suggestions"),
      ]);

      setPatientData(patientRes.data.data);
      setSuggestions(suggestionsRes.data.data.suggestions);
      setError(null);
    } catch (err) {
      console.error("Failed to load patient data:", err);
      setError("Failed to load clinical data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsConsulting(true);

    try {
      const response = await api.post("/clinical/consult", {
        question: message,
        conversationHistory: chatMessages,
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.data.data.consultation,
        timestamp: new Date(),
        usage: response.data.data.usage,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to get consultation:", err);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Failed to get consultation. Please try again.",
        isError: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-med-primary mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading Clinical Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl p-8 max-w-md shadow-xl border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700 font-medium text-center">{error}</p>
          <button
            onClick={loadPatientData}
            className="mt-4 w-full px-4 py-2 bg-med-primary text-white rounded-lg hover:bg-med-secondary transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-med-primary to-med-accent rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-med-dark">
                  Clinical Decision Support
                </h1>
                <p className="text-sm text-slate-500">
                  AI-Powered Patient Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Anthropic Claude 3.5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-xl shadow border border-slate-200 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "ai-console", label: "AI Consultation", icon: Brain },
            { id: "differential", label: "Differential Dx", icon: Stethoscope },
            { id: "medications", label: "Medications", icon: Pill },
            { id: "labs", label: "Lab Results", icon: TestTube },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-med-primary text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <DashboardTab patientData={patientData} />
        )}
        {activeTab === "ai-console" && (
          <AIConsultationTab
            suggestions={suggestions}
            chatMessages={chatMessages}
            inputValue={inputValue}
            isConsulting={isConsulting}
            messagesEndRef={messagesEndRef}
            onSendMessage={handleSendMessage}
            onSetInputValue={setInputValue}
            onSuggestedQuestion={handleSuggestedQuestion}
          />
        )}
        {activeTab === "differential" && (
          <DifferentialDxTab patientData={patientData} />
        )}
        {activeTab === "medications" && (
          <MedicationsTab patientData={patientData} />
        )}
        {activeTab === "labs" && <LabResultsTab patientData={patientData} />}
      </div>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ patientData }) => {
  const patient = patientData?.patient;
  const vitals = patientData?.vitals;
  const riskScore = patientData?.riskScore;
  const actionItems = patientData?.actionItems;

  return (
    <div className="space-y-6">
      {/* Patient Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-med-dark mb-4">
          Patient Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Name</p>
            <p className="text-lg font-bold text-med-dark">{patient?.name}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Age</p>
            <p className="text-lg font-bold text-med-dark">
              {patient?.age} years
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Height/Weight</p>
            <p className="text-lg font-bold text-med-dark">
              {patient?.height}, {patient?.weight}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">BMI</p>
            <p className="text-lg font-bold text-med-dark">{patient?.bmi}</p>
          </div>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <VitalCard
          icon={<Droplets className="w-5 h-5" />}
          label="Temperature"
          value={vitals?.temperature.value}
          unit={vitals?.temperature.unit}
          status={vitals?.temperature.status}
        />
        <VitalCard
          icon={<Heart className="w-5 h-5" />}
          label="Blood Pressure"
          value={vitals?.bloodPressure.value}
          unit="mmHg"
          status={vitals?.bloodPressure.status}
        />
        <VitalCard
          icon={<Zap className="w-5 h-5" />}
          label="Heart Rate"
          value={vitals?.heartRate.value}
          unit="bpm"
          status={vitals?.heartRate.status}
        />
        <VitalCard
          icon={<Wind className="w-5 h-5" />}
          label="Respiratory Rate"
          value={vitals?.respiratoryRate.value}
          unit="breaths/min"
          status={vitals?.respiratoryRate.status}
        />
        <VitalCard
          icon={<Activity className="w-5 h-5" />}
          label="O2 Saturation"
          value={vitals?.oxygenSaturation.value}
          unit="%"
          status={vitals?.oxygenSaturation.status}
        />
      </div>

      {/* Risk Assessment */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border border-orange-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-med-dark mb-2">
              Overall Risk Assessment
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-orange-600">
                {riskScore?.score}
              </div>
              <div>
                <p className="text-lg font-bold text-orange-700">
                  {riskScore?.overallRisk} Risk
                </p>
                <p className="text-sm text-orange-600">
                  Clinical severity score
                </p>
              </div>
            </div>
          </div>
          <AlertTriangle className="w-10 h-10 text-orange-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskScore?.factors.map((factor, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-4 border border-orange-100"
            >
              <p className="font-medium text-med-dark">{factor.name}</p>
              <p className="text-sm text-slate-600 capitalize">
                Severity: {factor.severity}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-med-dark mb-4">
          Prioritized Action Items
        </h2>
        <div className="space-y-3">
          {actionItems?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div
                className={`mt-1 px-2 py-1 rounded text-xs font-bold ${
                  item.priority === "HIGH"
                    ? "bg-red-100 text-red-700"
                    : item.priority === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {item.priority}
              </div>
              <div className="flex-1">
                <p className="font-bold text-med-dark">{item.action}</p>
                <p className="text-sm text-slate-600">{item.reason}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-slate-400 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Vital Card Component
const VitalCard = ({ icon, label, value, unit, status }) => {
  const statusColor =
    status === "normal"
      ? "bg-green-50 border-green-200"
      : status === "elevated"
        ? "bg-orange-50 border-orange-200"
        : "bg-red-50 border-red-200";

  const statusTextColor =
    status === "normal"
      ? "text-green-700"
      : status === "elevated"
        ? "text-orange-700"
        : "text-red-700";

  return (
    <div className={`${statusColor} rounded-xl shadow-sm border p-4`}>
      <div
        className={`p-2 w-fit rounded-lg mb-3 ${
          status === "normal"
            ? "bg-green-100"
            : status === "elevated"
              ? "bg-orange-100"
              : "bg-red-100"
        }`}
      >
        <div
          className={
            status === "normal"
              ? "text-green-600"
              : status === "elevated"
                ? "text-orange-600"
                : "text-red-600"
          }
        >
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-med-dark">
        {value} <span className="text-sm text-slate-600">{unit}</span>
      </p>
      <p className={`text-xs font-medium mt-2 capitalize ${statusTextColor}`}>
        {status}
      </p>
    </div>
  );
};

// AI Consultation Tab
const AIConsultationTab = ({
  suggestions,
  chatMessages,
  inputValue,
  isConsulting,
  messagesEndRef,
  onSendMessage,
  onSetInputValue,
  onSuggestedQuestion,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(inputValue);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
      {/* Suggestions Sidebar */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-y-auto">
        <h3 className="font-bold text-med-dark mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Suggested Questions
        </h3>
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestedQuestion(suggestion)}
              className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-sm text-blue-900 font-medium transition"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  Start a clinical consultation
                </p>
                <p className="text-sm text-slate-400">
                  Ask questions about the patient's care
                </p>
              </div>
            </div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-med-primary text-white"
                      : message.isError
                        ? "bg-red-50 text-red-900 border border-red-200"
                        : "bg-slate-100 text-slate-900 border border-slate-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.usage && (
                    <p className="text-xs mt-2 opacity-70">
                      Tokens: {message.usage.inputTokens}→
                      {message.usage.outputTokens}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          {isConsulting && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-900 border border-slate-200 rounded-lg p-4">
                <Loader className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onSetInputValue(e.target.value)}
              placeholder="Ask a clinical question..."
              disabled={isConsulting}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-primary disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={isConsulting || !inputValue.trim()}
              className="px-6 py-3 bg-med-primary text-white rounded-lg hover:bg-med-secondary disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Differential Diagnosis Tab
const DifferentialDxTab = ({ patientData }) => {
  const diagnoses = patientData?.differentialDiagnoses;

  return (
    <div className="space-y-4">
      {diagnoses?.map((dx, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-med-dark">
                {dx.diagnosis}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{dx.reasoning}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">
                {dx.probability}%
              </div>
              <p className="text-xs text-slate-600">Probability</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${dx.probability}%` }}
              />
            </div>
          </div>
          <div>
            <p className="font-medium text-med-dark mb-2">Recommendations:</p>
            <ul className="space-y-2">
              {dx.recommendations.map((rec, ridx) => (
                <li key={ridx} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-med-primary font-bold">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

// Medications Tab
const MedicationsTab = ({ patientData }) => {
  const [expandedMed, setExpandedMed] = useState(null);
  const medications = patientData?.medications;

  return (
    <div className="space-y-4">
      {medications?.map((med, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <button
            onClick={() => setExpandedMed(expandedMed === idx ? null : idx)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-med-dark">{med.name}</h3>
                <p className="text-sm text-slate-600">
                  {med.dosage} • {med.frequency}
                </p>
              </div>
            </div>
            {expandedMed === idx ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedMed === idx && (
            <div className="border-t border-slate-200 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Indication
                  </p>
                  <p className="font-medium text-med-dark">{med.indication}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Route
                  </p>
                  <p className="font-medium text-med-dark">{med.route}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Start Date
                  </p>
                  <p className="font-medium text-med-dark">
                    {new Date(med.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Status
                  </p>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>

              {med.interactions.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 font-bold text-red-700 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Drug Interactions
                  </div>
                  {med.interactions.map((interaction, iidx) => (
                    <p key={iidx} className="text-sm text-red-600">
                      {interaction}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Lab Results Tab
const LabResultsTab = ({ patientData }) => {
  const labResults = patientData?.labResults;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-left font-bold text-med-dark">
              Test
            </th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">
              Result
            </th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">
              Reference
            </th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">
              Status
            </th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">
              Trend
            </th>
            <th className="px-6 py-4 text-left font-bold text-med-dark">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {labResults?.map((lab, idx) => (
            <tr key={idx} className="hover:bg-slate-50 transition">
              <td className="px-6 py-4 font-medium text-med-dark">
                {lab.test}
              </td>
              <td className="px-6 py-4 font-bold text-lg text-med-dark">
                {lab.value}{" "}
                <span className="text-sm text-slate-600">{lab.unit}</span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {lab.reference}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    lab.status === "normal"
                      ? "bg-green-100 text-green-700"
                      : lab.status === "high"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {lab.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 flex items-center gap-1">
                {lab.trend === "increasing" ? (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                ) : lab.trend === "decreasing" ? (
                  <TrendingUp className="w-4 h-4 text-green-600 rotate-180" />
                ) : (
                  <span className="text-slate-600">—</span>
                )}
                <span className="text-sm text-slate-600 capitalize">
                  {lab.trend}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {new Date(lab.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClinicalDashboard;
