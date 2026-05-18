import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrder: 0
  });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sellerData = localStorage.getItem('sellerInfo');
    if (sellerData) {
      const seller = JSON.parse(sellerData);
      setSellerInfo(seller);
      fetchStats(seller.id);
    } else {
      navigate('/become-seller');
    }
  }, [navigate]);

  const fetchStats = async (sellerId: string) => {
    try {
      setLoading(true);
      const productsResponse = await fetch(`${import.meta.env.VITE_API_URL}/product/seller/${sellerId}`, {
        credentials: 'include',
      });

      if (productsResponse.ok) {
        const productsResult = await productsResponse.json();
        if (productsResult.success) {
          setStats(prev => ({
            ...prev,
            totalProducts: productsResult.products.length
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-white shadow-lg fixed top-0 left-0 h-screen overflow-y-auto z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
            <img src={logo} alt="BUYONIX" className="h-10 w-10" />
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <div className="space-y-2">
            <Link
              to="/seller-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 bg-teal-600 text-white rounded-lg font-medium"
            >
              <span className="text-xl">📊</span>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/seller-products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">📦</span>
              <span>Products</span>
            </Link>

            <Link
              to="/seller-orders"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">📋</span>
              <span>Orders</span>
            </Link>

            <Link
              to="/seller-analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">📈</span>
              <span>Analytics</span>
            </Link>

            <Link
              to="/seller-payouts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">💰</span>
              <span>Payouts</span>
            </Link>

            <Link
              to="/seller-chats"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">💬</span>
              <span>Chats</span>
            </Link>

            <Link
              to="/seller-support"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">🎫</span>
              <span>Support</span>
            </Link>
          </div>
        </nav>

        {/* Logout and Back to Shopping */}
        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <button
            onClick={async () => {
              try {
                await fetch(`${import.meta.env.VITE_API_URL}/seller/logout`, {
                  method: 'POST',
                  credentials: 'include',
                });
              } catch (error) {
                console.error('Logout error:', error);
              }
              localStorage.removeItem('sellerInfo');
              localStorage.removeItem('sellerId');
              navigate('/become-seller');
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300"
          >
            <span>←</span>
            <span>Back to Shopping</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile Top Bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b shadow-sm sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-gray-800">Dashboard</span>
          <img src={logo} alt="BUYONIX" className="h-8 w-8" />
        </div>

        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Seller Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back{sellerInfo?.fullName ? `, ${sellerInfo.fullName}` : ''}! Here's your store overview.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</span>
                <span className="text-xl sm:text-2xl">💵</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">${stats.totalRevenue.toFixed(2)}</div>
              <div className="text-xs sm:text-sm text-gray-500">No sales yet</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</span>
                <span className="text-xl sm:text-2xl">📦</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{stats.totalOrders}</div>
              <div className="text-xs sm:text-sm text-gray-500">No orders yet</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Products Listed</span>
                <span className="text-xl sm:text-2xl">🏷️</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{stats.totalProducts}</div>
              <div className="text-xs sm:text-sm text-gray-500">
                {stats.totalProducts === 0 ? 'Start adding products' : 'Active products'}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Average Order</span>
                <span className="text-xl sm:text-2xl">📈</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">${stats.averageOrder.toFixed(2)}</div>
              <div className="text-xs sm:text-sm text-gray-500">No orders yet</div>
            </div>
          </div>

          {/* Quick Actions */}
          {stats.totalProducts === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-6 sm:mb-8 text-center">
              <div className="text-5xl sm:text-6xl mb-4">📦</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Get Started</h2>
              <p className="text-gray-600 mb-6">Add your first product to start selling on Buyonix!</p>
              <Link
                to="/seller-products"
                className="inline-flex items-center space-x-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                <span>+</span>
                <span>Add Your First Product</span>
              </Link>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Recent Orders</h2>
            <div className="text-center py-8 sm:py-12">
              <div className="text-5xl sm:text-6xl mb-4">📋</div>
              <p className="text-gray-600">No orders yet. Your orders will appear here once customers start purchasing your products.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
