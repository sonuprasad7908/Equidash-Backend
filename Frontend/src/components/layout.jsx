import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Newspaper, LogOut, TrendingUp } from 'lucide-react';

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
    { path: '/news', icon: Newspaper, label: 'News Feed' }
  ];

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0b1120] border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold">
            Stock<span className="text-blue-500">Edge</span>
          </h2>
        </div>

        {/* Balance Card */}
        <div className="mx-6 mb-6 p-4 bg-gray-800 rounded-xl text-center">
          <p className="text-xs text-gray-400 uppercase">Virtual Balance</p>
          <h2 className="text-2xl font-bold text-cyan-400 mt-2" data-testid="user-balance">
            ₹{user?.balance?.toLocaleString('en-IN') || '10,00,000'}
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-500 bg-opacity-10 text-blue-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-gray-800 rounded-lg transition"
            data-testid="logout-btn"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default Layout;