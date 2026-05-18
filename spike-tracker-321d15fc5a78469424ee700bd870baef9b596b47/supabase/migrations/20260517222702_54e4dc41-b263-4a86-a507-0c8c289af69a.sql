
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dia_semana INTEGER[] NOT NULL DEFAULT '{}',
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  secao TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  series TEXT,
  repeticoes TEXT,
  objetivo TEXT,
  video_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  workout_nome TEXT,
  percentual INTEGER NOT NULL DEFAULT 0,
  concluido BOOLEAN NOT NULL DEFAULT false,
  duracao_min INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_workout ON public.exercises(workout_id, ordem);
CREATE INDEX idx_logs_data ON public.workout_logs(data DESC);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Personal single-user app: open access
CREATE POLICY "public all workouts" ON public.workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all exercises" ON public.exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all logs" ON public.workout_logs FOR ALL USING (true) WITH CHECK (true);
