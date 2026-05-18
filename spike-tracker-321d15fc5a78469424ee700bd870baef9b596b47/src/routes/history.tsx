import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageContainer } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const { data: logs, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function remove(id: string) {
    const { error } = await supabase.from("workout_logs").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["history"] });
    }
  }

  return (
    <MobileLayout>
      <PageContainer>
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Histórico</h1>
        <p className="text-sm text-muted-foreground">Todos os treinos registrados.</p>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <>
              <div className="h-24 animate-pulse rounded-2xl bg-card" />
              <div className="h-24 animate-pulse rounded-2xl bg-card" />
            </>
          )}

          {!isLoading && (logs?.length ?? 0) === 0 && (
            <div className="rounded-2xl bg-card p-8 text-center">
              <p className="text-4xl">📋</p>
              <p className="mt-3 font-semibold">Nenhum treino ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Conclua seu primeiro treino para vê-lo aqui.
              </p>
            </div>
          )}

          {logs?.map((log) => {
            const d = new Date(log.data + "T00:00:00");
            return (
              <div
                key={log.id}
                className="overflow-hidden rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {d.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    <h3 className="mt-1 truncate text-base font-semibold">
                      {log.workout_nome ?? "Treino"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.concluido && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <CheckCircle2 className="h-3 w-3" /> Concluído
                      </span>
                    )}
                    <button
                      onClick={() => remove(log.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {log.duracao_min != null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {log.duracao_min} min
                      </span>
                    )}
                    <span className="font-semibold text-foreground">
                      {log.percentual}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${log.percentual}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </MobileLayout>
  );
}
