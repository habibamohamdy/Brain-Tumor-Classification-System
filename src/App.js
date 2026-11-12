import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// ==== Main Pages ====
import Home from "./pages/home";
import About from "./pages/about";
import Diagnosis from "./pages/diagnosis";
import Results from "./pages/results";
import Contact from "./pages/contactus";

// ==== Auth Pages ====
import Login from "./pages/login";
import Signup from "./pages/signup";
import Verification from "./pages/verification";
import ResetPassword from "./pages/ResetPassword";

// ==== Processing ====
import ProcessingScan from "./pages/processingscan";

import "./App.css";

// Global component to handle Social Login redirects
const SocialLoginHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const email = params.get("email");
    const name = params.get("name") || params.get("displayName");
    const status = params.get("status");

    if (token || status === "success") {
      console.log("Social login detected, setting session...");
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("hasCompletedProfile", "true");
      if (token) localStorage.setItem("authToken", token);
      if (email) localStorage.setItem("userEmail", email);
      if (name) localStorage.setItem("userName", name);
      
      // Clear URL params and go to diagnosis
      navigate("/diagnosis", { replace: true });
    }
  }, [location, navigate]);

  return null;
};

function App() {
  return (
    <Router>
      <SocialLoginHandler />
      <div className="App">
        <Routes>

          {/* ==== Home ==== */}
          <Route path="/" element={<Home />} />

          {/* ==== Public Pages ==== */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* ==== Auth Pages ==== */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/forgot-password" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ==== Protected Pages ==== */}
          <Route 
            path="/diagnosis" 
            element={
              <ProtectedRoute>
                <Diagnosis />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/results" 
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/processing" 
            element={
              <ProtectedRoute>
                <ProcessingScan />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/processingscan" 
            element={
              <ProtectedRoute>
                <ProcessingScan />
              </ProtectedRoute>
            } 
          />

          {/* ==== Static Pages ==== */}
          <Route 
            path="/privacy" 
            element={<StaticPage title="Privacy Policy" text="Coming Soon" />} 
          />
          <Route 
            path="/terms" 
            element={<StaticPage title="Terms of Service" text="Coming Soon" />} 
          />
          <Route 
            path="/support" 
            element={<StaticPage title="Support" text="Coming Soon" />} 
          />

          {/* ==== 404 ==== */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            } 
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;

// ================= STATIC PAGE =================
function StaticPage({ title, text }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 shadow rounded">
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}