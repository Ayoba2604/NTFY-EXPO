const NTFY_TOPIC = process.env.EXPO_PUBLIC_NTFY_TOPIC;

// Envia a notificação via HTTP POST para o ntfy.sh
// Retorna true/false (não lança erro, para não derrubar o fluxo de cadastro)
export async function enviarNotificacaoNtfy({ titulo, dataTerminoBR }) {
  try {
    const response = await fetch(`https://ntfy.sh/${encodeURIComponent(NTFY_TOPIC)}`, {
      method: 'POST',
      headers: {
        // Headers HTTP só aceitam caracteres simples (sem acentos), por isso o título é fixo
        Title: 'Nova tarefa cadastrada',
        Priority: 'default',
        Tags: 'memo',
      },
      // O corpo aceita UTF-8 (acentos ok) e leva as informações obrigatórias
      body: `Título: ${titulo}\nData de término: ${dataTerminoBR}`,
    });
    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar NTFY:', error);
    return false;
  }
}
