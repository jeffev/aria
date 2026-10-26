import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAriaModel } from "@/lib/gemini";
import { getAuthenticatedUserId, unauthorized } from "@/lib/api-auth";
import { resolveGeminiKey } from "@/lib/user-ai-key";
import { consumeDemoAi, demoAiExhaustedReply, demoAiRemaining } from "@/lib/demo-ai-quota";
import { isOverItemLimit, itemLimitMessage, trimChatHistory, type ItemKind } from "@/lib/demo";
import { isRateLimited } from "@/lib/rate-limit";
import { Content } from "@google/generative-ai";

const MAX_MESSAGE_LENGTH = 4000;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

function validTimezone(tz: unknown): string {
  if (typeof tz !== "string") return "America/Sao_Paulo";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "America/Sao_Paulo";
  }
}

async function executarFuncao(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  const kindByFunction: Record<string, ItemKind> = {
    criar_evento: "event",
    criar_tarefa: "task",
    criar_nota: "note",
  };
  const kind = kindByFunction[name];
  if (kind && (await isOverItemLimit(kind, userId))) {
    return { ok: false, error: itemLimitMessage() };
  }

  switch (name) {
    case "criar_evento": {
      const event = await prisma.event.create({
        data: {
          userId,
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
          userId,
          title: args.title as string,
          description: (args.description as string) ?? null,
          priority: PRIORITIES.find((p) => p === args.priority) ?? "MEDIUM",
          dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
        },
      });
      return { ok: true, id: task.id, title: task.title };
    }

    case "criar_nota": {
      const note = await prisma.note.create({
        data: {
          userId,
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

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  if (isRateLimited(`gemini:${userId}`, 20, 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas mensagens seguidas.", reply: "Calma aí: espere um minuto e tente de novo." },
      { status: 429 }
    );
  }

  const resolved = await resolveGeminiKey(userId);
  if (!resolved) {
    return NextResponse.json(
      {
        error: "Configure sua chave do Gemini em Configurações para conversar com a ARIA.",
        reply: "Para conversar comigo, cadastre sua chave gratuita do Gemini em Configurações (aistudio.google.com/apikey).",
      },
      { status: 402 }
    );
  }
  if (resolved.source === "demo" && !consumeDemoAi(userId)) {
    return NextResponse.json(
      { error: "Cota de IA da demonstração esgotada.", reply: demoAiExhaustedReply() },
      { status: 429 }
    );
  }
  const apiKey = resolved.apiKey;

  const { message, timezone } = await request.json();
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message é obrigatório" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Mensagem longa demais.", reply: `Mande mensagens de até ${MAX_MESSAGE_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  // Vai para Intl e para o prompt: só aceita fuso que o Intl reconhece.
  const tz = validTimezone(timezone);
  const now = new Date();
  const tzOffset = (() => {
    try {
      const formatter = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" });
      const parts = formatter.formatToParts(now);
      return parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC";
    } catch {
      return "UTC-3";
    }
  })();

  const [tasks, events] = await Promise.all([
    prisma.task.findMany({
      where: { userId, done: false },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 10,
    }),
    prisma.event.findMany({
      where: { userId, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 10,
    }),
  ]);

  const todayStr = now.toLocaleDateString("pt-BR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" });

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

  const history = await prisma.aiMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const chatHistory: Content[] = history.reverse().map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const model = createAriaModel(apiKey);
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Entendido! Estou pronto para ajudar." }] },
      ...chatHistory,
    ],
  });

  const actionsExecuted: string[] = [];
  let reply: string;
  try {
    let result = await chat.sendMessage(message);
    let response = result.response;

    while (response.functionCalls()?.length) {
      const calls = response.functionCalls()!;
      const functionResults = await Promise.all(
        calls.map(async (call) => {
          const output = await executarFuncao(call.name, call.args as Record<string, unknown>, userId);
          actionsExecuted.push(call.name);
          return { functionResponse: { name: call.name, response: output } };
        })
      );

      result = await chat.sendMessage(functionResults);
      response = result.response;
    }

    reply = response.text();
  } catch (error) {
    console.error("Gemini request failed:", error);
    return NextResponse.json(
      {
        error: "Falha ao falar com o Gemini.",
        reply: "Não consegui falar com o Gemini. Confira sua chave em Configurações e tente de novo.",
      },
      { status: 502 }
    );
  }

  await prisma.aiMessage.createMany({
    data: [
      { userId, role: "user", content: message },
      { userId, role: "assistant", content: reply },
    ],
  });
  await trimChatHistory(userId);

  return NextResponse.json({
    reply,
    actionsExecuted,
    demoAi: resolved.source === "demo" ? { remaining: demoAiRemaining(userId) } : null,
  });
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const messages = await prisma.aiMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  return NextResponse.json(messages);
}
