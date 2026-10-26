import { prisma } from "@/lib/prisma";

// Massa de dados do visitante da demo: uma semana de trabalho verossímil,
// sempre relativa a hoje, para a agenda e o dashboard não abrirem vazios.

function at(daysFromToday: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function plusMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Próximo dia útil a partir de hoje + offset (pula sábado e domingo). */
function businessDay(offset: number): number {
  let days = 0;
  let found = 0;
  while (found < offset) {
    days += 1;
    const weekday = (new Date().getDay() + days) % 7;
    if (weekday !== 0 && weekday !== 6) found += 1;
  }
  return days;
}

export async function seedGuestWorkspace(userId: string): Promise<void> {
  const d1 = businessDay(1);
  const d2 = businessDay(2);
  const d3 = businessDay(3);
  const d5 = businessDay(5);

  await prisma.task.createMany({
    data: [
      { userId, title: "Revisar proposta comercial da Acme", description: "Conferir margens e prazo de entrega antes de enviar.", priority: "HIGH", dueDate: at(0, 18) },
      { userId, title: "Responder e-mail do financeiro sobre notas de outubro", priority: "HIGH", dueDate: at(0, 17) },
      { userId, title: "Preparar slides da reunião de resultados", description: "Receita, margem e metas do trimestre.", priority: "MEDIUM", dueDate: at(d1, 12) },
      { userId, title: "Marcar dentista", priority: "LOW", dueDate: at(d3, 12) },
      { userId, title: "Atualizar planilha de metas do time", priority: "MEDIUM", dueDate: at(d2, 18) },
      { userId, title: "Renovar certificado digital", description: "Vence no fim do mês.", priority: "MEDIUM", dueDate: at(d5, 12) },
      { userId, title: "Enviar relatório semanal ao diretor", priority: "HIGH", done: true, dueDate: at(-1, 17) },
      { userId, title: "Aprovar férias do João", priority: "LOW", done: true, dueDate: at(-2, 12) },
    ],
  });

  const daily = at(0, 9, 15);
  const review = at(d1, 14);
  const oneOnOne = at(d2, 11);
  const client = at(d3, 15, 30);
  const planning = at(d5, 10);

  await prisma.event.createMany({
    data: [
      { userId, title: "Daily do time", description: "Alinhamento rápido de 15 minutos.", startAt: daily, endAt: plusMinutes(daily, 15), recurrence: "DAILY", source: "MANUAL" },
      { userId, title: "Almoço com a Carla (marketing)", startAt: at(0, 12, 30), endAt: at(0, 13, 30), source: "MANUAL" },
      { userId, title: "Reunião de resultados do trimestre", description: "Sala 3. Levar os slides.", startAt: review, endAt: plusMinutes(review, 60), source: "MANUAL" },
      { userId, title: "1:1 com a Fernanda", startAt: oneOnOne, endAt: plusMinutes(oneOnOne, 30), source: "MANUAL" },
      { userId, title: "Apresentação para o cliente Acme", description: "Proposta comercial e cronograma.", startAt: client, endAt: plusMinutes(client, 60), source: "MANUAL" },
      { userId, title: "Planejamento do próximo mês", startAt: planning, endAt: plusMinutes(planning, 120), source: "MANUAL" },
      { userId, title: "Aniversário da empresa", startAt: at(d5 + 7, 0), allDay: true, source: "MANUAL" },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        userId,
        title: "Pontos da reunião com a Acme",
        pinned: true,
        content: "- Querem entrega em 45 dias\n- Pediram desconto de 8% no pacote anual\n- Decisor final: Marcos (diretor de operações)\n- Próximo passo: enviar proposta revisada até sexta",
      },
      {
        userId,
        title: "Ideias para o planejamento",
        content: "1. Automatizar o relatório semanal\n2. Treinamento de vendas consultivas\n3. Revisar metas do 4º trimestre com o time",
      },
      {
        userId,
        title: "Como usar a ARIA",
        content: "Fale com a ARIA no chat à direita. Exemplos:\n- \"reunião com o Pedro quinta às 10h\"\n- \"lembrete de pagar a conta de luz amanhã\"\n- \"o que tenho hoje?\"\nEla cria eventos, tarefas e notas por você.",
      },
    ],
  });
}
