import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Input, Button, message, Space, Spin, Tooltip } from 'antd';
import { SearchOutlined, EnvironmentOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { encode } from 'open-location-code';

// CDN Assets for Zero-Latency Loading
const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const ICON_2X = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/src/assets/images/marker-icon-2x.png";
const ICON_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/src/assets/images/marker-icon.png";
const SHADOW_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/src/assets/images/marker-shadow.png";

// Fix Marker Icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: ICON_2X,
  iconUrl: ICON_URL,
  shadowUrl: SHADOW_URL,
});

interface UnbreakableMapProps {
  coords: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  pal: any;
  mode: 'dark' | 'light';
}

// ─── HELPER: MAP CONTROLLER ───
function MapController({ coords, isSearching }: { coords: { lat: number; lng: number } | null, isSearching: boolean }) {
  const map = useMap();
  
  // UNBREAKABLE FIX: Force redraw on mount and search
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 15, { animate: true, duration: 1.5 });
      setTimeout(() => map.invalidateSize(), 500); // secondary redraw after flyto
    }
  }, [coords, map]);

  return null;
}

const UnbreakableMap: React.FC<UnbreakableMapProps> = ({ coords, onChange, pal, mode }) => {
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapStarted, setMapStarted] = useState(false);
  const [copied, setCopied] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  const plusCode = coords ? encode(coords.lat, coords.lng) : null;

  const handleCopy = () => {
    if (plusCode) {
      navigator.clipboard.writeText(plusCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      message.success('Plus Code copied to clipboard');
    }
  };


  // Load CSS dynamically to avoid blocking
  useEffect(() => {
    if (!document.getElementById('leaflet-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-cdn-css';
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.integrity = "sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
    setMapStarted(true);
  }, []);

  const resolveLocation = async (input: string) => {
    if (!input.trim()) return;
    setSearching(true);

    try {
      const query = input.trim();

      // 1. INSTANT REGEX: Google Maps URL / Coords
      const urlCoords = query.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) 
        || query.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
        || query.match(/\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
      
      if (urlCoords) {
        onChange({ lat: parseFloat(urlCoords[1]), lng: parseFloat(urlCoords[2]) });
        message.success('Resolved instantly from URL');
        return;
      }

      const rawCoords = query.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
      if (rawCoords) {
        onChange({ lat: parseFloat(rawCoords[1]), lng: parseFloat(rawCoords[2]) });
        message.success('Resolved from coordinates');
        return;
      }

      // 2. NOMINATIM SEARCH
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        onChange({ lat, lng });
        message.success(`Found: ${data[0].display_name.split(',')[0]}`);
      } else {
        message.warning('Location not found. Try more details.');
      }
    } catch (err) {
      message.error('Connection failed');
    } finally {
      setSearching(false);
    }
  };

  const tileUrl = mode === 'dark'
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  if (!mapStarted) return <div style={{ height: 400, background: pal.card, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pal.textDim }}>Initializing Hyper-Speed Engine...</div>;

  return (
    <div className="unbreakable-map-container">
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: pal.textMuted }} />}
          placeholder="Search location, paste Google Maps URL, or Plus Code..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => resolveLocation(searchText)}
          style={{ background: pal.inputBg, borderColor: pal.border, height: 45, borderRadius: '8px 0 0 8px' }}
          autoComplete="off"
        />
        <Button
          type="primary"
          onClick={() => resolveLocation(searchText)}
          loading={searching}
          className="btn-brand-gradient"
          style={{ height: 45, fontWeight: 700, paddingInline: 25, borderRadius: '0 8px 8px 0' }}
        >
          {searching ? 'SEARCHING' : 'SEARCH'}
        </Button>
      </Space.Compact>

      <div style={{ height: 400, width: '100%', borderRadius: 12, overflow: 'hidden', border: `1px solid ${pal.border}`, position: 'relative', zIndex: 0 }}>
        <MapContainer
          center={coords || [13.0827, 80.2707]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer url={tileUrl} attribution="&copy; CartoDB" />
          <MapController coords={coords} isSearching={searching} />
          {coords && (
            <Marker
              position={[coords.lat, coords.lng]}
              draggable={true}
              ref={markerRef}
              eventHandlers={{
                dragend: () => {
                  const m = markerRef.current;
                  if (m) {
                    const pos = m.getLatLng();
                    onChange({ lat: pos.lat, lng: pos.lng });
                  }
                }
              }}
            />
          )}
        </MapContainer>
      </div>
      <div style={{ 
        marginTop: 12, 
        padding: '10px 16px', 
        background: pal.inputBg, 
        border: `1px solid ${pal.border}`, 
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined style={{ color: pal.textMuted, fontSize: '0.9rem' }} />
          <span style={{ fontSize: '0.8rem', color: pal.textDim, fontWeight: 600 }}>
            PLUS CODE: <span style={{ color: plusCode ? pal.text : pal.textMuted }}>{plusCode || 'Pending selection...'}</span>
          </span>
        </div>
        {plusCode && (
          <Tooltip title={copied ? "Copied!" : "Copy Plus Code"}>
            <Button 
              type="text" 
              icon={copied ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />} 
              onClick={handleCopy}
              style={{ color: copied ? '#52c41a' : pal.textDim }}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default React.memo(UnbreakableMap);
