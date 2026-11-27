import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin, Search, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { findCityByName, findNearestCity } from "@/common/cities";
import { resolveRegionForLocation, type ResolveRegionResult } from "@/services/regions.service";

export interface ResolvedLocationInfo {
  addressLine?: string;
  city?: string;
}

interface LocationPickerProps {
  /** Current [longitude, latitude] coordinates, or null if not yet selected */
  value: [number, number] | null;
  /** Called whenever the user picks a location via map click, marker drag, search, or live GPS */
  onChange: (coords: [number, number], resolved?: ResolvedLocationInfo) => void;
  /** Optional [longitude, latitude] to pan the map to when no custom point or city changes */
  centerHint?: [number, number];
  /** Tailwind height class for the map container */
  heightClass?: string;
  /** Optional label shown above the picker */
  label?: string;
  /** Whether to show the area/landmark search bar */
  showSearch?: boolean;
}

const DEFAULT_CENTER: [number, number] = [77.5946, 12.9716]; // Bengaluru

const PIN_ICON = L.divIcon({
  className: "tatku-map-pin",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;transform:translate(-50%,-100%);">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#2563eb" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3" fill="#ffffff"/>
    </svg>
  </div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function formatAddressLine(data: any): string | undefined {
  const addr = data?.address;
  if (!addr) {
    return typeof data?.display_name === "string"
      ? data.display_name.split(",").slice(0, 3).join(",").trim()
      : undefined;
  }

  const parts = [
    addr.house_number,
    addr.road || addr.pedestrian || addr.residential,
    addr.neighbourhood || addr.suburb || addr.quarter || addr.village,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(", ");
  if (typeof data?.display_name === "string") {
    return data.display_name.split(",").slice(0, 3).join(",").trim();
  }
  return undefined;
}

function extractCityName(data: any, coords: [number, number]): string {
  const addr = data?.address;
  const candidates = [
    addr?.city,
    addr?.town,
    addr?.municipality,
    addr?.state_district,
    addr?.county,
  ];

  for (const candidate of candidates) {
    const matched = findCityByName(candidate);
    if (matched) return matched.name;
  }

  return findNearestCity(coords).name;
}

async function reverseGeocode(coords: [number, number]): Promise<ResolvedLocationInfo> {
  const [lng, lat] = coords;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    return {
      addressLine: formatAddressLine(data),
      city: extractCityName(data, coords),
    };
  } catch {
    return {
      city: findNearestCity(coords).name,
    };
  }
}

export function LocationPicker({
  value,
  onChange,
  centerHint,
  heightClass = "h-56",
  label = "Pin Location on Map",
  showSearch = true,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [regionStatus, setRegionStatus] = useState<ResolveRegionResult | null>(null);

  useEffect(() => {
    if (!value || (value[0] === 0 && value[1] === 0)) {
      setRegionStatus(null);
      return;
    }
    let cancelled = false;
    resolveRegionForLocation(value[0], value[1])
      .then((res) => {
        if (!cancelled) setRegionStatus(res);
      })
      .catch(() => {
        if (!cancelled) setRegionStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value?.[0], value?.[1]]);

  const initialCoords = value ?? centerHint ?? DEFAULT_CENTER;

  const placeOrMoveMarker = (map: L.Map, coords: [number, number]) => {
    const latLng: [number, number] = [coords[1], coords[0]];
    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
    } else {
      const marker = L.marker(latLng, { icon: PIN_ICON, draggable: true }).addTo(map);
      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        const nextCoords: [number, number] = [
          Number(pos.lng.toFixed(6)),
          Number(pos.lat.toFixed(6)),
        ];
        setStatusError(null);
        setResolving(true);
        const resolved = await reverseGeocode(nextCoords);
        setResolving(false);
        onChangeRef.current(nextCoords, resolved);
      });
      markerRef.current = marker;
    }
  };

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [initialCoords[1], initialCoords[0]],
      zoom: value ? 15 : 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    if (value) {
      placeOrMoveMarker(map, value);
    }

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const nextCoords: [number, number] = [
        Number(e.latlng.lng.toFixed(6)),
        Number(e.latlng.lat.toFixed(6)),
      ];
      setStatusError(null);
      placeOrMoveMarker(map, nextCoords);
      setResolving(true);
      const resolved = await reverseGeocode(nextCoords);
      setResolving(false);
      onChangeRef.current(nextCoords, resolved);
    });

    mapRef.current = map;

    // Ensure tiles render properly if mounted inside a modal/collapsible section
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external `value` changes (e.g. form reset or initial edit value)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (value) {
      placeOrMoveMarker(map, value);
      map.panTo([value[1], value[0]], { animate: true });
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value?.[0], value?.[1]]);

  // Pan map when city centerHint changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerHint) return;
    map.setView([centerHint[1], centerHint[0]], 12, { animate: true });
  }, [centerHint?.[0], centerHint?.[1]]);

  const handleLiveLocation = () => {
    setStatusError(null);
    if (!("geolocation" in navigator)) {
      setStatusError("Live location is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoords: [number, number] = [
          Number(position.coords.longitude.toFixed(6)),
          Number(position.coords.latitude.toFixed(6)),
        ];
        if (mapRef.current) {
          placeOrMoveMarker(mapRef.current, nextCoords);
          mapRef.current.setView([nextCoords[1], nextCoords[0]], 16, { animate: true });
        }
        const resolved = await reverseGeocode(nextCoords);
        setLocating(false);
        onChangeRef.current(nextCoords, resolved);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setStatusError("Location permission denied. Please allow access or click on the map.");
        } else {
          setStatusError("Could not detect your live location. Please click on the map instead.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setStatusError(null);
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error("Search failed");
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) {
        setStatusError("No matching place found. Try a nearby landmark or click on the map.");
        return;
      }
      const top = results[0];
      const nextCoords: [number, number] = [
        Number(parseFloat(top.lon).toFixed(6)),
        Number(parseFloat(top.lat).toFixed(6)),
      ];
      if (mapRef.current) {
        placeOrMoveMarker(mapRef.current, nextCoords);
        mapRef.current.setView([nextCoords[1], nextCoords[0]], 15, { animate: true });
      }
      onChangeRef.current(nextCoords, {
        addressLine: formatAddressLine(top),
        city: extractCityName(top, nextCoords),
      });
    } catch {
      setStatusError("Place search is unavailable right now. Please click directly on the map.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          {label}
        </span>

        <button
          type="button"
          onClick={handleLiveLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5" />
          )}
          {locating ? "Detecting..." : "Use Live Location"}
        </button>
      </div>

      {showSearch && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearch();
                }
              }}
              placeholder="Search area, street, or landmark..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching || !searchQuery.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            {searching ? "..." : "Find"}
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full ${heightClass} rounded-xl border border-slate-300 overflow-hidden z-0 relative bg-slate-100`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {value ? (
          <span className="text-slate-600 font-medium">
            Pinned: {Math.abs(value[1]).toFixed(4)}° {value[1] >= 0 ? "N" : "S"},{" "}
            {Math.abs(value[0]).toFixed(4)}° {value[0] >= 0 ? "E" : "W"}
            {resolving && " · Looking up address..."}
          </span>
        ) : (
          <span className="text-slate-500">
            Click anywhere on the map or use Live Location to pin.
          </span>
        )}

        {value && regionStatus && (
          regionStatus.serviceable && regionStatus.region ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Serviceable: {regionStatus.region.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-amber-800 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Service not available here
            </span>
          )
        )}
      </div>

      {statusError && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          {statusError}
        </p>
      )}
    </div>
  );
}
