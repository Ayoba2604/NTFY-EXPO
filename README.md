<p align="center">
  <img src="assets/banner.svg" alt="To-Do List App - Expo Go, Supabase e NTFY" width="100%">
</p>

# To-Do List — Expo Go + Supabase + NTFY

## 1. Criar o projeto e instalar dependências
```bash
npx create-expo-app todo-app --template blank
cd todo-app
npx expo install @supabase/supabase-js react-native-url-polyfill @react-native-community/datetimepicker
```
Substitua o `App.js` gerado e copie a pasta `lib/` (`supabase.js` e `ntfy.js`) deste projeto.

## 2. Criar a tabela no Supabase
1. Crie um projeto em https://supabase.com
2. Abra **SQL Editor**, cole o conteúdo de `supabase.sql` e clique em **Run**.

## 3. Variáveis de ambiente
Copie `.env.example` para `.env` na raiz do projeto:
| Variável | Onde encontrar |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API > Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API > anon public key |
| `EXPO_PUBLIC_NTFY_TOPIC` | Qualquer nome único e difícil de adivinhar (tópicos do ntfy.sh são públicos) |

## 4. Receber as notificações
- Instale o app **ntfy** no celular (ou abra https://ntfy.sh/SEU_TOPICO no navegador) e assine o mesmo tópico do `.env`.

## 5. Executar
```bash
npx expo start -c
```
Escaneie o QR Code com o **Expo Go**. (Use `-c` sempre que alterar o `.env`.)

## Fluxo
1. Usuário preenche título, descrição e data de término.
2. App faz `INSERT` na tabela `atividades` (id e created_at gerados pelo banco).
3. Só após o sucesso, envia `POST` para `https://ntfy.sh/<tópico>` com título e data de término.