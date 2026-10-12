import { useNavigate } from "react-router";
import { Boton } from "../../../shared/components/Boton";
import "./DocenteDashboardPage.css";

export function DocenteDashboardPage() {
  const navegar = useNavigate();

  return (
    <section
      className="docente-dashboard"
      aria-labelledby="docente-inicio-titulo"
    >
      <header className="docente-dashboard__encabezado">
        <h1 id="docente-inicio-titulo">Inicio</h1>
        <p>
          Bienvenido a tu espacio de trabajo. Desde aquí puedes consultar tus
          estudiantes y registrar sus evaluaciones.
        </p>
      </header>

      <article className="docente-dashboard__bienvenida">
        <h2>Continúa con tus evaluaciones</h2>
        <p>
          Selecciona uno de tus cursos para consultar sus estudiantes, registrar
          notas o visualizar sus boletas.
        </p>

        <Boton variante="principal" onClick={() => navegar("/docente/cursos")}>
          Ver mis cursos
        </Boton>
      </article>

      <section
        className="docente-dashboard__guia"
        aria-labelledby="docente-guia-titulo"
      >
        <h2 id="docente-guia-titulo">Cómo registrar una evaluación</h2>

        <ol>
          <li>Abre Mis cursos y selecciona el curso correspondiente.</li>
          <li>Busca al estudiante y pulsa Registrar evaluaciones.</li>
          <li>Selecciona el bimestre, completa los datos y guarda.</li>
        </ol>

        <p>
          Después de guardar, puedes consultar la boleta para revisar los
          resultados.
        </p>
      </section>
    </section>
  );
}
