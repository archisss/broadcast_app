import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { AdminLayout, AdminTab } from './components/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NewBirthPage } from './pages/NewBirthPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { TVPage } from './pages/TVPage';
import { BroadcastSpacesPage } from './pages/BroadcastSpacesPage';
import { DoctorsManagementPage } from './pages/DoctorsManagementPage';
import { StaffPortalPage } from './pages/StaffPortalPage';
import { TVDisplay } from './components/TVDisplay';
import { Tv, SplitSquareVertical, ExternalLink } from 'lucide-react';

type ViewMode = 'admin' | 'tv' | 'split';

function MainRouter() {
  const { user } = useAuth();
  const { activeAnnouncement, activeList, connectionState, currentSpacePath, setCurrentSpacePath } = useRealtime();

  // Detect initial route based on URL path or hash
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (
      path === '/tv' ||
      hash === '#tv' ||
      hash.startsWith('#space=') ||
      (path.length > 1 && !path.startsWith('/admin') && !path.startsWith('/api') && !path.includes('.'))
    ) {
      return 'tv';
    }
    return 'admin';
  });

  const [activeSpacePath, setActiveSpacePath] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (hash.startsWith('#space=')) {
      return decodeURIComponent(hash.slice(7));
    }
    if (path.length > 1 && !path.startsWith('/admin') && !path.startsWith('/api') && !path.includes('.')) {
      return path;
    }
    return '/tv';
  });

  const [adminTab, setAdminTab] = useState<AdminTab>(() => {
    const hash = window.location.hash;
    if (hash === '#admin/new') return 'new';
    if (hash === '#admin/history') return 'history';
    if (hash === '#admin/audit') return 'audit';
    if (hash === '#admin/spaces') return 'spaces';
    if (hash === '#admin/doctors') return 'doctors';
    return 'dashboard';
  });

  // Sync URL hash with state for browser history and deep linking
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (
        path === '/tv' ||
        hash === '#tv' ||
        hash.startsWith('#space=') ||
        (path.length > 1 && !path.startsWith('/admin') && !path.startsWith('/api') && !path.includes('.'))
      ) {
        if (hash.startsWith('#space=')) {
          setActiveSpacePath(decodeURIComponent(hash.slice(7)));
        } else if (path.length > 1 && !path.startsWith('/admin') && !path.startsWith('/api')) {
          setActiveSpacePath(path);
        }
        setViewMode('tv');
      } else {
        setViewMode('admin');
        if (hash === '#admin/new') setAdminTab('new');
        else if (hash === '#admin/history') setAdminTab('history');
        else if (hash === '#admin/audit') setAdminTab('audit');
        else if (hash === '#admin/spaces') setAdminTab('spaces');
        else if (hash === '#admin/doctors') setAdminTab('doctors');
        else setAdminTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToTab = (tab: AdminTab) => {
    setAdminTab(tab);
    setViewMode('admin');
    window.history.pushState(null, '', tab === 'dashboard' ? '#admin' : `#admin/${tab}`);
  };

  const navigateToTv = (targetSpace?: string) => {
    const sp = targetSpace || currentSpacePath || '/tv';
    setActiveSpacePath(sp);
    setCurrentSpacePath(sp);
    setViewMode('tv');
    window.history.pushState(null, '', sp === '/tv' ? '#tv' : `#space=${encodeURIComponent(sp)}`);
  };

  const openTvInNewTab = (targetSpace?: string) => {
    const sp = targetSpace || currentSpacePath || '/tv';
    const tvUrl = sp === '/tv' ? `${window.location.origin}/#tv` : `${window.location.origin}/#space=${encodeURIComponent(sp)}`;
    window.open(tvUrl, '_blank', 'noopener,noreferrer');
  };

  // 1. PURE TV MODE
  if (viewMode === 'tv') {
    return (
      <div className="relative w-screen h-screen">
        {/* Quick simulator switcher banner (subtle, floats at top on hover) */}
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 opacity-0 hover:opacity-100 transition-opacity bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-3">
          <span className="text-slate-400">Pantalla: {activeSpacePath}</span>
          <button
            onClick={() => {
              setViewMode('admin');
              window.history.pushState(null, '', '#admin');
            }}
            className="text-sky-400 hover:text-white font-semibold underline cursor-pointer"
          >
            Ir al Panel Principal
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setViewMode('split')}
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            Vista Dividida (Panel + TV)
          </button>
        </div>

        <TVPage
          targetSpacePath={activeSpacePath}
          onBackToAdmin={() => setViewMode('admin')}
        />
      </div>
    );
  }

  // 2. REQUIRE LOGIN FOR ADMIN (Unless logged in)
  if (!user) {
    return (
      <LoginPage
        onSuccess={() => setAdminTab('dashboard')}
        onOpenTv={() => navigateToTv('/tv')}
      />
    );
  }

  // 3. SPLIT SIMULATION VIEW (Simultaneously test Panel and Live TV Screen side-by-side)
  if (viewMode === 'split') {
    return (
      <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
        {/* Switcher Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-white z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-400">Broadcast Hospitalario</span>
            <span className="text-slate-400">• Vista Dual (Panel + Pantalla en Vivo)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('admin')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 cursor-pointer"
            >
              Solo Panel
            </button>
            <button
              onClick={() => setViewMode('tv')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 cursor-pointer"
            >
              Solo TV ({currentSpacePath})
            </button>
            <button
              onClick={() => openTvInNewTab(currentSpacePath)}
              className="px-3 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Abrir TV en nueva pestaña</span>
            </button>
          </div>
        </div>

        {/* Two Panes */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          {/* Left Pane: Admin Panel or Staff Portal */}
          <div className="border-r border-slate-800 overflow-y-auto bg-slate-50">
            {user.role === 'doctor' || user.role === 'nurse' ? (
              <StaffPortalPage
                onOpenTv={(sp) => {
                  const target = sp || user.assigned_space_path || currentSpacePath;
                  setActiveSpacePath(target);
                  setCurrentSpacePath(target);
                }}
              />
            ) : (
              <AdminLayout
                activeTab={adminTab}
                onNavigate={navigateToTab}
                onOpenTv={() => navigateToTv(currentSpacePath)}
              >
                {adminTab === 'dashboard' && (
                  <AdminDashboardPage
                    onNewBirth={() => setAdminTab('new')}
                    onOpenTv={() => navigateToTv(currentSpacePath)}
                    onViewHistory={() => setAdminTab('history')}
                    onNavigateToSpaces={() => setAdminTab('spaces')}
                    onNavigateToDoctors={() => setAdminTab('doctors')}
                  />
                )}
                {adminTab === 'new' && (
                  <NewBirthPage
                    onBack={() => setAdminTab('dashboard')}
                    onViewTv={() => navigateToTv(currentSpacePath)}
                  />
                )}
                {adminTab === 'history' && <HistoryPage />}
                {adminTab === 'audit' && <HistoryPage />}
                {adminTab === 'spaces' && (
                  <BroadcastSpacesPage onOpenSpaceTv={(sp) => navigateToTv(sp)} />
                )}
                {adminTab === 'doctors' && <DoctorsManagementPage />}
              </AdminLayout>
            )}
          </div>

          {/* Right Pane: Live TV Display */}
          <div className="relative bg-black flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-3 left-3 z-30 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[11px] font-mono text-sky-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Simulación: {user.assigned_space_path || currentSpacePath}</span>
            </div>
            <TVDisplay
              announcement={activeAnnouncement}
              activeList={activeList}
              spacePath={user.assigned_space_path || currentSpacePath}
              connectionState={connectionState}
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. REDUCED PANEL FOR DOCTOR AND NURSE
  if (user.role === 'doctor' || user.role === 'nurse') {
    const doctorSpace = user.assigned_space_path || currentSpacePath;
    return (
      <div className="relative min-h-screen">
        {/* Floating TV & Split preview helpers */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 p-1.5 bg-slate-900/90 text-white rounded-2xl border border-slate-700 shadow-xl backdrop-blur-md text-xs">
          <button
            onClick={() => setViewMode('split')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-800/60 hover:bg-sky-700 rounded-xl text-sky-200 transition-colors cursor-pointer"
            title="Ver Panel y TV lado a lado"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-sky-400" />
            <span>Vista Dual</span>
          </button>

          <button
            onClick={() => navigateToTv(doctorSpace)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors cursor-pointer"
            title="Ver pantalla completa de TV"
          >
            <Tv className="w-3.5 h-3.5 text-sky-400" />
            <span>Ver Pantalla ({doctorSpace})</span>
          </button>
        </div>

        <StaffPortalPage onOpenTv={(sp) => navigateToTv(sp || doctorSpace)} />
      </div>
    );
  }

  // 5. STANDARD ADMINISTRATIVE INTERFACE (Superadmin & Admin)
  return (
    <div className="relative min-h-screen">
      {/* Test Assistant Banner (Floating pill) */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 p-1.5 bg-slate-900/90 text-white rounded-2xl border border-slate-700 shadow-xl backdrop-blur-md text-xs">
        <button
          onClick={() => setViewMode('split')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-800/60 hover:bg-sky-700 rounded-xl text-sky-200 transition-colors cursor-pointer"
          title="Ver Panel y TV lado a lado para comprobar la emisión en tiempo real"
        >
          <SplitSquareVertical className="w-3.5 h-3.5 text-sky-400" />
          <span>Vista Dual</span>
        </button>

        <button
          onClick={() => navigateToTv(currentSpacePath)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors cursor-pointer"
          title="Ver pantalla completa de TV"
        >
          <Tv className="w-3.5 h-3.5 text-sky-400" />
          <span>Modo TV ({currentSpacePath})</span>
        </button>
      </div>

      <AdminLayout
        activeTab={adminTab}
        onNavigate={navigateToTab}
        onOpenTv={() => navigateToTv(currentSpacePath)}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboardPage
            onNewBirth={() => setAdminTab('new')}
            onOpenTv={() => navigateToTv(currentSpacePath)}
            onViewHistory={() => setAdminTab('history')}
            onNavigateToSpaces={() => setAdminTab('spaces')}
            onNavigateToDoctors={() => setAdminTab('doctors')}
          />
        )}
        {adminTab === 'new' && (
          <NewBirthPage
            onBack={() => setAdminTab('dashboard')}
            onViewTv={() => navigateToTv(currentSpacePath)}
          />
        )}
        {adminTab === 'history' && <HistoryPage />}
        {adminTab === 'audit' && <HistoryPage />}
        {adminTab === 'spaces' && (
          <BroadcastSpacesPage onOpenSpaceTv={(sp) => navigateToTv(sp)} />
        )}
        {adminTab === 'doctors' && <DoctorsManagementPage />}
      </AdminLayout>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainRouter />
      </RealtimeProvider>
    </AuthProvider>
  );
}
