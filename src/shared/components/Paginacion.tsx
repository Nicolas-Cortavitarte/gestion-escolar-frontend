import { Boton } from "./Boton";

interface PaginacionProps {
  pagina: number;
  total: number;
  porPagina: number;
  onCambiar: (pagina: number) => void;
}

export function Paginacion({
  pagina,
  total,
  porPagina,
  onCambiar,
}: PaginacionProps) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <nav className="paginacion" aria-label="Páginas del listado">
      <p role="status">
        {total === 0
          ? "Sin resultados"
          : `${(pagina - 1) * porPagina + 1}–${Math.min(
              pagina * porPagina,
              total,
            )} de ${total} resultados`}
      </p>

      <div className="paginacion__controles">
        <Boton disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
          Anterior
        </Boton>

        <span>
          Página {pagina} de {paginas}
        </span>

        <Boton
          disabled={pagina >= paginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente
        </Boton>
      </div>
    </nav>
  );
}
