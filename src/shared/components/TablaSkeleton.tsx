import { Skeleton } from "./Skeleton";
import "./TablaSkeleton.css";

interface TablaSkeletonProps {
  columnas?: number;
  filas?: number;
  etiqueta?: string;
}

export function TablaSkeleton({
  columnas = 5,
  filas = 6,
  etiqueta = "Cargando registros...",
}: TablaSkeletonProps) {
  return (
    <div
      className="tabla-listado tabla-skeleton"
      role="status"
      aria-label={etiqueta}
    >
      <table aria-hidden="true">
        <thead>
          <tr>
            {Array.from({ length: columnas }, (_, col) => (
              <th key={col} scope="col">
                <Skeleton ancho={col === 0 ? "65%" : "55%"} alto="0.95rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: filas }, (_, fila) => (
            <tr key={fila}>
              {Array.from({ length: columnas }, (_, col) => (
                <td key={col}>
                  <Skeleton
                    ancho={col === 0 ? "80%" : col === columnas - 1 ? "60%" : "70%"}
                    alto="1rem"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
