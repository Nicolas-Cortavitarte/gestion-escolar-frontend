import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { Boton } from "../components/Boton";
import "./PanelLayout.css";

interface EnlacePanel {
  ruta: string;
  texto: string;
}

export interface GrupoNavegacion {
  titulo: string;
  enlaces: readonly EnlacePanel[];
}

interface PanelLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  nombreRol: string;
  tituloPanel: string;
  rutaInicio: string;
  grupos: readonly GrupoNavegacion[];
}

export function PanelLayout({
  children,
  onLogout,
  nombreRol,
  tituloPanel,
  rutaInicio,
  grupos,
}: PanelLayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const abrirRef = useRef<HTMLButtonElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const identificador = useId();
  const navegacionId = `${identificador}-navegacion`;
  const contenidoId = `${identificador}-contenido`;

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

      const focoFueraDelMenu = !sidebar.contains(document.activeElement);

      if (
        evento.shiftKey &&
        (document.activeElement === primero || focoFueraDelMenu)
      ) {
        evento.preventDefault();
        ultimo.focus();
      } else if (
        !evento.shiftKey &&
        (document.activeElement === ultimo || focoFueraDelMenu)
      ) {
        evento.preventDefault();
        primero.focus();
      }
    }

    const escritorio = window.matchMedia("(min-width: 1024px)");

    function manejarTamano(evento: MediaQueryListEvent) {
      if (evento.matches) setMenuAbierto(false);
    }

    document.addEventListener("keydown", manejarTeclado);
    escritorio.addEventListener("change", manejarTamano);

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

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  function cerrarSesion() {
    cerrarMenu();
    onLogout();
  }

  return (
    <div className="panel-layout">
      <a
        className="panel-layout__saltar"
        href={`#${contenidoId}`}
        hidden={menuAbierto}
      >
        Ir al contenido
      </a>

      {menuAbierto && (
        <div
          className="panel-layout__backdrop"
          aria-hidden="true"
          onClick={cerrarMenu}
        />
      )}

      <aside
        ref={sidebarRef}
        id={navegacionId}
        className={`panel-layout__sidebar ${
          menuAbierto ? "panel-layout__sidebar--open" : ""
        }`}
        aria-label={`Menú: ${nombreRol}`}
      >
        <div className="panel-layout__sidebar-top">
          <strong className="panel-layout__brand">Liceo Santo Toribio</strong>

          <button
            ref={cerrarRef}
            className="panel-layout__close-button"
            type="button"
            aria-label="Cerrar menú"
            onClick={cerrarMenu}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <nav
          className="panel-layout__nav"
          aria-label={`Navegación: ${nombreRol}`}
        >
          <NavLink to={rutaInicio} end onClick={cerrarMenu}>
            Inicio
          </NavLink>

          {grupos.map((grupo) => (
            <div className="panel-layout__grupo" key={grupo.titulo}>
              <h2>{grupo.titulo}</h2>

              <ul>
                {grupo.enlaces.map((enlace) => (
                  <li key={enlace.ruta}>
                    <NavLink to={enlace.ruta} end onClick={cerrarMenu}>
                      {enlace.texto}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="panel-layout__sidebar-account">
          <span>{nombreRol}</span>
          <Boton onClick={cerrarSesion}>Cerrar sesión</Boton>
        </div>
      </aside>

      <div ref={workspaceRef} className="panel-layout__workspace">
        <header className="panel-layout__header">
          <div className="panel-layout__heading">
            <button
              ref={abrirRef}
              className="panel-layout__open-button"
              type="button"
              aria-expanded={menuAbierto}
              aria-controls={navegacionId}
              onClick={() => setMenuAbierto(true)}
            >
              <span aria-hidden="true">☰</span>
              <span>Menú</span>
            </button>

            <div>
              <p className="panel-layout__contexto">{tituloPanel}</p>
              <strong>{titulo}</strong>
            </div>
          </div>

          <div className="panel-layout__desktop-account">
            <span>{nombreRol}</span>
            <Boton onClick={cerrarSesion}>Cerrar sesión</Boton>
          </div>
        </header>

        <main id={contenidoId} className="panel-layout__content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
