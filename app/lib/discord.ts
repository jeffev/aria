const DISCORD_BASE = "https://discord.com/api/v10";

const headers = {
  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
  "Content-Type": "application/json",
};

export async function getDiscordMentions(channelIds: string[]) {
  const mentions: Array<{
    id: string;
    content: string;
    channelId: string;
    timestamp: string;
  }> = [];

  const userId = process.env.DISCORD_USER_ID!;

  for (const channelId of channelIds) {
    const res = await fetch(
      `${DISCORD_BASE}/channels/${channelId}/messages?limit=50`,
      { headers }
    );
    if (!res.ok) continue;

    const messages = await res.json();
    const myMentions = messages.filter(
      (m: { mentions?: { id: string }[]; content: string }) =>
        m.mentions?.some((u: { id: string }) => u.id === userId)
    );

    mentions.push(
      ...myMentions.map((m: { id: string; content: string; timestamp: string }) => ({
        id: m.id,
        content: m.content,
        channelId,
        timestamp: m.timestamp,
      }))
    );
  }

  return mentions;
}
