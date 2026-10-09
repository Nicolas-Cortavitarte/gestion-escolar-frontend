import type { ButtonHTMLAttributes } from "react";
import "../../styles/botones.css";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "principal" | "secundario";
  cargando?: boolean;
  textoCargando?: string;
}

export function Boton({
  variante = "secundario",
  cargando = false,
  textoCargando = "Guardando...",
  disabled,
  type = "button",
  className = "",
  children,
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`boton boton--${variante} ${className}`.trim()}
      disabled={disabled || cargando}
      aria-busy={cargando}
    >
      {cargando ? textoCargando : children}
    </button>
  );
}
