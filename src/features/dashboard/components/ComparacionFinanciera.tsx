import { useId } from "react";
import type { ResumenFinancieroMes } from "../dashboard.types";
import "./ComparacionFinanciera.css";

interface ComparacionFinancieraProps {
  resumen: ResumenFinancieroMes;
  descripcion?: string;
  seleccion?: "ingresos" | "egresos";
  onSeleccionar?: (tipo: "ingresos" | "egresos") => void;
}

const formatoSoles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function ComparacionFinanciera({
  resumen,
  descripcion = "Resumen del mes actual",
  seleccion,
  onSeleccionar,
}: ComparacionFinancieraProps) {
  const id = useId();
  const mayorMonto = Math.max(resumen.ingresos, resumen.egresos, 0);

  const filas = [
    {
      clave: "ingresos",
      etiqueta: "Ingresos",
      monto: resumen.ingresos,
    },
    {
      clave: "egresos",
      etiqueta: "Egresos",
      monto: resumen.egresos,
    },
  ] as const;

  return (
    <section
      className="comparacion-financiera"
      aria-labelledby={`${id}-titulo`}
    >
      <h2 id={`${id}-titulo`}>Ingresos y egresos</h2>
      <p>{descripcion}</p>

      {onSeleccionar && (
        <p className="comparacion-financiera__ayuda">
          Selecciona Ingresos o Egresos para consultar su desglose.
        </p>
      )}

      <div className="comparacion-financiera__filas">
        {filas.map((fila) => {
          const porcentaje =
            mayorMonto === 0 ? 0 : (fila.monto / mayorMonto) * 100;

          const contenido = (
            <>
              <span>{fila.etiqueta}</span>

              <strong>{formatoSoles.format(fila.monto)}</strong>

              <span
                className="comparacion-financiera__pista"
                aria-hidden="true"
              >
                <span
                  className={`comparacion-financiera__barra comparacion-financiera__barra--${fila.clave}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </span>
            </>
          );

          return onSeleccionar ? (
            <button
              key={fila.clave}
              type="button"
              className="comparacion-financiera__fila comparacion-financiera__fila--interactiva"
              aria-pressed={seleccion === fila.clave}
              onClick={() => onSeleccionar(fila.clave)}
            >
              {contenido}
            </button>
          ) : (
            <div key={fila.clave} className="comparacion-financiera__fila">
              {contenido}
            </div>
          );
        })}
      </div>

      {mayorMonto === 0 && (
        <p className="comparacion-financiera__vacio">
          No se registraron ingresos ni egresos en este periodo.
        </p>
      )}
    </section>
  );
}
