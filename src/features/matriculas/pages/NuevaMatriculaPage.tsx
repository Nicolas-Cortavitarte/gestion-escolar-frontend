import { useState } from "react";
import { InscripcionForm } from "../components/InscripcionForm";
import { MatriculaExistenteForm } from "../components/MatriculaExistenteForm";
import "./NuevaMatriculaPage.css";

interface NuevaMatriculaPageProps {
  token: string;
}

export function NuevaMatriculaPage({ token }: NuevaMatriculaPageProps) {
  const [tipo, setTipo] = useState<"nuevo" | "existente" | null>(null);

  return (
    <section className="nueva-matricula">
      <header className="nueva-matricula__encabezado">
        <h1>Matrículas</h1>
        <p>Selecciona el proceso que deseas realizar.</p>
      </header>

      {tipo === null && (
        <div className="nueva-matricula__opciones">
          <button
            type="button"
            className="nueva-matricula__opcion"
            onClick={() => setTipo("nuevo")}
          >
            <strong>Matricular estudiante nuevo</strong>
            <span>
              Registra al estudiante, su apoderado y su primera matrícula.
            </span>
          </button>

          <button
            type="button"
            className="nueva-matricula__opcion"
            onClick={() => setTipo("existente")}
          >
            <strong>Rematricular estudiante</strong>
            <span>
              Busca un estudiante registrado y crea su matrícula del año actual.
            </span>
          </button>
        </div>
      )}

      {tipo !== null && (
        <div className="nueva-matricula__barra">
          <p className="nueva-matricula__proceso">
            {tipo === "nuevo"
              ? "Matrícula de estudiante nuevo"
              : "Rematrícula de estudiante"}
          </p>

          <button
            type="button"
            className="nueva-matricula__cambiar"
            onClick={() => setTipo(null)}
          >
            Cambiar proceso
          </button>
        </div>
      )}

      <div hidden={tipo !== "nuevo"}>
        <InscripcionForm token={token} />
      </div>

      <div hidden={tipo !== "existente"}>
        <MatriculaExistenteForm token={token} />
      </div>
    </section>
  );
}
