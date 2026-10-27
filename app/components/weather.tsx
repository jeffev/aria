"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temp: number;
  apparent: number;
  code: number;
  city: string;
}

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Céu limpo", icon: "☀️" },
  1: { label: "Poucas nuvens", icon: "🌤️" },
  2: { label: "Nublado", icon: "⛅" },
  3: { label: "Encoberto", icon: "☁️" },
  45: { label: "Neblina", icon: "🌫️" },
  48: { label: "Neblina", icon: "🌫️" },
  51: { label: "Garoa leve", icon: "🌦️" },
  53: { label: "Garoa", icon: "🌧️" },
  61: { label: "Chuva leve", icon: "🌧️" },
  63: { label: "Chuva", icon: "🌧️" },
  65: { label: "Chuva forte", icon: "🌧️" },
  71: { label: "Neve leve", icon: "❄️" },
  80: { label: "Pancadas", icon: "⛈️" },
  95: { label: "Tempestade", icon: "⛈️" },
};

const MOBILE_QUERY = "(max-width: 768px)";

function getWeatherInfo(code: number) {
  return WMO_CODES[code] ?? { label: "—", icon: "🌡️" };
}

async function fetchCityName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const data = await res.json();
    return data.address?.city ?? data.address?.town ?? data.address?.state ?? "Sua cidade";
  } catch {
    return "Sua cidade";
  }
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // O clima mora na barra lateral, que o celular não mostra: pedir a
    // localização ali seria pedir permissão para nada.
    if (window.matchMedia(MOBILE_QUERY).matches || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        try {
          const [weatherRes, city] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`),
            fetchCityName(lat, lon),
          ]);
          const data = await weatherRes.json();
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            apparent: Math.round(data.current.apparent_temperature),
            code: data.current.weather_code,
            city,
          });
        } catch {
          setError(true);
        }
      },
      () => setError(true)
    );
  }, []);

  if (error) return null;
  if (!weather) return (
    <div style={{ padding: "8px 0", color: "var(--foreground-muted)", fontSize: 12 }}>Carregando clima...</div>
  );

  const { label, icon } = getWeatherInfo(weather.code);

  return (
    <div style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{weather.temp}°C</p>
          <p style={{ margin: 0, fontSize: 10, color: "var(--foreground-muted)" }}>
            {label} · Sensação {weather.apparent}°C
          </p>
        </div>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 10, color: "var(--foreground-muted)" }}>📍 {weather.city}</p>
    </div>
  );
}
