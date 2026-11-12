import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // تحديد الوضع الحالي (إدخال إيميل أم تغيير باسوورد)
  const isForgotPassword = location.pathname === "/forgot-password";
  const isResetPassword = location.pathname === "/reset-password";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // جلب البيانات من sessionStorage لو في وضع reset-password
  useEffect(() => {
    if (isResetPassword) {
      const savedEmail = sessionStorage.getItem("resetEmail");
      const savedCode = sessionStorage.getItem("resetCode");
      if (savedEmail && savedCode) {
        setEmail(savedEmail);
        setCode(savedCode);
      } else {
        navigate("/forgot-password");
      }
    }
  }, [isResetPassword, navigate]);

  // ================= إرسال الإيميل (Forgot Password) =================
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post("https://brainalyze.runasp.net/api/Account/forgot-password", { email });
      console.log("Response:", res.data);

      sessionStorage.setItem("resetEmail", email);
      setSuccess("✅ Verification code sent to your email!");

      setTimeout(() => {
        navigate("/verification");
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || "Email not found");
    } finally {
      setIsLoading(false);
    }
  };

  // ================= تغيير الباسوورد (Reset Password) =================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError("Password must contain a special character");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post("https://brainalyze.runasp.net/api/Account/reset-password", {
        email,
        token: code,
        newPassword: formData.password
      });

      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetCode");

      setSuccess("✅ Password reset successful!");

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSupport = () => alert("Support");
  const handlePrivacyPolicy = () => alert("Privacy Policy");
  const handleTermsOfService = () => alert("Terms of Service");

  return (
    <div className="bg-gray-100 flex flex-col min-h-screen">
      <header className="w-full flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center space-x-2">
          <img src="/images/logo.svg" alt="Logo" className="w-8 h-8" />
          <h1 className="text-xl font-bold">Brainalyze</h1>
        </div>
        <Link to="/signup" className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg">
          Sign Up
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden">

          <div className="lg:w-1/2 p-8 bg-brain-gradient">
            <img src="/images/login.svg" alt="Illustration" className="w-full" />
            <h2 className="text-2xl font-bold mt-4">AI-Powered Brain Analysis</h2>
          </div>

          <div className="lg:w-1/2 p-12">
            <h1 className="text-3xl font-bold mb-2">
              {isForgotPassword ? "Forgot Password" : "Reset Password"}
            </h1>
            <p className="text-gray-600 mb-6">
              {isForgotPassword
                ? "Enter your email to receive a verification code"
                : `Enter your new password for ${email}`}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={isForgotPassword ? handleForgotPassword : handleResetPassword}>
              {isForgotPassword ? (
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 mb-4"
                  required
                />
              ) : (
                <>
                  <input
                    type="password"
                    name="password"
                    placeholder="New Password (min 8 chars + special char)"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-3 mb-4"
                    required
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-3 mb-4"
                    required
                  />
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
              >
                {isLoading
                  ? (isForgotPassword ? "Sending..." : "Resetting...")
                  : (isForgotPassword ? "Send Reset Link" : "Reset Password")}
              </button>
            </form>

            <div className="text-center mt-4">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <img src="/images/logo.svg" alt="Logo" className="w-8 h-8" />
            <span>Brainalyze</span>
          </div>
          <div className="flex gap-4">
            <button onClick={handlePrivacyPolicy}>Privacy</button>
            <button onClick={handleTermsOfService}>Terms</button>
            <button onClick={handleSupport}>Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResetPassword;