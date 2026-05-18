import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout, PageContainer } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Pencil, ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { SECTIONS } from "@/lib/workout-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/edit")({
  component: EditPage,
});

type Exercise = {
  id: string;
  workout_id: string;
  secao: string;
  nome: string;
  descricao: string | null;
  series: string | null;
  repeticoes: string | null;
  objetivo: string | null;
  video_url: string | null;
  ordem: number;
};

function EditPage() {
  const qc = useQueryClient();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const { data: workouts } = useQuery({
    queryKey: ["all-workouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeId = selectedWorkout ?? workouts?.[0]?.id ?? null;

  const { data: exercises } = useQuery({
    queryKey: ["edit-exercises", activeId],
    queryFn: async () => {
      if (!activeId) return [];
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("workout_id", activeId)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Exercise[];
    },
    enabled: !!activeId,
  });

  async function move(ex: Exercise, dir: -1 | 1) {
    const list = exercises ?? [];
    const idx = list.findIndex((e) => e.id === ex.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("exercises").update({ ordem: swap.ordem }).eq("id", ex.id),
      supabase.from("exercises").update({ ordem: ex.ordem }).eq("id", swap.id),
    ]);
    qc.invalidateQueries({ queryKey: ["edit-exercises", activeId] });
  }

  async function remove(id: string) {
    if (!confirm("Remover exercício?")) return;
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) toast.error("Erro");
    else {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["edit-exercises", activeId] });
    }
  }

  function addNew() {
    if (!activeId) return;
    const maxOrdem = Math.max(0, ...(exercises ?? []).map((e) => e.ordem));
    setEditing({
      id: "",
      workout_id: activeId,
      secao: "Parte principal",
      nome: "",
      descricao: "",
      series: "",
      repeticoes: "",
      objetivo: "",
      video_url: "",
      ordem: maxOrdem + 1,
    });
  }

  return (
    <MobileLayout>
      <PageContainer>
        <Link to="/">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Editar treinos</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste exercícios, vídeos e ordem.
        </p>

        {/* Workout selector */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {workouts?.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWorkout(w.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeId === w.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {w.nome}
            </button>
          ))}
        </div>

        <Button
          onClick={addNew}
          variant="secondary"
          className="mt-4 w-full rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar exercício
        </Button>

        <div className="mt-4 space-y-2">
          {exercises?.map((ex, idx) => (
            <div
              key={ex.id}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => move(ex, -1)}
                    disabled={idx === 0}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(ex, 1)}
                    disabled={idx === (exercises?.length ?? 0) - 1}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {ex.secao}
                  </p>
                  <p className="truncate text-sm font-semibold">{ex.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ex.series ? `${ex.series}× ` : ""}
                    {ex.repeticoes ?? ""}
                  </p>
                </div>
                <button
                  onClick={() => setEditing(ex)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(ex.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <ExerciseEditDialog
            ex={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              qc.invalidateQueries({ queryKey: ["edit-exercises", activeId] });
            }}
          />
        )}
      </PageContainer>
    </MobileLayout>
  );
}

function ExerciseEditDialog({
  ex,
  onClose,
  onSaved,
}: {
  ex: Exercise;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(ex);
  const [saving, setSaving] = useState(false);
  const isNew = !ex.id;

  async function save() {
    if (!form.nome.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    setSaving(true);
    const payload = {
      workout_id: form.workout_id,
      secao: form.secao,
      nome: form.nome,
      descricao: form.descricao,
      series: form.series,
      repeticoes: form.repeticoes,
      objetivo: form.objetivo,
      video_url: form.video_url,
      ordem: form.ordem,
    };
    const { error } = isNew
      ? await supabase.from("exercises").insert(payload)
      : await supabase.from("exercises").update(payload).eq("id", ex.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Salvo");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo exercício" : "Editar exercício"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Nome">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Field>
          <Field label="Seção">
            <Select
              value={form.secao}
              onValueChange={(v) => setForm({ ...form, secao: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Descrição">
            <Textarea
              rows={2}
              value={form.descricao ?? ""}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Séries">
              <Input
                value={form.series ?? ""}
                onChange={(e) => setForm({ ...form, series: e.target.value })}
                placeholder="3"
              />
            </Field>
            <Field label="Reps / tempo">
              <Input
                value={form.repeticoes ?? ""}
                onChange={(e) => setForm({ ...form, repeticoes: e.target.value })}
                placeholder="10"
              />
            </Field>
          </div>
          <Field label="Objetivo">
            <Textarea
              rows={2}
              value={form.objetivo ?? ""}
              onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
            />
          </Field>
          <Field label="URL do vídeo (YouTube)">
            <Input
              value={form.video_url ?? ""}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
