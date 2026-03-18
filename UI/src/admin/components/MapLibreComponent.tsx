import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Input, Button, message, Space, Spin } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';

interface MapLibreComponentProps {
  coords: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  pal: any;
}

const MapLibreComponent: React.FC<MapLibreComponentProps> = ({ coords, onChange, pal }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);

  const initialCoords = useMemo(() => coords || { lat: 13.0827, lng: 80.2707 }, []);

  useEffect(() => {
    if (map.current) return; // Only init once

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [initialCoords.lng, initialCoords.lat],
      zoom: 13,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    const m = new maplibregl.Marker({ draggable: true })
      .setLngLat([initialCoords.lng, initialCoords.lat])
      .addTo(map.current);

    m.on('dragend', () => {
      const lngLat = m.getLngLat();
      onChange({ lat: lngLat.lat, lng: lngLat.lng });
    });

    marker.current = m;

    return () => {
      map.current?.remove();
    };
  }, []);

  // Sync coords from props ONLY if they change significantly (e.g. from search)
  useEffect(() => {
    if (coords && map.current && marker.current) {
      const currentPos = marker.current.getLngLat();
      if (Math.abs(currentPos.lat - coords.lat) > 0.0001 || Math.abs(currentPos.lng - coords.lng) > 0.0001) {
        marker.current.setLngLat([coords.lng, coords.lat]);
        map.current.flyTo({ center: [coords.lng, coords.lat], zoom: 15, essential: true });
      }
    }
  }, [coords]);

  const resolveLocation = async (input: string) => {
    if (!input.trim()) return;
    setSearching(true);

    try {
      // 1. FAST REGEX EXTRACTION (Google Maps / Coords)
      // Standard coords: "12.34, 56.78"
      const coordMatch = input.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          onChange({ lat, lng });
          setSearching(false);
          message.success('Location resolved from coordinates');
          return;
        }
      }

      // Google Maps URL Regex
      const urlMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (urlMatch) {
        const lat = parseFloat(urlMatch[1]);
        const lng = parseFloat(urlMatch[2]);
        onChange({ lat, lng });
        setSearching(false);
        message.success('Instant resolve: extracted from URL');
        return;
      }

      // 2. PLUS CODE / TEXT FALLBACK (Nominatim)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        onChange({ lat, lng });
        message.success(`Found: ${data[0].display_name.split(',')[0]}`);
      } else {
        message.warning('Location not found. Try coordinates or a URL.');
      }
    } catch (err) {
      message.error('Search failed. Check connection.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="map-libre-container" style={{ position: 'relative' }}>
      <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
        <Input
          prefix={<EnvironmentOutlined style={{ color: pal.textMuted }} />}
          placeholder="Search location, paste Google Maps URL, or Plus Code..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => resolveLocation(searchText)}
          style={{ background: pal.inputBg, borderColor: pal.border, color: pal.text, height: 45 }}
          autoComplete="off"
        />
        <Button
          type="primary"
          icon={searching ? <Spin size="small" /> : <SearchOutlined />}
          onClick={() => resolveLocation(searchText)}
          style={{ height: 45, background: '#e65100', borderColor: '#e65100', fontWeight: 700 }}
          disabled={searching}
        >
          Search
        </Button>
      </Space.Compact>

      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: 350, 
          borderRadius: 12, 
          border: `1px solid ${pal.border}`,
          overflow: 'hidden'
        }} 
      />
    </div>
  );
};

export default React.memo(MapLibreComponent);
