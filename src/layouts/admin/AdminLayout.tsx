import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { Boton } from "../../shared/components/Boton";
import "./AdminLayout.css";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

const grupos = [
  {
    titulo: "Gestión escolar",
    enlaces: [
      { ruta: "/admin/estudiantes", texto: "Estudiantes" },
      { ruta: "/admin/matriculas/nueva", texto: "Nueva matrícula" },
      { ruta: "/admin/matriculas", texto: "Matrículas registradas" },
      { ruta: "/admin/cursos", texto: "Cursos y competencias" },
      { ruta: "/admin/boletas", texto: "Boletas de notas" },
    ],
  },
  {
    titulo: "Personal",
    enlaces: [
      { ruta: "/admin/docentes", texto: "Docentes" },
      { ruta: "/admin/pagos-docentes", texto: "Pagos a docentes" },
    ],
  },
  {
    titulo: "Finanzas",
    enlaces: [
      { ruta: "/admin/pensiones", texto: "Pensiones" },
      {
        ruta: "/admin/movimientos-financieros",
        texto: "Movimientos adicionales",
      },
      {
        ruta: "/admin/reportes-financieros",
        texto: "Reportes financieros",
      },
    ],
  },
];

export function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const abrirRef = useRef<HTMLButtonElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  const titulo =
    grupos
      .flatMap((grupo) => grupo.enlaces)
      .find((enlace) => enlace.ruta === pathname)?.texto ?? "Inicio";

  useEffect(() => {
    if (!menuAbierto) return;

    const sidebar = sidebarRef.current;
    const workspace = workspaceRef.current;
    const botonAbrir = abrirRef.current;

    if (!sidebar || !workspace) return;

    const overflowAnterior = document.body.style.overflow;
    const inertAnterior = workspace.inert;

    document.body.style.overflow = "hidden";
    workspace.inert = true;
    cerrarRef.current?.focus();

    function manejarTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setMenuAbierto(false);
        return;
      }

      if (evento.key !== "Tab" || !sidebar) return;

      const elementos = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), [tabindex="0"]',
        ),
      ).filter((elemento) => elemento.getClientRects().length > 0);

      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];

      if (!primero || !ultimo) return;

      if (
        evento.shiftKey &&
        (document.activeElement === primero ||
          !sidebar.contains(document.activeElement))
      ) {
        evento.preventDefault();
        ultimo.focus();
      } else if (
        !evento.shiftKey &&
        (document.activeElement === ultimo ||
          !sidebar.contains(document.activeElement))
      ) {
        evento.preventDefault();
        primero.focus();
      }
    }

    const escritorio = window.matchMedia("(min-width: 1024px)");

    function manejarTamano() {
      if (escritorio.matches) setMenuAbierto(false);
    }

    document.addEventListener("keydown", manejarTeclado);
    escritorio.addEventListener("change", manejarTamano);
    manejarTamano();

    return () => {
      document.body.style.overflow = overflowAnterior;
      workspace.inert = inertAnterior;

      document.removeEventListener("keydown", manejarTeclado);
      escritorio.removeEventListener("change", manejarTamano);

      if (botonAbrir && botonAbrir.getClientRects().length > 0) {
        botonAbrir.focus();
      }
    };
  }, [menuAbierto]);

  function cerrarSesion() {
    setMenuAbierto(false);
    onLogout();
  }

  return (
    <div className="admin-layout">
      <a
        className="admin-layout__saltar"
        href="#admin-contenido"
        hidden={menuAbierto}
      >
        Ir al contenido
      </a>

      {menuAbierto && (
        <div
          className="admin-layout__backdrop"
          aria-hidden="true"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        id="admin-navegacion"
        className={`admin-layout__sidebar ${
          menuAbierto ? "admin-layout__sidebar--open" : ""
        }`}
        aria-label="Menú del administrador"
      >
        <div className="admin-layout__sidebar-top">
          <strong className="admin-layout__brand">Liceo Santo Toribio</strong>

          <button
            ref={cerrarRef}
            className="admin-layout__close-button"
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <nav
          className="admin-layout__nav"
          aria-label="Navegación del administrador"
        >
          <NavLink to="/admin" end onClick={() => setMenuAbierto(false)}>
            Inicio
          </NavLink>

          {grupos.map((grupo) => (
            <div className="admin-layout__grupo" key={grupo.titulo}>
              <h2>{grupo.titulo}</h2>

              <ul>
                {grupo.enlaces.map((enlace) => (
                  <li key={enlace.ruta}>
                    <NavLink
                      to={enlace.ruta}
                      end
                      onClick={() => setMenuAbierto(false)}
                    >
                      {enlace.texto}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-layout__sidebar-account">
          <span>Administrador</span>
          <Boton onClick={cerrarSesion}>Cerrar sesión</Boton>
        </div>
      </aside>

      <div ref={workspaceRef} className="admin-layout__workspace">
        <header className="admin-layout__header">
          <div className="admin-layout__heading">
            <button
              ref={abrirRef}
              className="admin-layout__open-button"
              type="button"
              aria-expanded={menuAbierto}
              aria-controls="admin-navegacion"
              onClick={() => setMenuAbierto(true)}
            >
              <span aria-hidden="true">☰</span>
              <span>Menú</span>
            </button>

            <div>
              <p className="admin-layout__contexto">Panel del administrador</p>
              <strong>{titulo}</strong>
            </div>
          </div>

          <div className="admin-layout__desktop-account">
            <span>Administrador</span>
            <Boton onClick={cerrarSesion}>Cerrar sesión</Boton>
          </div>
        </header>

        <main
          id="admin-contenido"
          className="admin-layout__content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
