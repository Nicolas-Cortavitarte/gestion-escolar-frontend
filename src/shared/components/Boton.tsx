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
      {cargando ? (
        <>
          <svg
            className="boton__spinner"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="42 18"
            />
          </svg>
          <span>{textoCargando}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
