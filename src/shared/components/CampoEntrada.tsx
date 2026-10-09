import { useId, type InputHTMLAttributes } from "react";
import "../../styles/formularios.css";

interface CampoEntradaProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
}

export function CampoEntrada({
  etiqueta,
  ayuda,
  error,
  id,
  className = "",
  "aria-describedby": descripcionExterna,
  ...props
}: CampoEntradaProps) {
  const idGenerado = useId();
  const campoId = id ?? idGenerado;
  const ayudaId = `${campoId}-ayuda`;
  const errorId = `${campoId}-error`;

  const descripcion = [
    descripcionExterna,
    ayuda ? ayudaId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={campoId}>
        {etiqueta}
      </label>

      <input
        {...props}
        id={campoId}
        className={`campo__entrada ${className}`.trim()}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={descripcion || undefined}
      />

      {ayuda && (
        <p className="campo__ayuda" id={ayudaId}>
          {ayuda}
        </p>
      )}

      {error && (
        <p className="campo__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
