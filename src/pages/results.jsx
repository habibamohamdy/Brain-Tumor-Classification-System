import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [resultData, setResultData] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const analysisId = location.state?.analysisId;

  const patientId =
    location.state?.patientId ||
    localStorage.getItem("patientId");

  // ================= GET RESULTS =================
  useEffect(() => {
    const dataFromNav = location.state?.resultData;

    if (!dataFromNav) {
      setStatus("failed");
      return;
    }

    // ✅ Handle error/cancelled states from ProcessingScan
    if (dataFromNav._error) {
      setStatus("failed");
      return;
    }

    // ✅ Normalize field names (handle both camelCase and snake_case)
    const tumorType =
      dataFromNav.tumorType ||
      dataFromNav.tumor_type ||
      "none";

    const confidence =
      dataFromNav.confidence ?? 0;

    const classification =
      dataFromNav.classification || "";

    // ✅ Determine tumor vs no_tumor
    const isTumor =
      tumorType &&
      tumorType.toLowerCase() !== "none";

    const formatted = {
      patient_name: dataFromNav.patient_name || "N/A",
      patient_id: dataFromNav.patient_id || patientId || "N/A",
      scan_date: dataFromNav.scan_date || new Date().toLocaleDateString(),

      detectionProbability: (confidence * 100).toFixed(1),

      tumor_type: tumorType,
      classification: classification,
      tumorImageUrl: dataFromNav.tumorImageUrl || "",

      result: isTumor ? "tumor" : "no_tumor",
    };

    setResultData(formatted);
    setStatus(formatted.result);

  }, []);
  // ================= SAVE NOTES =================
  const handleSaveReview = async () => {
    if (!clinicalNotes.trim()) {
      alert("Please enter clinical notes before saving.");
      return;
    }

    try {
      setIsLoading(true);

      if (!analysisId) {
        alert("Missing analysisId. Cannot save report.");
        return;
      }

      // Updated to match Swagger: PUT /api/Analysis/add-notes
      const res = await axios.put(
        "https://brainalyze.runasp.net/api/Analysis/add-notes",
        {
          analysisId: analysisId,
          doctorId: localStorage.getItem("userId") || "929fa1cc-9de6-4d78-9bb4-13ca64ec2656", // Dynamic fallback
          notes: clinicalNotes
        },
        { withCredentials: true }
      );

      console.log("SAVE SUCCESS:", res.data);
      alert("✅ Report finalized and saved successfully!");

    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("❌ Failed to save report: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // ================= EXPORT PDF =================
  const handleExportPDF = () => {
    window.print();
  };
  return (
    <div className="bg-[#F8FAFC] min-h-screen text-gray-900 flex flex-col">

      {/* NAVBAR */}
      <nav className="bg-white shadow-sm py-5 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6 space-y-3 md:space-y-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-900">Brainalyze</h1>
          </div>

          <ul className="hidden md:flex space-x-10 text-gray-800 font-semibold text-lg mx-auto">
            <li><Link to="/" className="hover:text-blue-700">Home</Link></li>
            <li><Link to="/about" className="hover:text-blue-700">About</Link></li>
            <li><Link to="/diagnosis" className="hover:text-blue-700">Diagnosis</Link></li>
            <li><Link to="/results" className="text-blue-700">Results</Link></li>
            <li><Link to="/contact" className="hover:text-blue-700">Contact Us</Link></li>
          </ul>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-800 text-2xl focus:outline-none">
              {isOpen ? "✖" : "☰"}
            </button>
          </div>
        </div>

        <div className={`md:hidden transition-all duration-300 ${isOpen ? "block" : "hidden"}`}>
          <ul className="flex flex-col items-center bg-white w-full space-y-2 py-4">
            <li><Link to="/" className="hover:text-blue-700 py-2 block">Home</Link></li>
            <li><Link to="/about" className="hover:text-blue-700 py-2 block">About</Link></li>
            <li><Link to="/diagnosis" className="hover:text-blue-700 py-2 block">Diagnosis</Link></li>
            <li><Link to="/results" className="text-blue-700 py-2 block">Results</Link></li>
            <li><Link to="/contact" className="hover:text-blue-700 py-2 block">Contact Us</Link></li>
          </ul>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-grow container mx-auto px-6 py-8">

        {/* NO TUMOR SECTION */}
        {status === "no_tumor" && (
          <div className="max-w-7xl mx-auto px-12 xl:px-20 py-14 bg-[#f8fafc] min-h-screen font-['Rubik']">
            <div className="mb-12">
              <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
              <p className="text-gray-500 mt-2 text-base">Comprehensive brain scan analysis completed</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 mb-8 items-stretch">
              <div className="lg:col-span-6 bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center h-full">
                <h2 className="text-base font-semibold text-gray-800 mb-6">Patient Information</h2>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Name:</span><span className="font-medium text-gray-900">{resultData?.patient_name || "N/A"}</span></div>
                  <div className="flex justify-between"><span>Patient ID:</span><span className="font-medium text-gray-900">{resultData?.patient_id || "N/A"}</span></div>
                  <div className="flex justify-between"><span>Scan Date:</span><span className="font-medium text-gray-900">{resultData?.scan_date || "N/A"}</span></div>
                  <div className="flex justify-between"><span>Scan Type:</span><span className="font-medium text-gray-900">{resultData?.scan_type || "MRI"}</span></div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white p-10 rounded-xl border border-gray-200 shadow-sm relative text-center flex flex-col justify-center h-full">
                <span className="absolute top-6 right-6 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">Scan Complete</span>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tumor Detected</h2>
                <p className="text-sm text-gray-500 mb-6">Negative: AI Preliminary Classification</p>
                <div className="bg-green-100 text-green-700 px-5 py-3 rounded-lg text-sm">
                  AI Confidence Score indicates high probability of healthy tissue. Clinical validation required.
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between min-h-[450px]">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Detection Probability</h2>
                <div className="text-center mb-8">
                  <p className="text-6xl font-bold text-green-600 leading-tight">{resultData?.detectionProbability || 0}%</p>
                  <p className="text-base text-gray-500 mt-2">Probability of tumor presence</p>
                </div>
                <div className="mb-8">
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2 font-medium">
                    <span>Confidence Level</span>
                    <span className={`px-4 py-1.5 rounded-full text-sm ${Number(resultData?.detectionProbability || 0) >= 70 ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>
                      {Number(resultData?.detectionProbability || 0) >= 70 ? "High" : "Low"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-1000 ease-out"
                      style={{ width: `${resultData?.detectionProbability || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[450px]">
                <h2 className="text-base font-semibold text-gray-800 mb-6">Doctor's Clinical Validation</h2>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full flex-grow border border-gray-200 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-normal"
                  placeholder="Enter clinical observations..."
                />
                <div className="flex justify-end gap-4 mt-8">
                  <button onClick={handleExportPDF} className="px-6 py-2.5 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">Export as PDF</button>
                  <button
                    onClick={handleSaveReview}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save & Finalize Report"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TUMOR SECTION */}
        {status === "tumor" && (
          <div className="max-w-7xl mx-auto px-12 xl:px-20 py-14 bg-[#f8fafc] min-h-screen font-['Rubik']">
            <div className="mb-12">
              <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
              <p className="text-gray-500 mt-2 text-base font-normal">Comprehensive brain scan analysis completed</p>
            </div>

            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 py-10 px-6 mb-8 text-center relative">
              <span className="absolute top-6 left-8 text-sm text-gray-400 font-normal">Analysis Outcome</span>
              <span className="absolute top-6 right-8 bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-medium uppercase tracking-wider">High Priority</span>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-600 text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-semibold text-[#ef4444] mb-3">Tumor Detected</h2>
              <div className="text-base text-gray-600 mb-6 space-y-1 font-normal">
                <p>Tumor Type: <span className="text-gray-800 font-medium">{resultData?.tumor_type || "Brain Tumor"}</span></p>
                <p>Classification:
                  <span className={`font-semibold uppercase ml-1 ${resultData?.classification?.toLowerCase().includes('malignant') ? 'text-red-600' : 'text-[#f59e0b]'}`}>
                    {resultData?.classification || "Not Specified"}
                  </span>
                </p>
              </div>
              <div className="bg-[#fff1f1] text-[#d93025] px-6 py-3 rounded-lg text-sm border border-[#fbd5d5] inline-flex items-center gap-2 font-normal">
                <span className="bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">i</span>
                Immediate consultation with a neurologist is recommended. AI Preliminary Classification.
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm min-h-[300px]">
                  <h2 className="text-base font-semibold text-gray-800 mb-6">Patient Information</h2>
                  <div className="space-y-4 text-sm text-gray-600 font-normal">
                    <div className="flex justify-between border-b border-gray-50 pb-2"><span>Name:</span><span className="font-medium text-gray-900">{resultData?.patient_name || "N/A"}</span></div>
                    <div className="flex justify-between border-b border-gray-50 pb-2"><span>Patient ID:</span><span className="font-medium text-gray-900">{resultData?.patient_id || "N/A"}</span></div>
                    <div className="flex justify-between border-b border-gray-50 pb-2"><span>Scan Date:</span><span className="font-medium text-gray-900">{resultData?.scan_date || "N/A"}</span></div>
                    <div className="flex justify-between"><span>Scan Type:</span><span className="font-medium text-gray-900">{resultData?.scan_type || "MRI"}</span></div>
                  </div>
                </div>

                {resultData?.classification?.toLowerCase().includes("malignant") && (
                  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Detection Probability</h2>
                    <p className="text-6xl font-bold text-red-600 mb-4">{resultData?.probability || resultData?.detectionProbability || 0}%</p>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
                      <div
                        className="bg-red-500 h-full transition-all duration-1000 ease-out"
                        style={{ width: `${resultData?.probability || resultData?.detectionProbability || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm font-medium text-gray-500">
                      <span>Confidence</span>
                      <span className={Number(resultData?.probability || resultData?.detectionProbability || 0) >= 70 ? "text-red-600" : "text-yellow-600"}>
                        {Number(resultData?.probability || resultData?.detectionProbability || 0) >= 70 ? "High" : "Low"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[450px]">
                <h2 className="text-base font-semibold text-gray-800 mb-6">Doctor's Clinical Validation</h2>
                <textarea
                  className="w-full flex-grow border border-gray-200 rounded-lg p-4 text-sm bg-[#fafafa] outline-none resize-none text-gray-600 font-normal focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter clinical observations..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
                <div className="flex justify-end gap-4 mt-8">
                  <button onClick={handleExportPDF} className="px-6 py-2.5 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">Export as PDF</button>
                  <button
                    onClick={handleSaveReview}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save & Finalize Report"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAILED SECTION */}
        {status === "failed" && (
          <div className="flex justify-center mt-10">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-4xl text-center">
              <img src="/images/result.svg" alt="Analysis Failed Icon" className="w-48 h-48 mx-auto mb-6" />
              <h2 className="text-4xl font-extrabold text-red-600 mb-4">Analysis Failed</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                We encountered an issue while processing your MRI scan.
                Please check your file format and try again.
              </p>
              <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-3 rounded-lg mb-10 w-full max-w-md flex items-center justify-center mx-auto">
                <span className="font-medium text-sm">Error Code: 502 – Server Timeout</span>
              </div>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-8 w-full justify-center">
                <button onClick={() => navigate("/processing")} className="px-8 py-3 rounded-xl text-white font-semibold transition bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-lg">
                  Retry Analysis
                </button>
                <Link to="/diagnosis" className="px-8 py-3 rounded-xl text-blue-600 font-semibold border-2 border-blue-600 hover:bg-blue-50 transition">
                  Go Back to Diagnosis
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                If the issue persists, contact our support team at{" "}
                <a href="mailto:contact.brainalyze@gmail.com" className="text-blue-600 hover:underline">contact.brainalyze@gmail.com</a>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-200 py-10 mt-12">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold">Brainalyze</h3>
            </div>
            <p className="text-sm text-gray-300 max-w-md">
              Revolutionizing medical diagnostics with AI-powered brain tumor detection.
              Empowering healthcare professionals worldwide with accurate, fast, and reliable analysis.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/diagnosis" className="hover:text-white transition-colors">Diagnosis</Link></li>
              <li><Link to="/results" className="hover:text-white transition-colors">Results</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-blue-500" />
                <span className="text-gray-300">contact.brainalyze@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-blue-500" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-blue-500" />
                <span className="text-gray-300">Cairo, Egypt</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">© 2025 Brainalyze. All rights reserved.</div>
            <div className="text-sm text-gray-400">Made with <span className="text-red-500">❤</span> for better healthcare</div>
          </div>
        </div>
      </footer>
    </div>
  );
}