import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, Users } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  order_id: string;
  order_number: number | null;
  customer_name: string | null;
};

const Stars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
      />
    ))}
  </div>
);

const ReviewsManager = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: rev, error } = await supabase
        .from("order_reviews")
        .select("id, rating, comment, created_at, order_id")
        .order("created_at", { ascending: false });
      if (error) {
        setLoading(false);
        return;
      }
      const orderIds = Array.from(new Set((rev ?? []).map((r) => r.order_id)));
      let ordersMap: Record<string, { order_number: number | null; customer_name: string | null }> = {};
      if (orderIds.length) {
        const { data: ords } = await supabase
          .from("orders")
          .select("id, order_number, customer_name")
          .in("id", orderIds);
        (ords ?? []).forEach((o: any) => {
          ordersMap[o.id] = { order_number: o.order_number, customer_name: o.customer_name };
        });
      }
      if (!active) return;
      setReviews(
        (rev ?? []).map((r: any) => ({
          ...r,
          order_number: ordersMap[r.order_id]?.order_number ?? null,
          customer_name: ordersMap[r.order_id]?.customer_name ?? null,
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const withComment = reviews.filter((r) => r.comment && r.comment.trim().length > 0).length;
    return { total, avg, withComment };
  }, [reviews]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Total de avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" /> Média geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <span className="text-yellow-400">⭐</span>
              {summary.avg.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Com comentário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.withComment}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{r.customer_name || "Cliente"}</div>
                      <div className="text-xs text-muted-foreground">
                        Pedido #{r.order_number ?? "—"} •{" "}
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && r.comment.trim() && (
                    <p className="text-sm text-foreground/90 italic">"{r.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsManager;
