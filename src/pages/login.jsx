
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ================= CHECK IF USER ALREADY LOGGED IN OR RETURNING FROM SOCIAL LOGIN =================
  useEffect(() => {
    // لو المستخدم مسجل دخول خلاص، روحه Diagnosis
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      navigate("/diagnosis");
      return;
    }

    // التحقق من params الـ URL بعد رجوع Google OAuth
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    const name = params.get("name") || params.get("displayName");
    const status = params.get("status");

    if (token || status === "success") {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("hasCompletedProfile", "true");
      if (token) localStorage.setItem("authToken", token); // مفتاح موحد
      if (email) localStorage.setItem("userEmail", email);
      if (name) localStorage.setItem("userName", name);

      navigate("/diagnosis");
    }
  }, [navigate]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // ================= GET CURRENT USER =================
  const getCurrentUser = async () => {
    try {
      const res = await axios.get("/api/Account/GetCurrentUser", {
        withCredentials: true
      });
      return res.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const res = await axios.post(
        "https://brainalyze.runasp.net/api/Account/Login",
        {
          email: formData.email,
          password: formData.password
        }
      );

      console.log("LOGIN SUCCESS:", res.data);

      // ================= STORE BASIC DATA =================
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", formData.email);

      const receivedToken = res.data?.token || res.data?.data?.token;
      if (receivedToken) {
        localStorage.setItem("authToken", receivedToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${receivedToken}`;
      }

      let userId = res.data?.user?.id || res.data?.data?.user?.id;
      if (!userId && receivedToken) {
        try {
          const userRes = await axios.get("https://brainalyze.runasp.net/api/Account/GetCurrentUser", {
            headers: {
              Authorization: `Bearer ${receivedToken}`
            }
          });
          if (userRes.data?.id) {
            userId = userRes.data.id;
          }
        } catch (err) {
          console.error("Could not fetch user ID after login:", err);
        }
      }

      if (userId) {
        localStorage.setItem("userId", userId);
      }

      if (res.data?.user?.displayName || res.data?.data?.user?.displayName) {
        localStorage.setItem("userName", res.data?.user?.displayName || res.data?.data?.user?.displayName);
      }

      // ================= REDIRECT =================
      navigate("/diagnosis");

    } catch (error) {
      console.log("LOGIN ERROR:", error);

      setErrors({
        submit:
          error.response?.data?.message ||
          "Invalid email or password ❌"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleExternalLogin = (provider) => {
    window.location.href = `https://brainalyze.runasp.net/api/Account/external-login?provider=${provider}`;
  };

  const handleGoogleLogin = () => {
    handleExternalLogin("Google");
  };

  // ================= FOOTER BUTTONS =================
  const handlePrivacyPolicy = () => alert("Privacy Policy");
  const handleTermsOfService = () => alert("Terms of Service");
  const handleSupport = () => alert("Support");
  return (
    <div className="bg-gray-100 flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-8 py-4 bg-white shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-8 h-8" />
          <span className="font-bold text-xl text-gray-700">Brainalyze</span>
        </div>

        <Link
          to="/signup"
          className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition transform hover:scale-105"
        >
          Sign Up
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side - Image Section */}
          <div className="lg:w-1/2 p-4 lg:p-0 bg-brain-gradient flex items-center justify-center relative">
            <div className="p-8 space-y-6">
              <div className="rounded-xl overflow-hidden shadow-lg bg-white p-2">
                <img
                  src="/images/login.svg"
                  alt="Login Illustration"
                  className="w-full h-auto object-cover rounded-lg"
                />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-gray-900 text-3xl font-poppins font-bold">
                  AI-Powered Brain Tumor Analysis
                </h2>
                <p className="text-gray-600 text-base leading-relaxed font-rubik">
                  Advanced artificial intelligence technology for accurate brain tumor detection and analysis,
                  helping medical professionals make informed decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:w-1/2 p-12 space-y-8">
            <div className="text-center space-y-1">
              <h1 className="text-gray-900 text-3xl font-poppins font-bold">Welcome Back</h1>
              <p className="text-gray-600 text-base">Log in to your Brainalyze account</p>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{errors.submit}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-left input-brainalyze px-3 transition border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-left input-brainalyze px-3 transition border-gray-300"
                  required
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-gray-600">Remember me</label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-500 transition"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full p-3 text-white bg-blue-gradient hover:opacity-90 rounded-lg font-medium transition duration-150 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : 'Log In'}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">Or log in with</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-4">
              <button onClick={handleGoogleLogin} className="w-full p-3 flex items-center justify-center space-x-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-150 transform hover:scale-105">
                <img src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp" className="w-5 h-5 mr-2" alt="Google logo" />
                <span className="font-medium">Continue with Google</span>
              </button>
            </div>

            <div className="text-center pt-4">
              <span className="text-gray-600 text-sm">Don't have an account?</span>
              <Link to="/signup" className="text-blue-600 font-medium text-sm hover:underline ml-1">Sign up here</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-8 h-8" />
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

      <style jsx>{`
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .font-rubik { font-family: 'Rubik', sans-serif; }
        .bg-brain-gradient { background-image: linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%); }
        .bg-blue-gradient { background-image: linear-gradient(90deg, #1C64F2 0%, #4F8BFF 100%); }
        .input-brainalyze { padding-top: 0.6rem; padding-bottom: 0.6rem; border-width: 1px; }
      `}</style>
    </div>
  );
};

export default Login;