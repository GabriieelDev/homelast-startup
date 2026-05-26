// NF-e XML parser (DOMParser-based, runs in the browser).

export interface NfeItem {
  ean: string;
  name: string;
  ncm: string;
  qty: number;
  unit: string;
  unitCost: number;
}

export interface ParsedNfe {
  key: string | null;        // chave de acesso (44 dígitos)
  number: string | null;     // nNF
  date: string | null;       // dhEmi ISO
  supplier: string | null;   // emitente xNome
  items: NfeItem[];
}

function txt(el: Element | null, tag: string): string {
  return el?.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

export function parseNfeXml(xml: string): ParsedNfe {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseErr = doc.getElementsByTagName("parsererror")[0];
  if (parseErr) throw new Error("XML inválido: " + parseErr.textContent);

  const infNFe = doc.getElementsByTagName("infNFe")[0];
  const rawKey = infNFe?.getAttribute("Id") ?? "";
  const key = rawKey.replace(/^NFe/, "") || null;

  const ide = doc.getElementsByTagName("ide")[0] ?? null;
  const emit = doc.getElementsByTagName("emit")[0] ?? null;

  const items: NfeItem[] = [];
  const dets = doc.getElementsByTagName("det");
  for (let i = 0; i < dets.length; i++) {
    const prod = dets[i].getElementsByTagName("prod")[0];
    if (!prod) continue;
    const ean = txt(prod, "cEAN");
    items.push({
      ean: !ean || ean.toUpperCase() === "SEM GTIN" ? "" : ean,
      name: txt(prod, "xProd"),
      ncm: txt(prod, "NCM"),
      qty: Number(txt(prod, "qCom") || 0),
      unit: txt(prod, "uCom") || "un",
      unitCost: Number(txt(prod, "vUnCom") || 0),
    });
  }

  return {
    key,
    number: txt(ide, "nNF") || null,
    date: txt(ide, "dhEmi") || null,
    supplier: txt(emit, "xNome") || null,
    items,
  };
}

// Extract NF-e key (44 digits) from a DANFE QR Code URL/text.
export function extractKeyFromQr(text: string): string | null {
  // QR usually contains URL with chNFe=... or 44-digit substring
  const param = text.match(/chNFe=(\d{44})/i)?.[1];
  if (param) return param;
  const m = text.match(/\b(\d{44})\b/);
  return m?.[1] ?? null;
}
