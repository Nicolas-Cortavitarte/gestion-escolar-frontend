import { useRef, useState } from "react";
import { Boton } from "../../../shared/components/Boton";
import { InscripcionForm } from "../components/InscripcionForm";
import { MatriculaExistenteForm } from "../components/MatriculaExistenteForm";
import "./NuevaMatriculaPage.css";

interface NuevaMatriculaPageProps {
  token: string;
}

type TipoProceso = "nuevo" | "existente";

export function NuevaMatriculaPage({ token }: NuevaMatriculaPageProps) {
  const [tipo, setTipo] = useState<TipoProceso | null>(null);
  const [visitados, setVisitados] = useState({
    nuevo: false,
    existente: false,
  });

  const nuevoRef = useRef<HTMLButtonElement>(null);
  const existenteRef = useRef<HTMLButtonElement>(null);
  const procesoRef = useRef<HTMLHeadingElement>(null);

  function seleccionar(proceso: TipoProceso) {
    setVisitados((actuales) => ({
      ...actuales,
      [proceso]: true,
    }));
    setTipo(proceso);
  }

  function cambiarProceso() {
    const anterior = tipo;
    setTipo(null);

    requestAnimationFrame(() => {
      if (anterior === "nuevo") {
        nuevoRef.current?.focus();
      } else {
        existenteRef.current?.focus();
      }
    });
  }

  return (
    <section className="nueva-matricula">
      <header className="nueva-matricula__encabezado">
        <h1>Nueva matrícula</h1>
        <p>
          Selecciona si el estudiante se registra por primera vez o ya pertenece
          al colegio.
        </p>
      </header>

      {tipo === null && (
        <div className="nueva-matricula__opciones">
          <button
            ref={nuevoRef}
            type="button"
            className="nueva-matricula__opcion"
            onClick={() => seleccionar("nuevo")}
          >
            <strong>Estudiante nuevo</strong>
            <span>
              Registra sus datos, el apoderado y su primera matrícula.
            </span>
          </button>

          <button
            ref={existenteRef}
            type="button"
            className="nueva-matricula__opcion"
            onClick={() => seleccionar("existente")}
          >
            <strong>Estudiante registrado</strong>
            <span>Busca al estudiante y crea su matrícula del año actual.</span>
          </button>
        </div>
      )}

      {tipo !== null && (
        <div className="nueva-matricula__barra">
          <div>
            <h2
              ref={(elemento) => {
                procesoRef.current = elemento;
                elemento?.focus();
              }}
              tabIndex={-1}
            >
              {tipo === "nuevo"
                ? "Matrícula de estudiante nuevo"
                : "Rematrícula de estudiante"}
            </h2>

            <p>Puedes cambiar de proceso sin borrar los datos ingresados.</p>
          </div>

          <Boton onClick={cambiarProceso}>Cambiar proceso</Boton>
        </div>
      )}

      {visitados.nuevo && (
        <div hidden={tipo !== "nuevo"}>
          <InscripcionForm token={token} />
        </div>
      )}

      {visitados.existente && (
        <div hidden={tipo !== "existente"}>
          <MatriculaExistenteForm token={token} />
        </div>
      )}
    </section>
  );
}
