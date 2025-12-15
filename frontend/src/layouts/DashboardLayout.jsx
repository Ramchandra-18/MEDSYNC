import { Link } from "react-router-dom";

export default function DashboardLayout({ role, menuItems, children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-700 text-white p-4">
        <h2 className="text-2xl font-bold mb-6 capitalize">{role} Panel</h2>
        <nav className="space-y-2">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className="block px-3 py-2 rounded hover:bg-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
