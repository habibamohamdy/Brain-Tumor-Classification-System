import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Verification = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // جلب الإيميل من sessionStorage (اللي اتحط في صفحة ForgotPassword)
    const savedEmail = sessionStorage.getItem("resetEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      // لو مفيش إيميل، يروح لصفحة ForgotPassword
      navigate("/forgot-password");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post("https://brainalyze.runasp.net/api/Account/verify-reset-code", {
        email,
        code
      });

      console.log("Response:", res.data);

      // حفظ الكود مؤقتًا للصفحة التالية
      sessionStorage.setItem("resetCode", code);
      setSuccess("✅ Code verified successfully!");

      // التوجيه لصفحة reset-password بعد 1.5 ثانية
      setTimeout(() => {
        navigate("/reset-password");
      }, 1500);

    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // دوال الـ Footer
  const handlePrivacyPolicy = () => alert("Privacy Policy");
  const handleTermsOfService = () => alert("Terms of Service");
  const handleSupport = () => alert("Support");

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* ================= NAVBAR ================= */}
      <nav className="bg-white shadow-sm py-5 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto flex justify-between items-center px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img
              src="/images/logo.svg"
              alt="Brainalyze Logo"
              className="w-10 h-10"
            />
            <h1 className="text-xl font-bold text-gray-900">Brainalyze</h1>
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <div className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center">

          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-6-8.485"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Verify Reset Code
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Enter the verification code sent to <strong>{email}</strong>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-600 text-sm text-center">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
              required
              autoFocus
            />

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-500">
            Didn't receive a code?{" "}
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-blue-600 hover:underline font-medium"
            >
              Try again
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Need assistance? Contact us at{" "}
            <span className="text-blue-600 font-medium">
              contact.brainalyze@gmail.com
            </span>
          </div>

        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-9 h-9 rounded-sm" />
            <div className="text-white text-xl font-poppins font-bold">Brainalyze</div>
          </div>
          <div className="flex flex-wrap justify-center space-x-4 md:space-x-8 my-2 md:my-0">
            <button onClick={handlePrivacyPolicy} className="hover:text-white transition">Privacy Policy</button>
            <button onClick={handleTermsOfService} className="hover:text-white transition">Terms of Service</button>
            <button onClick={handleSupport} className="hover:text-white transition">Support</button>
          </div>
          <div className="mt-2 md:mt-0">© Brainalyze 2025. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
};

export default Verification;