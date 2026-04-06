'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import type { Location } from '@/types';

/**
 * LocationSelector
 *
 * Mirrors the client-company dropdown pattern in dashboard-layout-client.tsx.
 * Persists selection to localStorage under 'selectedLocationId' and broadcasts
 * a CustomEvent('locationChanged') so any component can react without prop drilling.
 */

export const LOCATION_STORAGE_KEY = 'selectedLocationId';
export const LOCATION_CHANGED_EVENT = 'locationChanged';

interface Props {
  /** If true, shows a compact version with just the icon (collapsed sidebar). */
  collapsed?: boolean;
}

export default function LocationSelector({ collapsed = false }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const selected = locations.find((l) => l.id === selectedId);

  const handleSelect = useCallback((locationId: string | null) => {
    setSelectedId(locationId);
    setOpen(false);
    if (typeof window !== 'undefined') {
      if (locationId) {
        window.localStorage?.setItem?.(LOCATION_STORAGE_KEY, locationId);
      } else {
        window.localStorage?.removeItem?.(LOCATION_STORAGE_KEY);
      }
      window.dispatchEvent(
        new CustomEvent(LOCATION_CHANGED_EVENT, { detail: { locationId } })
      );
    }
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/locations');
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setLocations(json.data as Location[]);
          const stored = typeof window !== 'undefined'
            ? window.localStorage?.getItem?.(LOCATION_STORAGE_KEY)
            : null;
          const valid = stored && json.data.some((l: Location) => l.id === stored);
          // Restore stored selection; null means "All Locations" (no filter)
          if (valid) {
            setSelectedId(stored);
          } else {
            setSelectedId(null);
          }
        }
      } catch (e) {
        console.error('Failed to fetch locations:', e);
      }
    };
    fetchLocations();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  if (locations.length === 0) return null;

  if (collapsed) {
    return (
      <div className="relative flex justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          title={selected?.name ?? 'Select Location'}
          className="p-2 rounded-lg text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d] transition-colors"
        >
          <MapPin size={20} />
        </button>
        {open && (
          <LocationDropdown
            locations={locations}
            selectedId={selectedId}
            onSelect={handleSelect}
            className="left-full ml-2 top-0"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative px-3 py-1">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg text-sm hover:border-[#06b6d4] transition-colors"
      >
        <MapPin size={14} className="text-[#06b6d4] flex-shrink-0" />
        <span className="flex-1 text-left text-[#e8e8f0] truncate">
          {selected?.name ?? 'All Locations'}
        </span>
        <svg
          className={`w-4 h-4 text-[#8888a0] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <LocationDropdown
          locations={locations}
          selectedId={selectedId}
          onSelect={handleSelect}
          className="left-0 right-0 top-full mt-1"
        />
      )}
    </div>
  );
}

function LocationDropdown({
  locations,
  selectedId,
  onSelect,
  className = '',
}: {
  locations: Location[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}) {
  // Group into parents and children for a simple hierarchy display
  const roots = locations.filter((l) => !l.parent_id);
  const children = (parentId: string) => locations.filter((l) => l.parent_id === parentId);

  return (
    <div
      className={`absolute z-50 w-56 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg shadow-xl py-1 max-h-72 overflow-y-auto ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* "All Locations" clears the filter */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
          selectedId === null
            ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
            : 'text-[#e8e8f0] hover:bg-[#2a2a3d]'
        }`}
      >
        <div className="font-medium">All Locations</div>
      </button>
      <div className="border-t border-[#2a2a3d] my-1" />
      {roots.map((loc) => (
        <div key={loc.id}>
          <LocationOption
            location={loc}
            selected={selectedId === loc.id}
            onSelect={onSelect}
          />
          {children(loc.id).map((child) => (
            <LocationOption
              key={child.id}
              location={child}
              selected={selectedId === child.id}
              onSelect={onSelect}
              indent
            />
          ))}
        </div>
      ))}
      <div className="border-t border-[#2a2a3d] mt-1 pt-1">
        <a
          href="/dashboard/locations"
          className="block px-4 py-2.5 text-xs text-[#06b6d4] hover:bg-[#2a2a3d] transition-colors"
        >
          Manage locations →
        </a>
      </div>
    </div>
  );
}

function LocationOption({
  location,
  selected,
  onSelect,
  indent = false,
}: {
  location: Location;
  selected: boolean;
  onSelect: (id: string | null) => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(location.id)}
      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
        indent ? 'pl-8' : ''
      } ${
        selected
          ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
          : 'text-[#e8e8f0] hover:bg-[#2a2a3d]'
      }`}
    >
      <div className="font-medium truncate">{location.name}</div>
      {(location.city || location.state) && (
        <div className="text-xs text-[#8888a0] mt-0.5 truncate">
          {[location.city, location.state].filter(Boolean).join(', ')}
        </div>
      )}
      {location.is_default && !selected && (
        <div className="text-xs text-[#8888a0] mt-0.5">Default</div>
      )}
    </button>
  );
}
