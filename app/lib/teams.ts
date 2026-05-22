const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function getAccessToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: process.env.MICROSOFT_REFRESH_TOKEN!,
        scope: "Calendars.Read Chat.Read",
      }),
    }
  );
  const data = await res.json();
  return data.access_token;
}

export async function getTeamsEvents(days = 7) {
  const token = await getAccessToken();
  const now = new Date().toISOString();
  const end = new Date(Date.now() + days * 86400000).toISOString();

  const res = await fetch(
    `${GRAPH_BASE}/me/calendarView?startDateTime=${now}&endDateTime=${end}&$select=subject,start,end,onlineMeeting&$orderby=start/dateTime`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.value ?? [];
}

export async function getTeamsNotifications() {
  const token = await getAccessToken();
  const res = await fetch(`${GRAPH_BASE}/me/chats?$expand=lastMessagePreview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.value ?? [];
}
