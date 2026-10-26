import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAirspace } from '../../context/useAirspace';
import type { GeographicArea } from '../../types/provenance';
import { SAFE_DEMO_AREAS } from '../../utils/geoAreas';
import { fetchLiveIpLocation, searchLocationLive } from '../../services/locationService';
import { AlertTriangle, MapPin, Compass, Plus, Search, Satellite } from 'lucide-react';

interface GeoAirspaceMapProps {
  currentArea: GeographicArea;
  onAreaChange: (area: GeographicArea) => void;
}

const iffColor = (iff: string): string => {
  switch (iff) {
    case 'hostile': return '#DC2626';
    case 'friendly': return '#059669';
    case 'neutral': return '#64748B';
    default: return '#D97706';
  }
};

// Coordinate projection helper: converts relative km offsets to real WGS84 Lat/Lng
const kmToLatLng = (xKm: number, yKm: number, centerLat: number, centerLng: number) => {
  const lat = centerLat + (yKm / 110.574);
  const lng = centerLng + (xKm / (111.320 * Math.cos((centerLat * Math.PI) / 180)));
  return { lat, lng };
};

export const GeoAirspaceMap: React.FC<GeoAirspaceMapProps> = ({ currentArea, onAreaChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const { tracks, selectedTrackId, selectTrack, injectThreat } = useAirspace();

  const [tileProvider, setTileProvider] = useState<'osm' | 'esri'>('osm');
  const [tileError, setTileError] = useState<boolean>(false);
  const [geoLocating, setGeoLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

  const handleSearchSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setGeoLocating(true);
    setGeoError(null);

    try {
      const matched = await searchLocationLive(searchQuery);
      if (matched) {
        onAreaChange(matched);
        setSearchQuery('');
        setIsSearchActive(false);
        setGeoError(null);
      } else {
        setGeoError(`Unable to resolve location for "${searchQuery}". Try a major city or format 'lat, lng' (e.g. 17.38, 78.48).`);
      }
    } catch {
      setGeoError(`Search failed for "${searchQuery}".`);
    } finally {
      setGeoLocating(false);
    }
  }, [searchQuery, onAreaChange]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentArea.lat, currentArea.lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: true
      });

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layer if switching
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = tileProvider === 'esri'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = tileProvider === 'esri'
      ? 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
      : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 18,
      attribution
    });

    tiles.on('tileerror', () => {
      setTileError(true);
    });

    tiles.on('load', () => {
      setTileError(false);
    });

    tiles.addTo(map);
    tileLayerRef.current = tiles;

    return () => {
      // Map cleanup on complete component unmount
    };
  }, [tileProvider, currentArea.lat, currentArea.lng]);

  // 2. Resize observer to keep map dimensions synced with container height
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // 3. Pan when center area changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentArea.lat, currentArea.lng], 12, { animate: true });
    }
  }, [currentArea.lat, currentArea.lng]);

  // 3. Render Synthetic Overlays & Zones on Leaflet Map
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup || !mapInstanceRef.current) return;

    layerGroup.clearLayers();

    // A. Render Simulated Restricted Zones
    // Core Protected Zone (2.5 km radius)
    const coreCircle = L.circle([currentArea.lat, currentArea.lng], {
      radius: 2500,
      color: '#4F46E5',
      weight: 1.5,
      dashArray: '5, 5',
      fillColor: '#4F46E5',
      fillOpacity: 0.08
    });
    coreCircle.bindTooltip('Simulated Protected Core Zone (2.5 km)', { permanent: false });
    layerGroup.addLayer(coreCircle);

    // Sector Alpha Zone (-4 km X, 3 km Y)
    const alphaCoord = kmToLatLng(-4, 3, currentArea.lat, currentArea.lng);
    const alphaCircle = L.circle([alphaCoord.lat, alphaCoord.lng], {
      radius: 1200,
      color: '#DC2626',
      weight: 1.2,
      dashArray: '4, 4',
      fillColor: '#DC2626',
      fillOpacity: 0.06
    });
    alphaCircle.bindTooltip('Simulated Sector Alpha Restricted Zone', { permanent: false });
    layerGroup.addLayer(alphaCircle);

    // Sector Bravo Zone (5 km X, -2 km Y)
    const bravoCoord = kmToLatLng(5, -2, currentArea.lat, currentArea.lng);
    const bravoCircle = L.circle([bravoCoord.lat, bravoCoord.lng], {
      radius: 1500,
      color: '#D97706',
      weight: 1.2,
      dashArray: '4, 4',
      fillColor: '#D97706',
      fillOpacity: 0.06
    });
    bravoCircle.bindTooltip('Simulated Sector Bravo Buffer Zone', { permanent: false });
    layerGroup.addLayer(bravoCircle);

    // B. Render Synthetic Drone Tracks
    tracks.forEach(track => {
      const { lat, lng } = kmToLatLng(track.x, track.y, currentArea.lat, currentArea.lng);
      const isSelected = track.id === selectedTrackId;
      const color = iffColor(track.iff);

      // Track History Polyline
      if (track.history.length > 1) {
        const historyLatLngs = track.history.map(pt => {
          const c = kmToLatLng(pt.x, pt.y, currentArea.lat, currentArea.lng);
          return [c.lat, c.lng] as [number, number];
        });
        const historyLine = L.polyline(historyLatLngs, {
          color,
          weight: 1.5,
          opacity: 0.45,
          dashArray: '2, 4'
        });
        layerGroup.addLayer(historyLine);
      }

      // Predicted Future Path (10s projection)
      if (track.status === 'ACTIVE' && track.speedKmh > 10) {
        const predictSec = 10;
        const dKm = (track.speedKmh / 3600) * predictSec;
        const headRad = (track.headingDeg * Math.PI) / 180;
        const futX = track.x + Math.sin(headRad) * dKm;
        const futY = track.y + Math.cos(headRad) * dKm;
        const futCoord = kmToLatLng(futX, futY, currentArea.lat, currentArea.lng);

        const predictLine = L.polyline([[lat, lng], [futCoord.lat, futCoord.lng]], {
          color,
          weight: 1.5,
          opacity: 0.65,
          dashArray: '4, 4'
        });
        layerGroup.addLayer(predictLine);
      }

      // Custom SVG Marker Icon
      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
        ">
          <div style="
            width: ${isSelected ? 20 : 16}px;
            height: ${isSelected ? 20 : 16}px;
            background: ${color};
            transform: rotate(45deg);
            border: 2px solid #FFFFFF;
            box-shadow: 0 1px 4px rgba(0,0,0,0.35);
            ${isSelected ? 'outline: 3px solid #4F46E5; outline-offset: 2px;' : ''}
          "></div>
          <span style="
            position: absolute;
            top: -18px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            background: rgba(15, 23, 42, 0.85);
            color: #FFFFFF;
            font-size: 9px;
            font-family: monospace;
            padding: 1px 4px;
            border-radius: 4px;
            font-weight: 600;
          ">
            ${track.callsign} <span style="color: #94A3B8;">[SIM]</span>
          </span>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'vayunet-geo-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], { icon });

      // Marker Popup with Detailed Provenance
      const popupContent = `
        <div style="font-family: serif; min-width: 180px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 4px;">
            <strong style="font-size: 14px; color: #0F172A;">${track.callsign}</strong>
            <span style="font-size: 9px; font-weight: bold; background: #EEF2FF; color: #4338CA; padding: 1px 4px; border-radius: 4px; border: 1px solid #C7D2FE;">SIMULATED</span>
          </div>
          <div style="font-family: monospace; font-size: 11px; color: #475569; line-height: 1.5;">
            <div>ID: ${track.id} (${track.classification})</div>
            <div>IFF: <strong style="color: ${color}; text-transform: uppercase;">${track.iff}</strong></div>
            <div>Speed: ${track.speedKmh} km/h · Alt: ${track.altitudeMeters}m</div>
            <div>Heading: ${track.headingDeg}° · Status: ${track.status}</div>
            <div style="margin-top: 4px; color: #64748B;">Geo: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        selectTrack(track.id);
      });

      layerGroup.addLayer(marker);
    });

  }, [tracks, selectedTrackId, currentArea.lat, currentArea.lng, selectTrack]);

  // Request live location on demand via Live Geolocation API with browser GPS fallback
  const handleUseMyLocation = useCallback(async () => {
    setGeoLocating(true);
    setGeoError(null);

    // 1. Try Live IP Geolocation API first for instant, accurate coordinates
    try {
      const liveLoc = await fetchLiveIpLocation();
      setGeoLocating(false);
      onAreaChange(liveLoc);
      return;
    } catch {
      // Secondary fallback to browser GPS
    }

    if (!navigator.geolocation) {
      setGeoLocating(false);
      setGeoError('Live Geolocation API and browser GPS unreachable.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const userArea: GeographicArea = {
          id: 'USER-LOC',
          name: 'My Current Location (Browser Coordinates)',
          category: 'CUSTOM',
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
          description: 'Live coordinates acquired for tactical airspace vectoring.',
          radiusKm: 10
        };
        onAreaChange(userArea);
      },
      (err) => {
        setGeoLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Retaining active demonstration test area.');
        } else {
          setGeoError(`Unable to retrieve live location (${err.message}).`);
        }
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, [onAreaChange]);

  return (
    <div className="pop-card rounded-2xl bg-white border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden flex flex-col h-full">
      {/* Real Map Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-pitch-black bg-surface-0 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg text-pitch-black tracking-tight">Geospatial Airspace Overlay</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
              SYNTHETIC_OVERLAY
            </span>
          </div>
          <p className="text-2xs text-ink-500 font-mono mt-0.5">
            Projection: OpenStreetMap WGS84 · ±10 km tactical surveillance corridor
          </p>
        </div>

        {/* Controls: Area Selector + Use My Location + Tile Provider */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Area Selector & Search Toggle */}
          <div className="flex items-center gap-1">
            {isSearchActive ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City, country or 'lat, lng'..."
                  autoFocus
                  className="text-xs bg-white border border-pitch-black rounded-full px-3 py-1 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none font-mono w-48"
                />
                <button
                  type="submit"
                  disabled={geoLocating}
                  className="btn-pop px-3 py-1 bg-creator-pink text-pitch-black border border-pitch-black rounded-full text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_#0D0D0D] disabled:opacity-50"
                >
                  {geoLocating ? '...' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSearchActive(false); setSearchQuery(''); }}
                  className="px-2 py-1 text-pitch-black hover:text-red-500 text-xs font-bold font-mono"
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <select
                  value={currentArea.id}
                  onChange={(e) => {
                    const found = SAFE_DEMO_AREAS.find(a => a.id === e.target.value);
                    if (found) onAreaChange(found);
                  }}
                  className="text-xs bg-white border border-pitch-black rounded-full px-3 py-1.5 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none font-display font-bold"
                >
                  {SAFE_DEMO_AREAS.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                  {currentArea.id.startsWith('COORD-') && (
                    <option value={currentArea.id}>{currentArea.name}</option>
                  )}
                  {currentArea.id.startsWith('GEO-') && (
                    <option value={currentArea.id}>{currentArea.name}</option>
                  )}
                  {(currentArea.id === 'USER-LOC' || currentArea.id === 'LIVE-LOC-API') && (
                    <option value={currentArea.id}>{currentArea.name}</option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setIsSearchActive(true)}
                  className="btn-pop p-1.5 rounded-full border border-pitch-black bg-white hover:bg-creator-pink text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] transition-colors"
                  title="Search any location via Live Nominatim API or enter custom 'lat, lng'"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Live Location API Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={geoLocating}
            className="btn-pop flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-lime-glow text-pitch-black border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all disabled:opacity-50"
            title="Acquire live coordinates using Geolocation API (IP/GPS)"
          >
            <Satellite className={`w-3.5 h-3.5 text-pitch-black ${geoLocating ? 'animate-spin' : ''}`} />
            <span>{geoLocating ? 'Acquiring...' : 'Live Location API'}</span>
          </button>

          {/* Tile Provider Toggle */}
          <div className="flex items-center rounded-full border border-pitch-black bg-white p-0.5 shadow-[1.5px_1.5px_0px_#0D0D0D]">
            <button
              onClick={() => setTileProvider('osm')}
              className={`px-3 py-1 rounded-full text-2xs font-mono font-bold transition-all ${
                tileProvider === 'osm'
                  ? 'bg-pitch-black text-white shadow-xs'
                  : 'text-pitch-black hover:bg-surface-2'
              }`}
            >
              OSM Standard
            </button>
            <button
              onClick={() => setTileProvider('esri')}
              className={`px-3 py-1 rounded-full text-2xs font-mono font-bold transition-all ${
                tileProvider === 'esri'
                  ? 'bg-pitch-black text-white shadow-xs'
                  : 'text-pitch-black hover:bg-surface-2'
              }`}
            >
              Tactical Gray
            </button>
          </div>

          {/* Scenario Injection Group */}
          <div className="flex items-center gap-1.5 border-l border-pitch-black/20 pl-2">
            <button
              onClick={() => injectThreat('SWARM')}
              className="btn-pop flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-creator-pink/30 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] text-pitch-black transition-all"
              title="Inject simulated swarm scenario"
            >
              <Plus className="w-3 h-3 text-pitch-black" />
              <span>Swarm</span>
            </button>
            <button
              onClick={() => injectThreat('DEGRADATION')}
              className="btn-pop flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-sunshine-yellow/40 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] text-pitch-black transition-all"
              title="Inject synthetic RF degradation scenario"
            >
              <Plus className="w-3 h-3 text-pitch-black" />
              <span>Degradation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Geolocation Denied / Error Notification */}
      {geoError && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>{geoError}</span>
          </div>
          <button onClick={() => setGeoError(null)} className="text-stone-400 hover:text-stone-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Map Tile Offline Warning */}
      {tileError && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
          <span>Map Tiles Offline — Network unreachable. Synthetic track geometry and vector calculations remain active.</span>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="relative w-full z-0 flex-1 min-h-[440px]"
      />

      {/* Map Footer Bar with Academic Provenance */}
      <div className="px-4 py-2 bg-stone-50 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-2xs text-stone-500 gap-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono">
            <MapPin className="w-3 h-3 text-indigo-600" /> Center: {currentArea.lat.toFixed(4)}°N, {currentArea.lng.toFixed(4)}°E
          </span>
          <span className="text-stone-300">|</span>
          <span className="flex items-center gap-1 font-mono">
            <Compass className="w-3 h-3 text-stone-400" /> Coverage: ±{currentArea.radiusKm} km radius
          </span>
        </div>
        <div className="text-stone-400 font-mono">
          Data Provenance: Map Tiles [LIVE_TILES] · Drone Tracks [SIMULATED]
        </div>
      </div>
    </div>
  );
};
