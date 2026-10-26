-- Criação da tabela de atividades (rode no SQL Editor do Supabase)
create table if not exists public.atividades (
  id            uuid primary key default gen_random_uuid(), -- Código da atividade (gerado pelo banco)
  titulo        text not null,                              -- Título (texto curto)
  descricao     text not null,                              -- Descrição (texto longo)
  data_termino  date not null,                              -- Data limite
  created_at    timestamptz not null default now()          -- Data de criação do registro
);

-- Habilita Row Level Security (obrigatório no Supabase)
alter table public.atividades enable row level security;

-- Políticas liberando INSERT e SELECT para a chave pública (anon) -- adequado para o desafio
create policy "anon pode inserir atividades"
  on public.atividades for insert to anon with check (true);

create policy "anon pode listar atividades"
  on public.atividades for select to anon using (true);
