import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/profil', label: 'Profil', icon: '1' },
  { to: '/recherche', label: 'Recherche', icon: '2' },
  { to: '/analyse', label: 'Analyse', icon: '3' },
  { to: '/lettre', label: 'Lettre', icon: '4' },
  { to: '/suivi', label: 'Suivi', icon: '5' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/profil" className="flex items-center gap-2.5 shrink-0">
              <img src="/logo.svg" alt="AutoPostule" className="w-8 h-8" />
              <span className="text-xl font-bold text-blue-600 hidden sm:block">AutoPostule</span>
            </NavLink>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-xs flex items-center justify-center font-semibold">
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Navigation mobile */}
        <nav className="md:hidden border-t border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span className="w-4 h-4 rounded-full bg-gray-200 text-[10px] flex items-center justify-center font-semibold">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Contenu de la page */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
