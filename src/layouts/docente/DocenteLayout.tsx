import type { ReactNode } from "react";
import {
  PanelLayout,
  type GrupoNavegacion,
} from "../../shared/layouts/PanelLayout";

interface DocenteLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

const grupos: readonly GrupoNavegacion[] = [];

export function DocenteLayout({ children, onLogout }: DocenteLayoutProps) {
  return (
    <PanelLayout
      nombreRol="Docente"
      tituloPanel="Panel del docente"
      rutaInicio="/docente"
      grupos={grupos}
      onLogout={onLogout}
    >
      {children}
    </PanelLayout>
  );
}
