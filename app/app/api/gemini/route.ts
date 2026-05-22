import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAriaModel } from "@/lib/gemini";
import { Content } from "@google/generative-ai";

// ─── Executores das funções que a ARIA pode chamar ───────────────────────────

async function executarFuncao(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  switch (name) {
    case "criar_evento": {
      const event = await prisma.event.create({
        data: {
          title: args.title as string,
          description: (args.description as string) ?? null,
          startAt: new Date(args.startAt as string),
          endAt: args.endAt ? new Date(args.endAt as string) : null,
          allDay: (args.allDay as boolean) ?? false,
          source: "MANUAL",
        },
      });
      return { ok: true, id: event.id, title: event.title, startAt: event.startAt.toISOString() };
    }

    case "criar_tarefa": {
      const task = await prisma.task.create({
        data: {
          title: args.title as string,
          description: (args.description as string) ?? null,
          priority: (args.priority as "LOW" | "MEDIUM" | "HIGH") ?? "MEDIUM",
          dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
        },
      });
      return { ok: true, id: task.id, title: task.title };
    }

    case "criar_nota": {
      const note = await prisma.note.create({
        data: {
          title: args.title as string,
          content: (args.content as string) ?? "",
        },
      });
      return { ok: true, id: note.id, title: note.title };
    }

    default:
      return { ok: false, error: `Função desconhecida: ${name}` };
  }
}

// ─── POST /api/gemini ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { message, timezone } = await request.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "message é obrigatório" }, { status: 400 });
  }

  // Timezone do browser do usuário (ex: "America/Sao_Paulo", offset "-03:00")
  const tz = timezone ?? "America/Sao_Paulo";
  const now = new Date();
  const tzOffset = (() => {
    try {
      // Calcula o offset do timezone em horas e formata como +HH:MM ou -HH:MM
      const formatter = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" });
      const parts = formatter.formatToParts(now);
      return parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC";
    } catch {
      return "UTC-3";
    }
  })();

  // Contexto do usuário
  const [tasks, events] = await Promise.all([
    prisma.task.findMany({ where: { done: false }, orderBy: [{ priority: "desc" }, { dueDate: "asc" }], take: 10 }),
    prisma.event.findMany({ where: { startAt: { gte: new Date() } }, orderBy: { startAt: "asc" }, take: 10 }),
  ]);

  const todayStr = now.toLocaleDateString("pt-BR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Data/hora local do usuário formatada com offset para que o Gemini gere ISOs corretos
  const localISOWithOffset = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(now).replace(" ", "T") + tzOffset.replace("GMT", "");

  const taskLines = tasks.length
    ? tasks.map((t) => `- [${t.priority}] ${t.title}${t.dueDate ? ` (prazo: ${new Date(t.dueDate).toLocaleDateString("pt-BR", { timeZone: tz })})` : ""}`).join("\n")
    : "Nenhuma tarefa pendente.";

  const eventLines = events.length
    ? events.map((e) => `- ${new Date(e.startAt).toLocaleString("pt-BR", { timeZone: tz })} — ${e.title}`).join("\n")
    : "Nenhum evento próximo.";

  const systemPrompt = `Você é ARIA, assistente pessoal de trabalho.
Hoje é ${todayStr}.
Data/hora atual do usuário: ${localISOWithOffset} (timezone: ${tz}, offset: ${tzOffset})

REGRA CRÍTICA DE DATAS: Ao gerar datas e horas para as funções, SEMPRE inclua o offset do timezone no ISO 8601.
Exemplo correto: "2026-05-05T09:30:00-03:00" (NÃO use UTC "Z" a menos que o usuário peça explicitamente).
Use o offset ${tzOffset.replace("GMT", "")} em todas as datas geradas.

Quando o usuário pedir para criar algo, use as funções disponíveis para criar diretamente.
Ao interpretar datas relativas ("amanhã", "sexta", "semana que vem"), calcule a partir de hoje.
Após executar uma ação, confirme o que foi criado de forma curta e amigável.
Para perguntas e conversas normais, responda diretamente sem usar funções.
Responda sempre em português.

TAREFAS PENDENTES:
${taskLines}

PRÓXIMOS EVENTOS:
${eventLines}`;

  // Histórico de conversa para manter contexto
  const history = await prisma.aiMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const chatHistory: Content[] = history.reverse().map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  // Inicia o chat com o modelo que tem function calling
  const model = createAriaModel();
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Entendido! Estou pronto para ajudar." }] },
      ...chatHistory,
    ],
  });

  // Envia a mensagem do usuário
  let result = await chat.sendMessage(message);
  let response = result.response;

  // Loop de function calling — Gemini pode encadear múltiplas chamadas
  const actionsExecuted: string[] = [];

  while (response.functionCalls()?.length) {
    const calls = response.functionCalls()!;
    const functionResults = await Promise.all(
      calls.map(async (call) => {
        const output = await executarFuncao(call.name, call.args as Record<string, unknown>);
        actionsExecuted.push(call.name);
        return {
          functionResponse: {
            name: call.name,
            response: output,
          },
        };
      })
    );

    // Devolve os resultados para o Gemini gerar a resposta em linguagem natural
    result = await chat.sendMessage(functionResults);
    response = result.response;
  }

  const reply = response.text();

  // Persiste a conversa
  await prisma.aiMessage.createMany({
    data: [
      { role: "user", content: message },
      { role: "assistant", content: reply },
    ],
  });

  return NextResponse.json({ reply, actionsExecuted });
}

// ─── GET /api/gemini — histórico de mensagens ────────────────────────────────

export async function GET() {
  const messages = await prisma.aiMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return NextResponse.json(messages);
}
