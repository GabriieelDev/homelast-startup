// Geolocalização + geocodificação reversa (Nominatim/OpenStreetMap).
// As coordenadas só são usadas para preencher o formulário; nunca são salvas.

export type GeoErrorCode = "denied" | "unavailable" | "timeout" | "network" | "no_address";

export class GeoError extends Error {
  code: GeoErrorCode;
  constructor(code: GeoErrorCode) {
    super(GEO_MESSAGES[code]);
    this.code = code;
  }
}

export const GEO_MESSAGES: Record<GeoErrorCode, string> = {
  denied: "Permita o acesso à localização no navegador ou digite o endereço manualmente.",
  unavailable: "Não foi possível obter sua localização. Digite o endereço manualmente.",
  timeout: "A localização demorou demais para responder. Tente novamente ou digite o endereço manualmente.",
  network: "Falha de conexão ao buscar o endereço. Tente novamente ou digite manualmente.",
  no_address: "Não encontramos um endereço para sua posição. Digite o endereço manualmente.",
};

export interface GeoAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zip_code: string;
}

export const isGeolocationSupported = () =>
  typeof navigator !== "undefined" && "geolocation" in navigator;

export const getCurrentPosition = (): Promise<{ lat: number; lon: number }> =>
  new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) return reject(new GeoError("unavailable"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new GeoError("denied"));
        else if (err.code === err.TIMEOUT) reject(new GeoError("timeout"));
        else reject(new GeoError("unavailable"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });

const formatZip = (raw?: string) => {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : "";
};

export const reverseGeocode = async (lat: number, lon: number): Promise<GeoAddress> => {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=pt-BR" +
    `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let data: { address?: Record<string, string> };
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new GeoError("network");
    data = await res.json();
  } catch (e) {
    if (e instanceof GeoError) throw e;
    throw new GeoError("network");
  } finally {
    clearTimeout(timer);
  }

  const a = data?.address;
  if (!a) throw new GeoError("no_address");

  const result: GeoAddress = {
    street: a.road ?? "",
    number: a.house_number ?? "",
    neighborhood: a.suburb || a.neighbourhood || a.city_district || a.quarter || "",
    city: a.city || a.town || a.village || a.municipality || "",
    zip_code: formatZip(a.postcode),
  };
  if (!result.street && !result.neighborhood && !result.city) throw new GeoError("no_address");
  return result;
};
