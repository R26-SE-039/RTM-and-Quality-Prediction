import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f3f4f9]">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-10 py-8">{children}</main>
    </div>
  );
}
