import Sidebar from "@/components/sidebar";
import EventNotifications from "@/components/event-notifications";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, overflowY: "auto", minHeight: "100vh" }}>
        {children}
      </main>
      <EventNotifications />
    </>
  );
}
