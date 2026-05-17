import { FaSearch, FaShoppingCart, FaUser, FaStore, FaSignOutAlt, FaComments, FaBars, FaTimes } from "react-icons/fa";
import { BsCamera } from "react-icons/bs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useContext } from "react";
import logo from "../assets/logo.png";
import { checkAuthStatus } from "../utils/auth.js";
import { CartContext } from "../context/CartContextType";
import VisualSearch from "./VisualSearch";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{ displayName?: string; email?: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const cartContext = useContext(CartContext);
  const [showVisualSearch, setShowVisualSearch] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setShowDropdown(false);
    setMobileMenuOpen(false);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userInfo');
    window.dispatchEvent(new Event('authStatusChanged'));
    window.location.href = '/';
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const localLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const userInfoStr = localStorage.getItem("userInfo");

      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          setUserData(userInfo);
        } catch (error) {
          console.error('Error parsing user info:', error);
        }
      }

      try {
        const googleAuthData = await checkAuthStatus();
        const googleLoggedIn = googleAuthData && googleAuthData.success;

        if (googleLoggedIn && googleAuthData.user) {
          setUserData(googleAuthData.user);
          localStorage.setItem('userInfo', JSON.stringify(googleAuthData.user));
        }

        const isAuthenticated = localLoggedIn || googleLoggedIn;
        setIsLoggedIn(isAuthenticated);

        if (googleLoggedIn && !localLoggedIn) {
          localStorage.setItem('isLoggedIn', 'true');
        }
      } catch {
        setIsLoggedIn(localLoggedIn);
      }
    };

    checkLoginStatus();

    const handleVisibilityChange = () => {
      if (!document.hidden) checkLoginStatus();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isLoggedIn") checkLoginStatus();
    };

    window.addEventListener("storage", handleStorageChange);

    const handleAuthChange = () => checkLoginStatus();
    window.addEventListener("authStatusChanged", handleAuthChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStatusChanged", handleAuthChange);
    };
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    navigate(q.length > 0 ? `/shop?query=${encodeURIComponent(q)}` : '/shop');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/categories', label: 'Categories' },
    { to: '/deals', label: 'Deals' },
    { to: '/about', label: 'About' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white shadow-sm border-b border-gray-200 z-40">
      {/* ── Main bar ── */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3">

        {/* Logo */}
        <Link to="/" className="flex flex-col items-center flex-shrink-0">
          <img src={logo} alt="BUYONIX Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
          <h1 className="font-bold text-xs sm:text-sm text-gray-800">BUYONIX</h1>
        </Link>

        {/* Mobile-only: center search bar with visual search */}
        <div className="flex md:hidden flex-1 items-center border border-gray-200 rounded-full px-3 py-1.5 bg-gray-50 min-w-0 gap-1">
          <FaSearch className="text-gray-400 flex-shrink-0 text-sm" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={() => setShowVisualSearch(true)}
            className="flex-shrink-0 p-1 hover:bg-teal-50 rounded-full transition-colors"
            aria-label="Visual Search"
            title="Search by image"
          >
            <BsCamera className="text-teal-600 text-base" />
          </button>
        </div>

        {/* Desktop: Nav links */}
        <ul className="hidden md:flex space-x-6 lg:space-x-8 text-gray-700 font-medium ml-6">
          {navLinks.map(({ to, label }) => (
            <li key={to} className={`cursor-pointer ${location.pathname === to ? 'text-teal-600 font-semibold' : 'hover:text-teal-600'}`}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>

        {/* Desktop: Search bar */}
        <div className="hidden md:flex items-center border rounded-full px-4 py-2 w-56 lg:w-80 bg-gray-50">
          <FaSearch className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="ml-2 w-full bg-transparent outline-none text-sm text-gray-700"
          />
          <button aria-label="Search" onClick={handleSearch} className="ml-1">
            <FaSearch className="text-gray-400" />
          </button>
          <button
            onClick={() => setShowVisualSearch(true)}
            className="ml-1 p-1 hover:bg-teal-50 rounded-full transition-colors"
            aria-label="Visual Search"
            title="Search by image"
          >
            <BsCamera className="text-teal-600 text-lg" />
          </button>
        </div>

        {/* Desktop: Right buttons */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          <Link
            to="/become-seller"
            className="flex items-center border border-orange-500 text-orange-500 px-3 lg:px-4 py-1.5 rounded-md hover:bg-orange-50 text-sm lg:text-base"
          >
            <FaStore className="mr-1.5" />
            <span className="hidden lg:inline">Become a Seller</span>
            <span className="lg:hidden">Sell</span>
          </Link>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <div
                className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FaUser />
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    {userData && (
                      <>
                        <p className="font-semibold text-gray-800">{userData.displayName || 'User'}</p>
                        <p className="text-sm text-gray-600">{userData.email}</p>
                      </>
                    )}
                  </div>
                  <div className="p-2">
                    <Link to="/profile" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">👤 My Profile</Link>
                    <Link to="/orders" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">📦 My Orders</Link>
                    <Link to="/wishlist" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">❤️ My Wishlist</Link>
                    <Link to="/chats" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">💬 My Chats</Link>
                    <div className="border-t border-gray-200 my-2" />
                    <Link to="/settings" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">⚙️ Settings</Link>
                    <Link to="/support" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">🎧 Customer Support</Link>
                    <Link to="/faqs" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">❓ FAQs</Link>
                    <div className="border-t border-gray-200 my-2" />
                    <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium">
                      <FaSignOutAlt className="mr-2" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/signin" className="flex items-center bg-teal-600 text-white px-4 lg:px-6 py-2 rounded-md hover:bg-teal-700 text-sm lg:text-base">
              <FaUser className="mr-2" />
              Sign In
            </Link>
          )}

          {isLoggedIn && (
            <Link to="/chats" className="text-gray-700 hover:text-teal-600 transition-colors">
              <FaComments className="text-xl" />
            </Link>
          )}

          <button
            onClick={() => cartContext?.setIsCartOpen(true)}
            className="relative text-gray-700 hover:text-teal-600 transition-colors"
            aria-label="Shopping cart"
          >
            <FaShoppingCart className="text-2xl" />
            {cartContext && cartContext.cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartContext.cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile: Cart + Hamburger */}
        <div className="flex md:hidden items-center space-x-3">
          <button
            onClick={() => cartContext?.setIsCartOpen(true)}
            className="relative text-gray-700 hover:text-teal-600 transition-colors"
            aria-label="Shopping cart"
          >
            <FaShoppingCart className="text-xl" />
            {cartContext && cartContext.cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartContext.cartItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-700 hover:text-teal-600 p-1"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* ── Mobile slide-down menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg max-h-[85vh] overflow-y-auto">

          {/* Mobile search */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center border rounded-full px-4 py-2 bg-gray-50">
              <FaSearch className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="ml-2 w-full bg-transparent outline-none text-sm text-gray-700"
              />
              <button
                onClick={() => setShowVisualSearch(true)}
                className="ml-2 p-1 hover:bg-teal-50 rounded-full transition-colors"
                aria-label="Visual Search"
              >
                <BsCamera className="text-teal-600 text-lg" />
              </button>
            </div>
          </div>

          {/* Mobile nav links */}
          <div className="px-4 py-2 border-b border-gray-100">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  location.pathname === to
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile action buttons */}
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/become-seller"
              className="flex items-center justify-center w-full border border-orange-500 text-orange-500 px-4 py-3 rounded-md hover:bg-orange-50 font-medium text-base"
            >
              <FaStore className="mr-2" />
              Become a Seller
            </Link>

            {isLoggedIn ? (
              <div className="space-y-1 pt-1">
                {userData && (
                  <div className="px-3 py-2.5 bg-gray-50 rounded-md mb-2">
                    <p className="font-semibold text-gray-800 text-sm">{userData.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500">{userData.email}</p>
                  </div>
                )}
                <Link to="/profile" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">👤 My Profile</Link>
                <Link to="/orders" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">📦 My Orders</Link>
                <Link to="/wishlist" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">❤️ My Wishlist</Link>
                <Link to="/chats" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">💬 My Chats</Link>
                <Link to="/settings" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">⚙️ Settings</Link>
                <Link to="/support" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">🎧 Customer Support</Link>
                <Link to="/faqs" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">❓ FAQs</Link>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md font-medium"
                >
                  <FaSignOutAlt className="mr-2" /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                className="flex items-center justify-center w-full bg-teal-600 text-white px-4 py-3 rounded-md hover:bg-teal-700 font-medium text-base"
              >
                <FaUser className="mr-2" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Visual Search Modal */}
      <VisualSearch isOpen={showVisualSearch} onClose={() => setShowVisualSearch(false)} />
    </nav>
  );
};

export default Navbar;
