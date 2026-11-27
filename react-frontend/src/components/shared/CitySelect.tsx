import { useEffect, useState } from "react";
import { SUPPORTED_CITIES, type CityOption } from "@/common/cities";
import { getActiveRegions } from "@/services/regions.service";

interface CitySelectProps {
  value: string;
  onChange: (city: CityOption) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  placeholder?: string;
}

export function CitySelect({
  value,
  onChange,
  className = "w-full text-sm rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500 bg-white",
  disabled = false,
  required = false,
  id,
  placeholder = "Select a serviceable region",
}: CitySelectProps) {
  const [options, setOptions] = useState<CityOption[]>(SUPPORTED_CITIES);

  useEffect(() => {
    let cancelled = false;
    getActiveRegions()
      .then((regions) => {
        if (cancelled || !Array.isArray(regions) || regions.length === 0) return;
        const mapped: CityOption[] = regions
          .filter((r) => r.location?.coordinates?.length === 2)
          .map((r) => ({
            name: r.name,
            state: "Serviceable Region",
            coordinates: r.location!.coordinates as [number, number],
            regionId: r._id,
          }));
        if (mapped.length > 0) {
          setOptions(mapped);
        }
      })
      .catch(() => {
        // Keep SUPPORTED_CITIES fallback if network request fails
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasKnownCity = options.some((c) => c.name === value);

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      required={required}
      onChange={(e) => {
        const selected = options.find((c) => c.name === e.target.value);
        if (selected) onChange(selected);
      }}
      className={className}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {!hasKnownCity && value && (
        <option value={value}>{value}</option>
      )}
      {options.map((city) => (
        <option key={city.regionId ?? city.name} value={city.name}>
          {city.regionId ? city.name : `${city.name}, ${city.state}`}
        </option>
      ))}
    </select>
  );
}
