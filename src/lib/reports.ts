// Lightweight CSV/Excel-compatible export utilities (no external dependencies).
// Excel opens .csv with UTF-8 BOM correctly.

export type Row = Record<string, string | number | null | undefined>;

const escape = (v: unknown) => {
  const s = v == null ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export function toCSV(rows: Row[], headers?: string[]): string {
  if (!rows.length) return "";
  const cols = headers ?? Object.keys(rows[0]);
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => escape(r[c])).join(",")).join("\n");
  return `\uFEFF${head}\n${body}`;
}

export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCSV(filename: string, rows: Row[], headers?: string[]) {
  downloadFile(filename, toCSV(rows, headers));
}

// Excel-compatible XML spreadsheet (.xls) — opens natively in Excel/LibreOffice.
export function downloadExcelXML(filename: string, rows: Row[], sheetName = "Dados") {
  if (!rows.length) {
    downloadFile(filename, "Sem dados", "application/vnd.ms-excel");
    return;
  }
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    if (typeof v === "number") return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
    const s = (v ?? "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<Cell><Data ss:Type="String">${s}</Data></Cell>`;
  };
  const header = `<Row>${cols.map((c) => cell(c)).join("")}</Row>`;
  const body = rows.map((r) => `<Row>${cols.map((c) => cell(r[c])).join("")}</Row>`).join("");
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${sheetName}"><Table>${header}${body}</Table></Worksheet>
</Workbook>`;
  downloadFile(filename, xml, "application/vnd.ms-excel");
}

// Simple printable HTML report opened in new window (user uses browser "Save as PDF").
export function openPrintableReport(title: string, rows: Row[], subtitle?: string) {
  if (!rows.length) {
    window.alert("Sem dados para exportar.");
    return;
  }
  const cols = Object.keys(rows[0]);
  const head = cols.map((c) => `<th>${c}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`)
    .join("");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>
<style>
body{font-family:-apple-system,Segoe UI,Inter,sans-serif;padding:32px;color:#0f172a}
h1{margin:0 0 4px;color:#16a34a}
.sub{color:#64748b;margin-bottom:24px;font-size:14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}
th{background:#f1f5f9;font-weight:600}
tr:nth-child(even) td{background:#fafafa}
.brand{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.dot{width:14px;height:14px;border-radius:50%;background:#16a34a}
@media print{body{padding:16px}.no-print{display:none}}
</style></head><body>
<div class="brand"><div class="dot"></div><strong>ServBem Supermercado</strong></div>
<h1>${title}</h1>
<div class="sub">${subtitle ?? ""} · Gerado em ${new Date().toLocaleString("pt-BR")}</div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
