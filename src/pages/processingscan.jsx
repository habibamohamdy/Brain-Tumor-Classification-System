
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const ProcessingScan = () => {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isProcessing, setIsProcessing] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { fileName, patientName, patientId, scanDate, analysisId, analysisResult } = location.state || {};

  // useRef so the value persists across renders without causing re-renders
  const isCancelledRef = useRef(false);

  const navigateToResults = () => {
    if (isCancelledRef.current) return;

    console.log("Upload analysisResult:", analysisResult);

    // ✅ The upload response already contains the AI result (AnalysisResultDto)
    // There is NO GET /api/Analysis/{id} endpoint — we use what the upload returned
    const data = analysisResult || {};

    // ✅ Handle both flat structure (fields at root) and nested (fields inside data.ai)
    const ai = data.ai || data;

    // ✅ Extract fields using actual API field names from Swagger
    const tumorType = ai.tumorType || ai.tumor_type || "none";

    // Swagger says confidence is a string — safely parse to number
    const rawConfidence = ai.confidence ?? 0;
    const confidence = typeof rawConfidence === "string"
      ? parseFloat(rawConfidence) || 0
      : rawConfidence;

    const classification = ai.classification || "Not specified";

    // API uses "tumorImagePath", not "tumorImageUrl"
    const tumorImageUrl = ai.tumorImagePath || ai.tumorImageUrl || ai.tumor_image_path || "";

    // ✅ Single clean object — everything Results page needs
    const resultData = {
      patient_name: patientName || "N/A",
      patient_id: patientId || "N/A",
      scan_date: scanDate || data.createdAt || new Date().toLocaleDateString(),
      tumorType,
      confidence,        // numeric 0–1; Results page will multiply × 100
      classification,
      tumorImageUrl,
    };

    console.log("Navigating to Results with:", resultData);

    navigate("/results", {
      state: {
        analysisId,
        patientId,
        resultData,
      },
    });
  };

  useEffect(() => {
    if (!isProcessing) return;

    const totalTime = 30;
    let elapsed = 0;

    const timer = setInterval(() => {
      if (isCancelledRef.current) {
        clearInterval(timer);
        return;
      }

      elapsed += 1;
      setTimeRemaining(prev => Math.max(0, prev - 1));
      setProgress(Math.min(100, (elapsed / totalTime) * 100));

      if (elapsed >= totalTime) {
        clearInterval(timer);
        setTimeout(navigateToResults, 1200);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isProcessing]);

  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setProgress(100);
    setTimeRemaining(0);

    setTimeout(() => navigate('/results', {
      state: {
        analysisId,
        patientId,
        resultData: {
          patient_name: patientName || "N/A",
          patient_id: patientId || "N/A",
          scan_date: scanDate || new Date().toLocaleDateString(),
          tumorType: "none",
          confidence: 0,
          classification: "Cancelled",
          tumorImageUrl: "",
          _error: true,
          _errorMessage: "Analysis was cancelled by user.",
        },
      },
    }), 500);
  };

  const steps = [
    { name: 'Image Preprocessing', status: progress > 0 },
    { name: 'AI Analysis', status: progress > 33 },
    { name: 'Result Generation', status: progress > 66 }
  ];

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] min-h-screen">
      {/* NAV */}
      <nav className="bg-white shadow-sm py-5 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-900">Brainalyze</h1>
          </div>
          <div className="hidden md:flex flex-1 justify-center">
            <ul className="flex space-x-10 text-gray-800 font-semibold text-lg">
              <li><Link to="/" className="hover:text-blue-700">Home</Link></li>
              <li><Link to="/about" className="hover:text-blue-700">About</Link></li>
              <li><Link to="/diagnosis" className="text-blue-700">Diagnosis</Link></li>
              <li><Link to="/results" className="hover:text-blue-700">Results</Link></li>
              <li><Link to="/contact" className="hover:text-blue-700">Contact Us</Link></li>
            </ul>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-800 text-2xl focus:outline-none">
              {isOpen ? "✖" : "☰"}
            </button>
          </div>
        </div>
        <ul className={`md:hidden flex flex-col items-center bg-white w-full space-y-2 mt-2 transition-all duration-300 ${isOpen ? "block" : "hidden"}`}>
          <li><Link to="/" className="hover:text-blue-700 py-2 block">Home</Link></li>
          <li><Link to="/about" className="hover:text-blue-700 py-2 block">About</Link></li>
          <li><Link to="/diagnosis" className="text-blue-700 py-2 block">Diagnosis</Link></li>
          <li><Link to="/results" className="hover:text-blue-700 py-2 block">Results</Link></li>
          <li><Link to="/contact" className="hover:text-blue-700 py-2 block">Contact Us</Link></li>
        </ul>
      </nav>

      {/* MAIN */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-48 bg-gradient-to-b from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-inner">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2c1.1 0 2 .9 2 2v1h4a1 1 0 011 1v2a1 1 0 01-1 1h-1v1" />
                    <circle cx="8" cy="12" r="1" fill="currentColor"/>
                    <circle cx="16" cy="12" r="1" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            Your MRI Scan is Being Analyzed...
          </h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            Our AI system is processing your brain MRI using deep learning models.
          </p>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto text-left">
            <p className="text-sm text-blue-700"><span className="font-semibold">File:</span> {fileName || 'MRI_Scan.dcm'}</p>
            {patientName && <p className="text-sm text-blue-700 mt-1"><span className="font-semibold">Patient:</span> {patientName}</p>}
            {patientId && <p className="text-sm text-blue-700 mt-1"><span className="font-semibold">Patient ID:</span> {patientId}</p>}
          </div>

          {/* Progress */}
          <div className="w-full max-w-md mx-auto mb-8">
            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="mt-4 text-center text-slate-400 text-sm">
              <span>Estimated Time Remaining: {timeRemaining} second{timeRemaining !== 1 ? 's' : ''}...</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleCancel}
              disabled={!isProcessing}
              className={`px-5 py-2 border border-blue-600 text-blue-600 rounded-lg transition ${isProcessing ? 'hover:bg-blue-50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            >
              {isProcessing ? 'Cancel Analysis' : 'Analysis Cancelled'}
            </button>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-gray-200">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${step.status ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className={`text-sm font-medium ${step.status ? 'text-green-600' : 'text-gray-400'}`}>{step.name}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-200 py-10 mt-12">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold">Brainalyze</h3>
            </div>
            <p className="text-sm text-gray-300 max-w-md">
              Revolutionizing medical diagnostics with AI-powered brain tumor detection.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/diagnosis" className="hover:text-white">Diagnosis</Link></li>
              <li><Link to="/results" className="hover:text-white">Results</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Mail size={16} /><span>contact.brainalyze@gmail.com</span></div>
              <div className="flex items-center gap-2"><Phone size={16} /><span>+1 (555) 123-4567</span></div>
              <div className="flex items-center gap-2"><MapPin size={16} /><span>Cairo, Egypt</span></div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          © 2025 Brainalyze. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ProcessingScan;