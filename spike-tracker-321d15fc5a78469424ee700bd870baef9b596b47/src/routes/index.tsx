import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageContainer } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { DAYS_PT } from "@/lib/workout-utils";
import { Calendar, Dumbbell, History, Flame, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const todayISO = today.toISOString().slice(0, 10);

  const { data: workout, isLoading } = useQuery({
    queryKey: ["today-workout", dayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*, exercises(*)")
        .contains("dia_semana", [dayOfWeek])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: todayLog } = useQuery({
    queryKey: ["today-log", todayISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("data", todayISO)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("data, concluido")
        .order("data", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  const completedThisWeek = (stats ?? []).filter((l) => {
    const d = new Date(l.data);
    const diff = (today.getTime() - d.getTime()) / 86400000;
    return diff < 7 && l.concluido;
  }).length;

  const totalCompleted = (stats ?? []).filter((l) => l.concluido).length;

  return (
    <MobileLayout>
      <PageContainer>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {DAYS_PT[dayOfWeek]}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </h1>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            🏐
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-medium">Esta semana</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{completedThisWeek}</p>
            <p className="text-xs text-muted-foreground">treinos</p>
          </div>
          <div className="rounded-2xl bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">concluídos</p>
          </div>
        </div>

        {/* Workout card */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Treino do dia
        </h2>

        {isLoading ? (
          <div className="mt-3 h-48 animate-pulse rounded-2xl bg-card" />
        ) : !workout ? (
          <div className="mt-3 rounded-2xl bg-card p-6 text-center">
            <p className="text-2xl">🌴</p>
            <h3 className="mt-3 text-xl font-bold">Dia de descanso</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aproveite para se recuperar.
            </p>
            <Link to="/history" className="mt-4 inline-block">
              <Button variant="secondary" size="lg" className="rounded-full">
                <History className="mr-2 h-4 w-4" /> Ver histórico
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl bg-card">
            <div
              className="p-5"
              style={{ background: "var(--gradient-primary)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
                {workout.categoria}
              </p>
              <h3 className="mt-1 text-2xl font-bold text-primary-foreground">
                {workout.nome}
              </h3>
              <div className="mt-3 flex items-center gap-4 text-sm font-medium text-primary-foreground/90">
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="h-4 w-4" />
                  {workout.exercises?.length ?? 0} exercícios
                </span>
              </div>
            </div>

            {todayLog && (
              <div className="border-b border-border px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso de hoje</span>
                  <span className="font-semibold">{todayLog.percentual}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${todayLog.percentual}%` }}
                  />
                </div>
              </div>
            )}

            <div className="p-4">
              <Link to="/workout">
                <Button size="lg" className="h-14 w-full rounded-xl text-base font-semibold">
                  {todayLog?.concluido
                    ? "Refazer treino"
                    : todayLog
                      ? "Continuar treino"
                      : "Iniciar treino"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        <Link to="/history" className="mt-3 block">
          <Button variant="ghost" size="lg" className="w-full rounded-xl">
            <History className="mr-2 h-4 w-4" /> Ver histórico
          </Button>
        </Link>
      </PageContainer>
    </MobileLayout>
  );
}
