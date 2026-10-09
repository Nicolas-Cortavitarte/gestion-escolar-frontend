import { Boton } from "./Boton";
import "./TarjetaResumen.css";

interface TarjetaResumenProps {
  titulo: string;
  valor: string | number | null;
  error?: string;
  onReintentar?: () => void;
}

export function TarjetaResumen({
  titulo,
  valor,
  error,
  onReintentar,
}: TarjetaResumenProps) {
  const cargando = valor === null && !error;

  return (
    <article className="tarjeta-resumen" aria-busy={cargando}>
      <h3 className="tarjeta-resumen__titulo">{titulo}</h3>

      {error ? (
        <div className="tarjeta-resumen__error">
          <p role="alert">{error}</p>

          {onReintentar && <Boton onClick={onReintentar}>Reintentar</Boton>}
        </div>
      ) : cargando ? (
        <p className="tarjeta-resumen__cargando" role="status">
          Cargando...
        </p>
      ) : (
        <p className="tarjeta-resumen__valor">{valor}</p>
      )}
    </article>
  );
}
