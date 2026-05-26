import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, GripVertical, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCategories, slugify, type Category } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const EMOJIS = ["🛒","🥬","🏪","🥤","🧹","🧴","🍞","🥩","🧀","🍎","🍫","🥛","🧊","🧻","🍺","🍷","🌮","🥗"];

function CategoryForm({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Category;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "🛒");
  const [color, setColor] = useState(editing?.color ?? "#1565C0");
  const [active, setActive] = useState(editing?.active ?? true);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // reset on open
  useMemo(() => {
    if (open) {
      setName(editing?.name ?? "");
      setSlug(editing?.slug ?? "");
      setIcon(editing?.icon ?? "🛒");
      setColor(editing?.color ?? "#1565C0");
      setActive(editing?.active ?? true);
      setSlugTouched(!!editing);
    }
  }, [open, editing]);

  const handleName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    const finalSlug = (slug.trim() || slugify(name)).toLowerCase();
    setSaving(true);
    const payload = { name: name.trim(), slug: finalSlug, icon, color, active };
    const { error } = editing
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Categoria atualizada" : "Categoria criada");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Configure como esta categoria aparece para os clientes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => handleName(e.target.value)} placeholder="Ex: Hortifrúti" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL)</Label>
            <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="hortifruti" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-border rounded-md">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`h-9 w-9 rounded-md text-xl transition-transform hover:scale-110 ${icon === e ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-secondary"}`}
                  >{e}</button>
                ))}
              </div>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="ou cole emoji" />
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded border border-border cursor-pointer" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Categoria ativa</p>
              <p className="text-xs text-muted-foreground">Aparece nos filtros da vitrine</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar categoria"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortableRow({ cat, count, onEdit, onToggle, onDelete }: {
  cat: Category; count: number;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-3 px-2 border-b border-border bg-card">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="h-10 w-10 rounded-lg flex items-center justify-center text-2xl" style={{ background: `${cat.color}20` }}>
        {cat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {cat.name} {!cat.active && <span className="text-xs text-muted-foreground">(inativa)</span>}
        </p>
        <p className="text-xs text-muted-foreground">/{cat.slug} · {count} produto{count === 1 ? "" : "s"}</p>
      </div>
      <div className="h-6 w-6 rounded-full border border-border" style={{ background: cat.color }} />
      <Button size="icon" variant="ghost" onClick={onToggle} title={cat.active ? "Desativar" : "Ativar"}>
        {cat.active ? <Power className="h-4 w-4 text-primary" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
      </Button>
      <Button size="icon" variant="ghost" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CategoryManager() {
  const { categories, refresh } = useCategories();
  const { products } = useProducts();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [deleting, setDeleting] = useState<Category | undefined>();
  const [reassignTo, setReassignTo] = useState<string>("");

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) {
      m[p.category] = (m[p.category] || 0) + 1;
    }
    return m;
  }, [products]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = categories.findIndex((c) => c.id === active.id);
    const newIdx = categories.findIndex((c) => c.id === over.id);
    const reordered = [...categories];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    // persist new display_order
    const updates = reordered.map((c, i) =>
      supabase.from("categories").update({ display_order: i + 1 }).eq("id", c.id),
    );
    await Promise.all(updates);
    refresh();
  };

  const handleToggle = async (c: Category) => {
    await supabase.from("categories").update({ active: !c.active }).eq("id", c.id);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const count = counts[deleting.slug] || 0;
    if (count > 0) {
      if (!reassignTo) { toast.error("Selecione uma categoria de destino"); return; }
      const target = categories.find((c) => c.id === reassignTo);
      if (!target) return;
      await supabase.from("products").update({ category: target.slug, category_id: target.id }).eq("category", deleting.slug);
    }
    const { error } = await supabase.from("categories").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Categoria removida");
    setDeleting(undefined);
    setReassignTo("");
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Categorias ({categories.length})</h2>
        <Button onClick={() => { setEditing(undefined); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Arraste para reordenar. A ordem definida aqui aparece nos filtros da vitrine.
      </p>

      <div className="rounded-lg border border-border overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((c) => (
              <SortableRow
                key={c.id}
                cat={c}
                count={counts[c.slug] || 0}
                onEdit={() => { setEditing(c); setFormOpen(true); }}
                onToggle={() => handleToggle(c)}
                onDelete={() => { setDeleting(c); setReassignTo(""); }}
              />
            ))}
            {categories.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma categoria cadastrada.
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (counts[deleting.slug] || 0) > 0
                ? `Esta categoria possui ${counts[deleting.slug]} produto(s). Selecione outra categoria para realocá-los antes de remover.`
                : "Esta ação é permanente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleting && (counts[deleting.slug] || 0) > 0 && (
            <div className="space-y-1.5">
              <Label>Mover produtos para:</Label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger><SelectValue placeholder="Escolha uma categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.id !== deleting.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
