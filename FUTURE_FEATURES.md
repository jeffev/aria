# ARIA — Futuras Funcionalidades

> Ideias e melhorias planejadas, organizadas por área e complexidade.
> Não há ordem de prioridade definida — escolher conforme necessidade.

*Última atualização: 2026-05-02*

---

## IA & Chat

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Briefing matinal** | ARIA gera automaticamente às 08h um resumo do dia (agenda + tarefas prioritárias) usando Gemini, salva no banco e exibe no dashboard | Baixa |
| **Memória de contexto longa** | Resumir histórico antigo com Gemini antes de descartar, mantendo contexto comprimido | Média |
| **Comandos via chat** | ARIA entende "cria tarefa X para amanhã" ou "adiciona evento Y às 15h" e age diretamente | Média |
| **Resumo de reunião** | Usuário cola o conteúdo de uma reunião e ARIA extrai ações, decisões e pontos importantes | Baixa |
| **Modo voz completo** | Resposta da ARIA também em áudio via Web Speech Synthesis API (sem custo) | Baixa |
| **Sugestão de prioridade** | ARIA analisa as tarefas e sugere reordenação com base em prazos e dependências | Média |

---

## Agenda

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Visualização mensal** | Alternar entre visão semanal e mensal | Média |
| **Eventos recorrentes** | Suporte a repetição diária, semanal, mensal | Alta |
| **Arrastar e soltar** | Mover eventos entre dias na visualização semanal | Alta |
| **Export ICS** | Exportar agenda para arquivo `.ics` (compatível com qualquer calendário) | Baixa |
| **Import ICS** | Importar eventos de arquivo `.ics` | Baixa |
| **Lembrete configurável** | Usuário define quantos minutos antes quer ser notificado (atualmente fixo em 15min) | Baixa |
| **Conflito de horário** | Alertar visualmente quando dois eventos se sobrepõem | Média |
| **Categorias de evento** | Tags coloridas (trabalho, pessoal, reunião, etc.) | Média |

---

## Tarefas

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Subtarefas** | Checklist dentro de uma tarefa | Média |
| **Categorias / projetos** | Agrupar tarefas por projeto ou área | Média |
| **Recorrência** | Tarefa que se repete diariamente, semanalmente, etc. | Alta |
| **Estimativa de tempo** | Campo de tempo estimado e tempo gasto | Baixa |
| **Estatísticas de produtividade** | Gráfico de tarefas concluídas por dia/semana | Média |
| **Drag and drop** | Reordenar tarefas manualmente | Alta |
| **Exportar tarefas** | CSV ou Markdown para uso externo | Baixa |

---

## Notas

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Formatação Markdown** | Renderizar markdown no editor (negrito, listas, código) | Média |
| **Busca dentro da nota** | Ctrl+F dentro do editor | Baixa |
| **Tags** | Classificar notas com tags personalizadas | Média |
| **Vincular nota a evento/tarefa** | Relacionar uma nota com um item da agenda ou tarefa | Alta |
| **Templates de nota** | Notas pré-formatadas (reunião, decisão, rascunho) | Baixa |
| **Exportar nota** | Download como `.md` ou `.txt` | Baixa |

---

## Dashboard

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Pomodoro / timer de foco** | Timer 25/5 integrado, sem backend necessário | Baixa |
| **Widgets configuráveis** | Usuário escolhe quais cards exibir e em que ordem | Alta |
| **Modo foco** | Esconde notificações e mostra apenas a tarefa atual | Baixa |
| **Frase motivacional** | ARIA gera uma frase curta personalizada toda manhã | Baixa |
| **Histórico de briefings** | Página com todos os briefings diários gerados | Baixa |
| **Gráfico de produtividade** | Heatmap de tarefas concluídas (estilo GitHub contributions) | Média |

---

## Integrações

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Microsoft Teams** | Reuniões + notificações (requer aprovação TI no Azure AD) | Alta |
| **Discord** | Polling de menções + exibir no painel de notificações | Média |
| **Gmail** | Ler emails não lidos e mostrar resumo no dashboard | Alta |
| **GitHub** | PRs abertos, issues atribuídas, resumo de atividade | Média |
| **Jira / Linear** | Issues atribuídas ao usuário no board atual | Alta |
| **Spotify** | Mostrar o que está tocando e controlar playback | Média |
| **Notion** | Sincronizar tarefas ou notas de um workspace Notion | Alta |
| **Webhook genérico** | Receber eventos de qualquer serviço via POST e exibir como notificação | Média |

---

## Notificações

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Página de notificações** | Listar todas as notificações recebidas, marcar como lidas, filtrar por fonte | Baixa |
| **Resumo de não lidas** | Badge animado na sidebar com contagem de não lidas | Baixa |
| **Preferências de notificação** | Usuário configura quais tipos quer receber e por qual canal | Média |
| **Push notifications (PWA)** | Notificações mesmo com o browser fechado via Service Worker | Alta |
| **Silenciar por horário** | Não notificar fora do horário de trabalho | Baixa |

---

## Configurações & Personalização

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Nome do usuário** | Personalizar o cumprimento do dashboard | Baixa |
| **Fuso horário** | Configurar timezone manualmente (hoje usa o do browser) | Baixa |
| **Tema claro** | Toggle dark/light mode | Baixa |
| **Cor de destaque** | Trocar a cor accent (atualmente roxo #6366f1) | Baixa |
| **Horário de trabalho** | Definir início/fim do expediente para filtrar notificações | Baixa |
| **Desconectar integrações** | Botão para revogar tokens do Google, Teams, Discord | Baixa |

---

## Infraestrutura & Qualidade

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Auth real** | Login com Supabase Auth (e-mail + senha ou Google OAuth) | Média |
| **Multi-usuário** | Isolar dados por usuário (adicionar userId em todos os models) | Alta |
| **Tratamento de erro global** | Middleware de error handling nas API routes + UI de fallback | Média |
| **Rate limiting** | Proteger `/api/gemini` de uso excessivo | Baixa |
| **Testes E2E** | Playwright cobrindo fluxos críticos (criar tarefa, criar evento) | Alta |
| **CI/CD** | GitHub Actions rodando build e testes a cada PR | Média |
| **Backup do banco** | Script de dump do PostgreSQL agendado (local e cloud) | Baixa |
| **PWA** | Instalar como app no desktop/celular, funcionar offline parcialmente | Alta |

---

## Fase 2 — Arduino

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Display OLED** | Mostrar próximo evento e hora atual no hardware | Média |
| **LED de status** | Verde = sem reunião, amarelo = reunião em breve, vermelho = em reunião | Baixa |
| **Botão físico** | Pressionar para marcar tarefa atual como feita | Média |
| **Buzzer de alerta** | Tocar quando reunião está próxima | Baixa |
| **Endpoint `/api/status`** | Retorna JSON compacto com próximo evento + tarefa ativa para o Arduino consumir | Baixa |

---

## Legenda de Complexidade

| Nível | Significado |
|-------|-------------|
| **Baixa** | Menos de meio dia de trabalho, sem dependências novas |
| **Média** | 1–2 dias, pode precisar de novo model ou integração |
| **Alta** | Mais de 2 dias, mudança arquitetural ou integração complexa |
