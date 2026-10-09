import type { ReactNode } from "react";
import "./BadgeEstado.css";

interface BadgeEstadoProps {
  children: ReactNode;
  variante: "exito" | "error" | "pendiente" | "neutro";
}

export function BadgeEstado({ children, variante }: BadgeEstadoProps) {
  return (
    <span className={`badge-estado badge-estado--${variante}`}>{children}</span>
  );
}
