import { InscripcionForm } from "../components/InscripcionForm";
import "./NuevaMatriculaPage.css";

interface NuevaMatriculaPageProps {
  token: string;
}

export function NuevaMatriculaPage({ token }: NuevaMatriculaPageProps) {
  return (
    <section className="nueva-matricula">
      <header className="nueva-matricula__encabezado">
        <h1>Nueva matrícula</h1>
        <p>
          Primero registraremos los datos del estudiante y su apoderado. Después
          configuraremos la matrícula y las pensiones.
        </p>
      </header>

      <InscripcionForm token={token} />
    </section>
  );
}
