import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageContainer } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Clock, Target, Repeat, Play } from "lucide-react";
import { getYouTubeId, SECTIONS } from "@/lib/workout-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/workout")({
  component: WorkoutPage,
});

type Exercise = {
  id: string;
  nome: string;
  descricao: string | null;
  series: string | null;
  repeticoes: string | null;
  objetivo: string | null;
  video_url: string | null;
  secao: string;
  ordem: number;
};

function WorkoutPage() {
  const navigate = useNavigate();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayISO = today.toISOString().slice(0, 10);
  const [startedAt] = useState(() => Date.now());
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout-session", dayOfWeek],
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

  const exercises = useMemo<Exercise[]>(
    () =>
      ((workout?.exercises as Exercise[]) ?? []).slice().sort((a, b) => a.ordem - b.ordem),
    [workout],
  );

  const total = exercises.length;
  const completed = exercises.filter((e) => done[e.id]).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  useEffect(() => {
    if (pct === 100) {
      toast.success("Treino 100% — pode finalizar!");
    }
  }, [pct]);

  async function finalize() {
    if (!workout) return;
    setSaving(true);
    const duracao = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const { error } = await supabase.from("workout_logs").insert({
      data: todayISO,
      workout_id: workout.id,
      workout_nome: workout.nome,
      percentual: pct,
      concluido: pct >= 80,
      duracao_min: duracao,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Treino salvo!");
    navigate({ to: "/history" });
  }

  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    for (const ex of exercises) {
      (map[ex.secao] ??= []).push(ex);
    }
    return map;
  }, [exercises]);

  if (isLoading) {
    return (
      <MobileLayout>
        <PageContainer>
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
        </PageContainer>
      </MobileLayout>
    );
  }

  if (!workout) {
    return (
      <MobileLayout>
        <PageContainer>
          <Link to="/">
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
          </Link>
          <p className="mt-8 text-center text-muted-foreground">
            Nenhum treino programado para hoje.
          </p>
        </PageContainer>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Sticky progress header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 px-3">
              <h1 className="truncate text-base font-bold">{workout.nome}</h1>
            </div>
            <span className="text-sm font-bold tabular-nums text-primary">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {completed} de {total} exercícios
          </p>
        </div>
      </div>

      <PageContainer>
        {SECTIONS.filter((s) => grouped[s]?.length).map((secao) => (
          <section key={secao} className="mb-6">
            <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-primary">
              {secao}
            </h2>
            <div className="space-y-3">
              {grouped[secao].map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  ex={ex}
                  done={!!done[ex.id]}
                  onToggle={(v) => setDone((p) => ({ ...p, [ex.id]: v }))}
                />
              ))}
            </div>
          </section>
        ))}

        <Button
          size="lg"
          className="mt-4 h-14 w-full rounded-xl text-base font-bold"
          onClick={finalize}
          disabled={saving || completed === 0}
        >
          {saving ? "Salvando..." : pct === 100 ? "Concluir treino 🏐" : `Salvar (${pct}%)`}
        </Button>
      </PageContainer>
    </MobileLayout>
  );
}

function ExerciseCard({
  ex,
  done,
  onToggle,
}: {
  ex: Exercise;
  done: boolean;
  onToggle: (v: boolean) => void;
}) {
  const [showVideo, setShowVideo] = useState(false);
  const ytId = getYouTubeId(ex.video_url);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card transition-all ${
        done ? "border-primary/40 opacity-70" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => onToggle(!done)}
          className="mt-0.5 shrink-0"
          aria-label="Marcar concluído"
        >
          <Checkbox
            checked={done}
            className="h-6 w-6 rounded-full border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          />
        </button>
        <div className="min-w-0 flex-1">
          <h3
            className={`text-base font-semibold leading-tight ${done ? "line-through" : ""}`}
          >
            {ex.nome}
          </h3>
          {ex.descricao && (
            <p className="mt-1 text-sm text-muted-foreground">{ex.descricao}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {ex.series && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                <Repeat className="h-3 w-3" /> {ex.series} séries
              </span>
            )}
            {ex.repeticoes && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                <Clock className="h-3 w-3" /> {ex.repeticoes}
              </span>
            )}
          </div>

          {ex.objetivo && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span>{ex.objetivo}</span>
            </p>
          )}

          {ex.video_url && (
            <div className="mt-3">
              {!showVideo ? (
                <button
                  onClick={() => setShowVideo(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-accent"
                >
                  <Play className="h-3 w-3 fill-current" /> Ver vídeo
                </button>
              ) : ytId ? (
                <div className="overflow-hidden rounded-xl bg-black">
                  <div className="relative aspect-video">
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={ex.nome}
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <a
                  href={ex.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  Abrir vídeo
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
