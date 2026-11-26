import { SUPPORTED_CITIES, type CityOption } from "@/common/cities";

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
  placeholder = "Select a city",
}: CitySelectProps) {
  const hasKnownCity = SUPPORTED_CITIES.some((c) => c.name === value);

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      required={required}
      onChange={(e) => {
        const selected = SUPPORTED_CITIES.find((c) => c.name === e.target.value);
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
      {SUPPORTED_CITIES.map((city) => (
        <option key={city.name} value={city.name}>
          {city.name}, {city.state}
        </option>
      ))}
    </select>
  );
}
