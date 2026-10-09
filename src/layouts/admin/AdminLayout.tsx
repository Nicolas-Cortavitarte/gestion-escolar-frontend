import type { ReactNode } from "react";
import {
  PanelLayout,
  type GrupoNavegacion,
} from "../../shared/layouts/PanelLayout";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

const grupos: readonly GrupoNavegacion[] = [
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
  return (
    <PanelLayout
      nombreRol="Administrador"
      tituloPanel="Panel del administrador"
      rutaInicio="/admin"
      grupos={grupos}
      onLogout={onLogout}
    >
      {children}
    </PanelLayout>
  );
}
