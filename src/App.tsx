import React from 'react';
import { AirspaceProvider } from './context/AirspaceContext';
import { useAirspace } from './context/useAirspace';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { MonitorView } from './components/monitor/MonitorView';
import { EventConsole } from './components/events/EventConsole';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReportsView } from './components/reports/ReportsView';

const Dashboard: React.FC = () => {
  const { activeTab } = useAirspace();

  return (
    <div className="min-h-screen flex flex-col bg-surface-0 text-stone-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-4 py-5 md:px-6 md:py-6">
          {activeTab === 'overview' && <MonitorView />}
          {activeTab === 'events' && <EventConsole />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'reports' && <ReportsView />}
        </div>
      </main>
      <footer className="border-t border-border bg-white px-4 py-2.5 text-xs text-stone-500 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif italic font-medium text-stone-800">AEGIS AIR</span>
          <span className="text-stone-300">·</span>
          <span>Airspace Security Prototype</span>
        </div>
        <span className="hidden sm:block text-stone-400">Synthetic Defense Simulation · No connection to live operational radars</span>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AirspaceProvider>
      <Dashboard />
    </AirspaceProvider>
  );
}
