import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import "./AdminLayout.css";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  function cerrarSesion() {
    setMenuAbierto(false);
    onLogout();
  }

  return (
    <div className="admin-layout">
      {menuAbierto && (
        <button
          className="admin-layout__backdrop"
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside
        id="admin-navegacion"
        className={`admin-layout__sidebar ${
          menuAbierto ? "admin-layout__sidebar--open" : ""
        }`}
      >
        <div className="admin-layout__sidebar-top">
          <strong className="admin-layout__brand">Liceo Santo Toribio</strong>

          <button
            className="admin-layout__close-button"
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          >
            ✕
          </button>
        </div>

        <nav
          className="admin-layout__nav"
          aria-label="Navegación del administrador"
        >
          <Link to="/admin" onClick={() => setMenuAbierto(false)}>
            Inicio
          </Link>

          <Link to="/admin/estudiantes" onClick={() => setMenuAbierto(false)}>
            Estudiantes
          </Link>

          <Link
            to="/admin/matriculas/nueva"
            onClick={() => setMenuAbierto(false)}
          >
            Nueva matrícula
          </Link>
        </nav>

        <div className="admin-layout__sidebar-account">
          <span>Administrador</span>
          <button type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="admin-layout__workspace">
        <header className="admin-layout__header">
          <div className="admin-layout__mobile-heading">
            <button
              className="admin-layout__open-button"
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              aria-controls="admin-navegacion"
              onClick={() => setMenuAbierto(true)}
            >
              ☰
            </button>
            <strong>Liceo Santo Toribio</strong>
          </div>

          <div className="admin-layout__desktop-account">
            <span>Administrador</span>
            <button type="button" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="admin-layout__content">{children}</main>
      </div>
    </div>
  );
}
