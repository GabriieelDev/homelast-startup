import { useEffect, useRef, useState } from "react";
import { Upload, QrCode, History, FileText, CheckCircle2, X, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { parseNfeXml, extractKeyFromQr, type ParsedNfe, type NfeItem } from "@/lib/nfe";

type SubTab = "xml" | "qr" | "hist";

interface PreviewRow extends NfeItem {
  include: boolean;
  categoryId: string;
}

export default function NfeImporter() {
  const [sub, setSub] = useState<SubTab>("xml");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Importar Nota Fiscal</h2>
      </div>

      <div className="flex gap-2 border-b border-border">
        {([
          { k: "xml", l: "Upload XML", i: Upload },
          { k: "qr", l: "Escanear QR Code", i: QrCode },
          { k: "hist", l: "Histórico", i: History },
        ] as const).map(({ k, l, i: Icon }) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              sub === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {l}
          </button>
        ))}
      </div>

      {sub === "xml" && <XmlUpload />}
      {sub === "qr" && <QrScan />}
      {sub === "hist" && <HistoryList />}
    </div>
  );
}

// ============== XML UPLOAD ==============
function XmlUpload() {
  const [parsed, setParsed] = useState<ParsedNfe | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      toast.error("Selecione um arquivo .xml");
      return;
    }
    try {
      const text = await file.text();
      const result = parseNfeXml(text);
      if (result.items.length === 0) {
        toast.error("Nenhum produto encontrado na NF-e");
        return;
      }
      setParsed(result);
      setFileName(file.name);
    } catch (e: any) {
      toast.error(e.message || "Erro ao ler XML");
    }
  };

  return (
    <div className="space-y-4">
      {!parsed && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Arraste o XML da NF-e aqui</p>
          <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {parsed && (
        <NfePreview
          parsed={parsed}
          method="xml"
          fileName={fileName}
          onClose={() => { setParsed(null); setFileName(""); }}
        />
      )}
    </div>
  );
}

// ============== PREVIEW & IMPORT ==============
function NfePreview({
  parsed, method, fileName, onClose,
}: {
  parsed: ParsedNfe;
  method: "xml" | "qrcode";
  fileName?: string;
  onClose: () => void;
}) {
  const { categories } = useCategories();
  const { user } = useAuth();
  const defaultCat = categories[0]?.id ?? "";
  const [rows, setRows] = useState<PreviewRow[]>(() =>
    parsed.items.map((it) => ({ ...it, include: true, categoryId: defaultCat })),
  );
  const [importing, setImporting] = useState(false);

  // when categories load late, fill empty categoryIds
  useEffect(() => {
    if (defaultCat) {
      setRows((rs) => rs.map((r) => (r.categoryId ? r : { ...r, categoryId: defaultCat })));
    }
  }, [defaultCat]);

  const update = (i: number, patch: Partial<PreviewRow>) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const confirm = async () => {
    const selected = rows.filter((r) => r.include);
    if (selected.length === 0) { toast.error("Nenhum produto selecionado"); return; }
    setImporting(true);
    let newCount = 0, updatedCount = 0;

    for (const row of selected) {
      const cat = categories.find((c) => c.id === row.categoryId);
      if (!cat) continue;

      // try find existing by ean or by name within same category
      let existing: any = null;
      if (row.ean) {
        const { data } = await supabase.from("products").select("id, name").eq("id", `ean-${row.ean}`).maybeSingle();
        existing = data;
      }
      if (!existing) {
        const { data } = await supabase
          .from("products").select("id").ilike("name", row.name).limit(1).maybeSingle();
        existing = data;
      }

      if (existing) {
        await supabase.from("products").update({
          cost_price: row.unitCost,
        }).eq("id", existing.id);
        // increment stock
        const { data: stk } = await supabase.from("product_stock").select("stock").eq("product_id", existing.id).maybeSingle();
        const current = stk?.stock ?? 0;
        await supabase.from("product_stock").upsert({
          product_id: existing.id,
          stock: current + Math.floor(row.qty),
        });
        updatedCount++;
      } else {
        const id = row.ean ? `ean-${row.ean}` : `nfe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const { error } = await supabase.from("products").insert({
          id,
          name: row.name,
          price: row.unitCost * 1.3, // sugestão: custo + 30%
          cost_price: row.unitCost,
          unit: row.unit.toLowerCase(),
          category: cat.slug,
          category_id: cat.id,
          sections: ["mais-comprados"],
          image: "/placeholder.svg",
          active: true,
        });
        if (!error) {
          await supabase.from("product_stock").upsert({ product_id: id, stock: Math.floor(row.qty) });
          newCount++;
        }
      }
    }

    // record history
    await supabase.from("nfe_imports").insert({
      nfe_number: parsed.number,
      nfe_key: parsed.key,
      supplier: parsed.supplier,
      nfe_date: parsed.date,
      method,
      imported_by: user?.id,
      products_count: selected.length,
      new_count: newCount,
      updated_count: updatedCount,
      raw_data: { items: selected, fileName } as any,
    });

    setImporting(false);
    toast.success(`Importação concluída: ${newCount} novos, ${updatedCount} atualizados, ${rows.length - selected.length} ignorados`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">NF-e {parsed.number ?? "—"}</p>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Fornecedor: <span className="text-foreground">{parsed.supplier ?? "—"}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Data: {parsed.date ? new Date(parsed.date).toLocaleString("pt-BR") : "—"} ·
          Chave: {parsed.key?.slice(0, 8) ?? "—"}…
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Incluir</th>
              <th className="p-2 text-left">Produto</th>
              <th className="p-2 text-left">EAN</th>
              <th className="p-2 text-right">Qtd</th>
              <th className="p-2 text-right">Custo unit.</th>
              <th className="p-2 text-left">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={(e) => update(i, { include: e.target.checked })}
                    className="h-4 w-4"
                  />
                </td>
                <td className="p-2 text-foreground">
                  <Input value={r.name} onChange={(e) => update(i, { name: e.target.value })} className="h-8" />
                </td>
                <td className="p-2 text-muted-foreground">{r.ean || "—"}</td>
                <td className="p-2 text-right text-foreground">{r.qty} {r.unit}</td>
                <td className="p-2 text-right text-foreground">R$ {r.unitCost.toFixed(2)}</td>
                <td className="p-2">
                  <Select value={r.categoryId} onValueChange={(v) => update(i, { categoryId: v })}>
                    <SelectTrigger className="h-8 w-44"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Crie categorias na aba "Categorias" antes de importar, se necessário.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirm} disabled={importing} className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> {importing ? "Importando..." : "Confirmar importação"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============== QR SCAN ==============
function QrScan() {
  const [scanning, setScanning] = useState(false);
  const [scannedKey, setScannedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedNfe | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);

  const start = async () => {
    setError(null);
    setScannedKey(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // wait a tick for the div to mount
      await new Promise((r) => setTimeout(r, 50));
      const scanner = new Html5Qrcode("nfe-qr-region");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          const key = extractKeyFromQr(decoded);
          if (key) {
            setScannedKey(key);
            scanner.stop().then(() => scanner.clear()).catch(() => {});
            setScanning(false);
          } else {
            setError("QR Code não reconhecido como uma NF-e válida.");
          }
        },
        () => { /* per-frame errors ignored */ },
      );
    } catch (e: any) {
      setScanning(false);
      if (!navigator.onLine) {
        setError("Sem conexão. O QR Code requer internet para buscar os dados da nota.");
      } else {
        setError(e?.message || "Não foi possível abrir a câmera.");
      }
    }
  };

  const stop = async () => {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch { /* noop */ }
    setScanning(false);
  };

  useEffect(() => () => { stop(); }, []);

  const handleXmlAfterScan = async (file: File) => {
    try {
      const text = await file.text();
      const result = parseNfeXml(text);
      if (scannedKey && result.key && result.key !== scannedKey) {
        toast.warning("A chave do XML não corresponde ao QR escaneado.");
      }
      setParsed(result);
      setFileName(file.name);
    } catch (e: any) {
      toast.error(e.message || "Erro ao ler XML");
    }
  };

  if (parsed) {
    return <NfePreview parsed={parsed} method="qrcode" fileName={fileName} onClose={() => { setParsed(null); setScannedKey(null); }} />;
  }

  return (
    <div className="space-y-4">
      {!scanning && !scannedKey && (
        <div className="rounded-lg border border-border p-8 text-center space-y-4">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Escaneie o QR Code do DANFE</p>
            <p className="text-sm text-muted-foreground mt-1">
              A câmera traseira será usada automaticamente.
            </p>
          </div>
          <Button onClick={start} className="gap-2"><QrCode className="h-4 w-4" /> Abrir câmera</Button>
        </div>
      )}

      {scanning && (
        <div className="space-y-3">
          <div ref={containerRef} id="nfe-qr-region" className="w-full max-w-md mx-auto rounded-lg overflow-hidden bg-black" />
          <p className="text-center text-sm text-muted-foreground">Aponte para o QR Code dentro do quadro.</p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={stop}>Cancelar</Button>
          </div>
        </div>
      )}

      {scannedKey && !scanning && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">QR Code lido com sucesso</p>
              <p className="text-xs text-muted-foreground break-all mt-1">Chave: {scannedKey}</p>
            </div>
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              A consulta automática na SEFAZ requer certificado digital. Para concluir a importação,
              faça o upload do XML correspondente recebido por e-mail do fornecedor.
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleXmlAfterScan(f); }}
          />
          <div className="flex gap-2">
            <Button onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Selecionar XML correspondente
            </Button>
            <Button variant="outline" onClick={() => { setScannedKey(null); }}>Escanear outro</Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}
    </div>
  );
}

// ============== HISTORY ==============
function HistoryList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("nfe_imports").select("*").order("created_at", { ascending: false }).limit(100);
      if (!mounted) return;
      setItems(data ?? []);
      const ids = Array.from(new Set((data ?? []).map((i: any) => i.imported_by).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p: any) => { map[p.user_id] = p.full_name || ""; });
        setProfilesMap(map);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando histórico...</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma importação registrada.</p>;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Data/hora</th>
              <th className="p-2 text-left">NF-e</th>
              <th className="p-2 text-left">Fornecedor</th>
              <th className="p-2 text-center">Produtos</th>
              <th className="p-2 text-center">Método</th>
              <th className="p-2 text-left">Admin</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-border">
                <td className="p-2 text-foreground">{new Date(it.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-2 text-foreground">{it.nfe_number ?? "—"}</td>
                <td className="p-2 text-muted-foreground truncate max-w-[200px]">{it.supplier ?? "—"}</td>
                <td className="p-2 text-center">{it.products_count}</td>
                <td className="p-2 text-center text-xs uppercase">{it.method}</td>
                <td className="p-2 text-muted-foreground">{profilesMap[it.imported_by] || "—"}</td>
                <td className="p-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setDetail(it)}>Detalhes</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da importação</DialogTitle>
            <DialogDescription>
              NF-e {detail?.nfe_number} · {detail?.supplier}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                {detail.new_count} novos · {detail.updated_count} atualizados ·
                Chave: {detail.nfe_key ?? "—"}
              </p>
              <table className="w-full text-sm border border-border rounded-lg">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Produto</th>
                    <th className="p-2 text-left">EAN</th>
                    <th className="p-2 text-right">Qtd</th>
                    <th className="p-2 text-right">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.raw_data?.items ?? []).map((r: any, i: number) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2 text-muted-foreground">{r.ean || "—"}</td>
                      <td className="p-2 text-right">{r.qty} {r.unit}</td>
                      <td className="p-2 text-right">R$ {Number(r.unitCost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
