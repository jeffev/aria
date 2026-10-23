import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType } from "@google/generative-ai";


// ─── Definições das funções que a ARIA pode executar ─────────────────────────

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "criar_evento",
    description: "Cria um evento, reunião ou compromisso na agenda do usuário.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Título do evento ou reunião" },
        description: { type: SchemaType.STRING, description: "Descrição ou detalhes opcionais" },
        startAt: { type: SchemaType.STRING, description: "Data e hora de início em ISO 8601. Use a data de hoje como referência se o usuário disser 'amanhã', 'sexta', etc." },
        endAt: { type: SchemaType.STRING, description: "Data e hora de fim em ISO 8601 (opcional)" },
        allDay: { type: SchemaType.BOOLEAN, description: "true se for evento de dia inteiro, sem horário específico" },
        recurrence: { type: SchemaType.STRING, description: "Recorrência do evento: NONE (padrão), DAILY (todo dia), WEEKLY (toda semana no mesmo dia), MONTHLY (todo mês no mesmo dia), YEARLY (todo ano). Use quando o usuário disser 'todo dia', 'toda semana', 'toda segunda', 'mensalmente', etc." },
        recurrenceEnd: { type: SchemaType.STRING, description: "Data de término da recorrência em ISO 8601 (opcional). Use quando o usuário definir até quando o evento se repete." },
      },
      required: ["title", "startAt"],
    },
  },
  {
    name: "criar_tarefa",
    description: "Cria uma tarefa, lembrete ou item de to-do para o usuário.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Título da tarefa ou lembrete" },
        description: { type: SchemaType.STRING, description: "Detalhes opcionais" },
        priority: { type: SchemaType.STRING, description: "Prioridade da tarefa: use 'LOW' para baixa, 'MEDIUM' para média ou 'HIGH' para alta. Lembretes de saúde/medicamento = HIGH." },
        dueDate: { type: SchemaType.STRING, description: "Data limite em ISO 8601 (opcional)" },
      },
      required: ["title"],
    },
  },
  {
    name: "criar_nota",
    description: "Cria uma nota ou anotação livre para o usuário.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Título da nota" },
        content: { type: SchemaType.STRING, description: "Conteúdo completo da nota" },
      },
      required: ["title"],
    },
  },
];

export const ariaTools: Tool[] = [{ functionDeclarations }];

// ─── Modelo com function calling ─────────────────────────────────────────────

export function createAriaModel(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: ariaTools,
  });
}

// ─── Modelo simples (sem tools) — para uso interno ───────────────────────────

export async function askGemini(apiKey: string, prompt: string, context?: string): Promise<string> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const fullPrompt = context ? `${context}

---

Usuário: ${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}
