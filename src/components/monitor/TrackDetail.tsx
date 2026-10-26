import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { CountermeasureType, IFFStatus } from '../../types/telemetry';
import { Radio, Navigation, Gauge, Battery, Clock, Zap } from 'lucide-react';

export const TrackDetail: React.FC = () => {
  const { selectedTrack, triggerCountermeasure, updateIFF } = useAirspace();

  if (!selectedTrack) return null;

  const t = selectedTrack;

  const iffOptions: { value: IFFStatus; label: string; activeColor: string }[] = [
    { value: 'hostile', label: 'Hostile', activeColor: 'bg-red-600 text-white border-red-600' },
    { value: 'friendly', label: 'Friendly', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
    { value: 'unknown', label: 'Unknown', activeColor: 'bg-amber-600 text-white border-amber-600' },
    { value: 'neutral', label: 'Neutral', activeColor: 'bg-slate-600 text-white border-slate-600' },
  ];

  const countermeasures: { type: CountermeasureType; label: string; desc: string }[] = [
    { type: 'RF_JAM', label: 'RF Jamming', desc: 'Disrupt 2.4/5.8 GHz C2 link' },
    { type: 'GPS_SPOOF', label: 'GNSS Spoof', desc: 'Inject false waypoints' },
    { type: 'NET_CATCH', label: 'Interceptor Net', desc: 'Kinetic physical capture' },
    { type: 'KINETIC_EMP', label: 'High-Power EMP', desc: 'Directed microwave disrupt' },
  ];

  const isNeutralized = t.status === 'NEUTRALIZED' || t.status === 'LOST_TRACK';

  const fields = [
    { icon: <Navigation className="w-3.5 h-3.5 text-indigo-600" />, label: 'Heading', value: `${t.headingDeg}°` },
    { icon: <Gauge className="w-3.5 h-3.5 text-indigo-600" />, label: 'Speed', value: `${t.speedKmh} km/h` },
    { icon: <Radio className="w-3.5 h-3.5 text-indigo-600" />, label: 'RF Freq', value: `${t.rfFrequencyGhz} GHz` },
    { icon: <Zap className="w-3.5 h-3.5 text-amber-600" />, label: 'RSSI', value: `${t.rssiDbm} dBm` },
    { icon: <Battery className="w-3.5 h-3.5 text-emerald-600" />, label: 'Battery', value: `${t.batteryPercent}%` },
    { icon: <Clock className="w-3.5 h-3.5 text-rose-600" />, label: 'ETA Core', value: t.etaToPerimeterSeconds < 900 ? `${t.etaToPerimeterSeconds}s` : '—' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border bg-stone-50/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif italic text-lg text-stone-900 font-medium">{t.callsign}</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                {t.id}
              </span>
            </div>
            <p className="text-2xs text-stone-500 mt-0.5 font-sans">
              Classification: <strong className="font-semibold text-stone-700">{t.classification}</strong> · {t.protocol}
            </p>
          </div>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
            t.iff === 'hostile' ? 'bg-red-50 text-red-700 border-red-200' :
            t.iff === 'friendly' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            t.iff === 'unknown' ? 'bg-amber-50 text-amber-800 border-amber-200' :
            'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            {t.iff}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Telemetry grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {fields.map(f => (
            <div key={f.label} className="bg-stone-50 border border-stone-100 rounded-xl px-2.5 py-2">
              <div className="flex items-center gap-1 text-stone-500 mb-0.5">
                {f.icon}
                <span className="text-[10px] font-medium tracking-wide">{f.label}</span>
              </div>
              <div className="text-xs font-mono text-stone-900 font-semibold">{f.value}</div>
            </div>
          ))}
        </div>

        {/* Extra metadata */}
        <div className="bg-stone-50/70 border border-stone-100 rounded-xl px-3.5 py-2.5 text-xs space-y-1">
          <div className="flex justify-between text-stone-500">
            <span>Estimated Payload:</span>
            <span className="text-stone-800 font-medium">{t.payloadEstimate}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Ingress Sector:</span>
            <span className="text-stone-800 font-medium">{t.originSector}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Last Telemetry Sync:</span>
            <span className="text-stone-800 font-mono text-[11px]">{t.lastUpdated}</span>
          </div>
        </div>

        {/* IFF Override Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-2xs uppercase tracking-widest text-stone-400 font-semibold">IFF Classification Override</span>
          </div>
          <div className="flex gap-1.5">
            {iffOptions.map(o => {
              const active = t.iff === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => updateIFF(t.id, o.value)}
                  className={`flex-1 text-2xs py-1.5 rounded-xl border font-semibold transition-all ${
                    active
                      ? o.activeColor
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Countermeasures */}
        {!isNeutralized && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xs uppercase tracking-widest text-stone-400 font-semibold">C-UAS Defense Countermeasures</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {countermeasures.map(cm => {
                const active = t.activeCountermeasure === cm.type;
                return (
                  <button
                    key={cm.type}
                    onClick={() => triggerCountermeasure(t.id, cm.type)}
                    disabled={active}
                    className={`text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                      active
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs ring-1 ring-amber-300'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/30 shadow-xs'
                    }`}
                  >
                    <div className="font-semibold">{cm.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{cm.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isNeutralized && (
          <div className="text-center py-2.5 text-xs text-stone-500 bg-stone-100 rounded-xl font-medium">
            Contact status: {t.status.replace('_', ' ')} — neutralized
          </div>
        )}
      </div>
    </div>
  );
};
