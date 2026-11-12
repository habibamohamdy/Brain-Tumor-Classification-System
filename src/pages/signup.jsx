
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [licenseFile, setLicenseFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ================= TOKEN MANAGEMENT =================
  const saveToken = (token) => {
    if (token) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("tokenExpiry", Date.now() + 24 * 60 * 60 * 1000);
      // إضافة التوكن إلى axios بشكل افتراضي
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  };

  const saveUserData = (user) => {
    if (user) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", user.email || formData.email);
      localStorage.setItem("userName", user.displayName || user.fullName || formData.fullName);
      if (user.id) localStorage.setItem("userId", user.id);
      localStorage.setItem("hasCompletedProfile", "true");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, license: "File size must be less than 10MB" });
      return;
    }
    setLicenseFile(file);
    setErrors({ ...errors, license: "" });
  };



  const checkEmailExists = async (email) => {
    try {
      const res = await axios.get(`https://brainalyze.runasp.net/api/Account/CheckEmailExists?email=${email}`);
      return res.data;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const validateForm = async () => {
    let newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
 } 
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one special character";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExternalLogin = (provider) => {
    window.location.href = `https://brainalyze.runasp.net/api/Account/external-login?provider=${provider}`;
  };

  const handleGoogleSignUp = () => {
    handleExternalLogin("Google");
  };

  // ✅ دالة التسجيل مع التوكن
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("FullName", formData.fullName);
      formDataToSend.append("Email", formData.email);
      formDataToSend.append("Password", formData.password);
      
      if (licenseFile) {
        formDataToSend.append("MedicalLicenceId", licenseFile);
      }

      const res = await axios.post(`https://brainalyze.runasp.net/api/Account/Register`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("Registration Response:", res.data);

      if (res.status === 200 || res.status === 201) {
        // ننتظر 1.5 ثانية لضمان حفظ الحساب الجديد في قاعدة بيانات السيرفر
        await new Promise(resolve => setTimeout(resolve, 1500));

        // ✅ محاولة تسجيل الدخول التلقائي للحصول على التوكن والـ User ID
        try {
          const loginRes = await axios.post(
            "https://brainalyze.runasp.net/api/Account/Login",
            {
              email: formData.email,
              password: formData.password
            }
          );
          
          console.log("AUTO-LOGIN SUCCESS:", loginRes.data);
          
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userEmail", formData.email);
          
          const token = loginRes.data?.token || loginRes.data?.data?.token;
          if (token) {
            saveToken(token);
            
            // جلب الـ User ID باستخدام التوكن
            try {
              const userRes = await axios.get(
                "https://brainalyze.runasp.net/api/Account/GetCurrentUser",
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (userRes.data?.id) {
                localStorage.setItem("userId", userRes.data.id);
              }
            } catch (e) {
              console.log("Auto-login user fetch error:", e);
            }
          }
          
          const userId = loginRes.data?.user?.id || loginRes.data?.data?.user?.id || loginRes.data?.id || loginRes.data?.userId;
          if (userId) {
            localStorage.setItem("userId", userId);
          }
          
          if (loginRes.data?.user) {
            saveUserData(loginRes.data.user);
          } else {
            saveUserData({
              email: formData.email,
              fullName: formData.fullName
            });
          }
        } catch (loginErr) {
          console.error("Auto-login failed:", loginErr);
          
          // في حال فشل تسجيل الدخول التلقائي، نحاول استخراج الـ ID من رد التسجيل الأساسي
          const resolvedUserId = res.data?.id || res.data?.userId || res.data?.user?.id || res.data?.data?.user?.id || res.data?.data?.id;
          if (resolvedUserId) {
            localStorage.setItem("userId", resolvedUserId);
          }

          saveUserData({
            email: formData.email,
            fullName: formData.fullName
          });
        }
        
        navigate("/diagnosis");
      }

    } catch (error) {
      console.error("Registration Error:", error);
      
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        
        // معالجة أخطاء التوكن
        if (error.response.status === 401) {
          setErrors({ submit: "Authentication failed. Please try again." });
        } else if (error.response.data?.errors) {
          const serverErrors = Object.values(error.response.data.errors).flat();
          setErrors({ submit: serverErrors.join(", ") });
        } else if (error.response.data?.message) {
          setErrors({ submit: error.response.data.message });
        } else if (error.response.data?.title) {
          setErrors({ submit: error.response.data.title });
        } else {
          setErrors({ submit: `Error ${error.response.status}: Registration failed` });
        }
      } else if (error.request) {
        setErrors({ submit: "Cannot connect to server. Please check your internet connection." });
      } else {
        setErrors({ submit: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyPolicy = () => alert("Privacy Policy");
  const handleTermsOfService = () => alert("Terms of Service");
  const handleSupport = () => alert("Support");

  // ================= RENDER =================
  return (
    <div className="bg-gray-100 flex flex-col min-h-screen">

      {/* HEADER */}
      <header className="w-full flex justify-between items-center px-4 sm:px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-8 h-8" />
          <span className="font-bold text-xl text-gray-700">Brainalyze</span>
        </div>
        <Link 
          to="/login" 
          className="px-4 sm:px-5 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition"
        >
          Login
        </Link>
      </header>

      {/* MAIN */}
      <main className="flex flex-1 justify-center items-center px-2 sm:px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden max-w-4xl w-full mx-2 md:mx-0">

          {/* LEFT SIDE - Image Section */}
          <div className="w-full md:w-1/2 flex flex-col">
            <img
              src="/images/signup.svg"
              alt="Brain Analysis"
              className="w-full h-64 md:h-full object-cover object-top"
            />
            <div className="p-4 md:p-6 bg-blue-50">
              <h2 className="font-semibold text-lg text-gray-900">AI-Powered Brain Analysis</h2>
              <p className="text-gray-600 text-sm mt-1">Advanced technology for accurate brain tumor detection and analysis</p>
            </div>
          </div>

          {/* RIGHT SIDE - Form Section */}
          <div className="w-full md:w-[45%] p-4 sm:p-6 md:p-10 flex flex-col justify-center">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 text-center">Create Account</h1>
            <p className="text-gray-600 mb-8 text-center text-sm sm:text-base">Register as a Healthcare Provider</p>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm text-center">{errors.submit}</p>
              </div>
            )}

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  placeholder="Enter your full name" 
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                    errors.fullName ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                  }`} 
                />
                {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email" 
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                  }`} 
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Create a password (min 8 characters)" 
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                    errors.password ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                  }`} 
                />
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="Confirm your password" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                  }`} 
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
              </div>

              {/* Medical License / ID - File Upload Only (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical License / ID <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <label className="w-full flex flex-col items-center justify-center px-6 py-6 sm:py-8 border-2 border-dashed rounded-lg cursor-pointer transition border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-400">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 text-center">
                    {licenseFile ? licenseFile.name : "Upload Medical License / ID"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    PDF, JPG or PNG (Max 10MB) - Optional
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,image/jpeg,image/jpg,image/png" 
                    className="hidden" 
                    onChange={handleLicenseUpload} 
                  />
                </label>
                {errors.license && <p className="text-red-500 text-xs mt-1">{errors.license}</p>}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : 'Sign Up'}
              </button>
            </form>

            <div className="mt-4 text-center text-gray-500 text-sm">or continue with</div>

            {/* Google + LinkedIn Buttons */}
            <div className="flex flex-col items-center mt-3 space-y-3">
              <button 
                onClick={handleGoogleSignUp} 
                className="flex items-center justify-center w-64 sm:w-full border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                <img src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp" className="w-5 h-5 mr-2" alt="Google logo" />
                Continue with Google
              </button>
            </div>

            <p className="text-center text-gray-600 mt-6 text-sm sm:text-base">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/images/logo.svg" alt="Brainalyze Logo" className="w-9 h-9 rounded-sm" />
            <div className="text-white text-xl font-poppins font-bold">Brainalyze</div>
          </div>
          <div className="flex flex-wrap justify-center space-x-4 md:space-x-8 my-2 md:my-0">
            <button onClick={handlePrivacyPolicy} className="hover:text-white transition">Privacy Policy</button>
            <button onClick={handleTermsOfService} className="hover:text-white transition">Terms of Service</button>
            <button onClick={handleSupport} className="hover:text-white transition">Support</button>
          </div>
          <div className="mt-2 md:mt-0 text-center md:text-right">© Brainalyze 2025. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default SignUp;