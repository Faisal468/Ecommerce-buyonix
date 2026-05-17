import { useState } from "react";
import { FaStore, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import SellerLogin from "../components/SellerLogin.tsx";
import SellerSignup from "../components/SellerSignup.tsx";
import logo from "../../assets/logo.png";

const benefits = [
  {
    title: "Access millions of customers across Pakistan",
    desc: "Reach a vast customer base and expand your business nationwide.",
  },
  {
    title: "AI-powered analytics and sales insights",
    desc: "Make data-driven decisions with advanced analytics tools.",
  },
  {
    title: "Secure payment processing and fast payouts",
    desc: "Get paid quickly with our reliable payment system.",
  },
  {
    title: "24/7 seller support and training resources",
    desc: "Get help whenever you need it from our dedicated team.",
  },
];

const SellerPortal = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50">

      {/* Top bar: logo center, back button left */}
      <div className="relative flex items-center justify-center px-4 pt-5 pb-3">
        {/* Back to Home — always visible, left side */}
        <Link
          to="/"
          className="absolute left-4 flex items-center gap-1.5 text-gray-600 hover:text-teal-600 font-medium text-sm sm:text-base transition-colors"
        >
          <FaArrowLeft className="text-xs sm:text-sm" />
          <span>Back to Home</span>
        </Link>

        {/* Logo center */}
        <Link to="/seller-dashboard" className="flex flex-col items-center">
          <img src={logo} alt="BUYONIX Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
          <h1 className="font-bold text-base sm:text-lg text-gray-800 mt-0.5">BUYONIX</h1>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Mobile: show form first, then benefits below */}
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-8 items-start md:items-center">

          {/* Left: Info panel */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-3 sm:p-4 rounded-full flex-shrink-0">
                <FaStore className="text-2xl sm:text-4xl text-orange-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Seller Portal</h1>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-snug">
              Grow your business with Buyonix's AI-powered e-commerce platform
            </h2>

            <div className="bg-white rounded-xl p-5 shadow-md space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Why sell on Buyonix?
              </h3>

              {benefits.map((b) => (
                <div key={b.title} className="flex items-start space-x-3">
                  <div className="bg-teal-100 p-2 rounded-full mt-0.5 flex-shrink-0">
                    <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{b.title}</h4>
                    <p className="text-sm text-gray-500">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login / Signup form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-5">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 pb-3 text-center font-medium transition-colors text-sm sm:text-base ${
                  activeTab === "login"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="mr-1.5">🔓</span> Login
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 pb-3 text-center font-medium transition-colors text-sm sm:text-base ${
                  activeTab === "signup"
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="mr-1.5">📝</span> Sign Up
              </button>
            </div>

            {/* Welcome message */}
            <div className="mb-5">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                {activeTab === "signup" ? "Start Selling Today" : "Welcome Back"}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {activeTab === "signup"
                  ? "Create your seller account in just a few steps"
                  : "Log in to access your seller dashboard"}
              </p>
            </div>

            {activeTab === "login" ? <SellerLogin /> : <SellerSignup />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPortal;
