import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REASONS = ["Cliente pediu", "Produto em falta", "Endereço fora da área", "Outro"];

interface Props {
  orderId: string;
  orderNumber: number;
  onCancelled?: () => void;
}

const CancelOrderDialog = ({ orderId, orderNumber, onCancelled }: Props) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const finalReason = reason === "Outro" ? other.trim() || "Outro" : reason;
    setBusy(true);
    const { error } = await supabase.rpc("cancel_order", {
      p_order_id: orderId,
      p_reason: finalReason || undefined,
    });
    setBusy(false);
    if (error) { toast.error(error.message || "Erro ao cancelar pedido"); return; }
    toast.success(`Pedido #${orderNumber} cancelado`);
    setOpen(false);
    setReason("");
    setOther("");
    onCancelled?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
          Cancelar pedido
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar pedido #{orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Os itens voltam ao estoque e o cupom, se houver, fica disponível de novo. O cliente será avisado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger><SelectValue placeholder="Motivo (opcional)" /></SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {reason === "Outro" && (
          <Input value={other} onChange={(e) => setOther(e.target.value)} maxLength={120} placeholder="Descreva o motivo" />
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => { e.preventDefault(); submit(); }}
          >
            {busy ? "Cancelando..." : "Cancelar pedido"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderDialog;
