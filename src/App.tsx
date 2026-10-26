import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AirspaceProvider } from './context/AirspaceContext';
import { useAirspace } from './context/useAirspace';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { MonitorView } from './components/monitor/MonitorView';
import { EventConsole } from './components/events/EventConsole';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReportsView } from './components/reports/ReportsView';
import { ScenarioStressLab } from './components/stress-lab/ScenarioStressLab';
import { AuthScreen } from './components/auth/AuthScreen';

const DashboardProtected: React.FC = () => {
  const { activeTab } = useAirspace();

  return (
    <div className="min-h-screen flex flex-col bg-surface-0 dot-grid text-pitch-black selection:bg-creator-pink selection:text-pitch-black">
      <Header />
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1680px] mx-auto px-3.5 py-4 sm:px-6 sm:py-6">
          {activeTab === 'overview' && <MonitorView />}
          {activeTab === 'events' && <EventConsole />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'stress-lab' && <ScenarioStressLab />}
        </div>
      </main>
      <footer className="border-t border-pitch-black bg-white px-4 sm:px-8 py-3 text-xs text-pitch-black flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-[0_-1px_0px_#0D0D0D]">
        <div className="flex items-center gap-2">
          <span className="font-display font-extrabold text-sm tracking-tight text-pitch-black">AEGIS AIR</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
            v2.6 PROTO
          </span>
          <span className="text-pitch-black/30">·</span>
          <span className="font-medium text-ink-700">Counter-Drone Radar & Airspace Telemetry</span>
        </div>
        <div className="flex items-center gap-2 text-2xs sm:text-xs font-mono font-semibold text-ink-500">
          <span className="w-2 h-2 rounded-full bg-lime-glow animate-pulse"></span>
          <span>DETERMINISTIC KINEMATICS ENGINE</span>
          <span className="text-pitch-black/30">|</span>
          <span>OPEN-METEO SYNCED</span>
        </div>
      </footer>
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-0 dot-grid text-pitch-black selection:bg-creator-pink">
        <div className="pop-card bg-white border border-pitch-black p-6 rounded-2xl shadow-[3px_3px_0px_#0D0D0D] flex items-center gap-3">
          <span className="w-5 h-5 rounded-full border-2 border-pitch-black border-t-creator-pink animate-spin" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-pitch-black">
            Verifying Supabase Security Session...
          </span>
        </div>
      </div>
    );
  }
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AirspaceProvider>
      <DashboardProtected />
    </AirspaceProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
