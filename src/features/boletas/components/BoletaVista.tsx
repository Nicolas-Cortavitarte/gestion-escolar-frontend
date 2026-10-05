import type {
  Boleta,
  ConductaBimestre,
  EvaluacionPadreBimestre,
} from "../boletas.types";

interface BoletaVistaProps {
  boleta: Boleta;
}

const bimestres = [1, 2, 3, 4] as const;

const criteriosConducta: {
  campo: keyof Pick<
    ConductaBimestre,
    "puntualidadRespeto" | "actitudAula" | "presentacionAseo"
  >;
  nombre: string;
}[] = [
  { campo: "puntualidadRespeto", nombre: "Puntualidad y respeto" },
  { campo: "actitudAula", nombre: "Actitud en el aula" },
  {
    campo: "presentacionAseo",
    nombre: "Presentación, aseo personal y ambiental",
  },
];

const criteriosAsistencia: {
  campo: keyof Pick<
    ConductaBimestre,
    | "inasistenciasJustificadas"
    | "inasistenciasInjustificadas"
    | "tardanzasJustificadas"
    | "tardanzasInjustificadas"
  >;
  nombre: string;
}[] = [
  { campo: "inasistenciasJustificadas", nombre: "Inasistencias justificadas" },
  {
    campo: "inasistenciasInjustificadas",
    nombre: "Inasistencias injustificadas",
  },
  { campo: "tardanzasJustificadas", nombre: "Tardanzas justificadas" },
  { campo: "tardanzasInjustificadas", nombre: "Tardanzas injustificadas" },
];

const criteriosPadre: {
  campo: keyof Omit<EvaluacionPadreBimestre, "bimestre">;
  nombre: string;
}[] = [
  {
    campo: "enviaPuntualmenteHijo",
    nombre: "Envía puntualmente a su hijo(a) al colegio",
  },
  {
    campo: "apoyaTareasCasa",
    nombre: "Apoya y refuerza las tareas en casa",
  },
  {
    campo: "enviaHijoUniformado",
    nombre: "Envía a su hijo(a) correctamente uniformado",
  },
  {
    campo: "asisteReunionesColegio",
    nombre: "Asiste a las reuniones del colegio",
  },
  {
    campo: "cumplePagosInstitucion",
    nombre: "Cumple puntualmente con los pagos de la institución",
  },
];

const situaciones = {
  APROBADO: "Aprobado",
  RECUPERACION: "Recuperación",
  DESAPROBADO: "Desaprobado",
};

export function BoletaVista({ boleta }: BoletaVistaProps) {
  const conductaPorBimestre = new Map(
    boleta.conducta.map((registro) => [registro.bimestre, registro]),
  );

  const padrePorBimestre = new Map(
    boleta.evaluacionPadre.map((registro) => [registro.bimestre, registro]),
  );

  return (
    <article className="boleta">
      <header className="boleta__encabezado">
        <h2>Liceo Santo Toribio</h2>
        <p>Informe de progreso del aprendizaje del estudiante</p>

        <dl className="boleta__datos">
          <div>
            <dt>Estudiante</dt>
            <dd>{boleta.nombreEstudiante}</dd>
          </div>
          <div>
            <dt>Año lectivo</dt>
            <dd>{boleta.anioLectivo}</dd>
          </div>
        </dl>
      </header>

      <section className="boleta__seccion">
        <h3>Áreas curriculares y competencias</h3>

        {boleta.areas.length === 0 ? (
          <p>No hay cursos configurados para esta matrícula.</p>
        ) : (
          <div className="boleta__tabla-contenedor">
            <table>
              <caption>Calificaciones por competencia y área</caption>
              <thead>
                <tr>
                  <th scope="col">Área curricular</th>
                  <th scope="col">Competencia</th>
                  <th scope="col">I</th>
                  <th scope="col">II</th>
                  <th scope="col">III</th>
                  <th scope="col">IV</th>
                  <th scope="col">Final</th>
                </tr>
              </thead>

              <tbody>
                {boleta.areas.map((area, indiceArea) => (
                  <BloqueArea
                    key={`${indiceArea}-${area.nombreArea}`}
                    area={area}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="boleta__seccion">
        <h3>Conducta del alumno</h3>
        <div className="boleta__tabla-contenedor">
          <table>
            <caption>Conducta por bimestre</caption>
            <thead>
              <tr>
                <th scope="col">Criterio</th>
                {bimestres.map((bimestre) => (
                  <th scope="col" key={bimestre}>
                    {bimestre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteriosConducta.map(({ campo, nombre }) => (
                <tr key={campo}>
                  <th scope="row">{nombre}</th>
                  {bimestres.map((bimestre) => (
                    <td key={bimestre}>
                      {conductaPorBimestre.get(bimestre)?.[campo] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="boleta__calificativo-area">
                <th scope="row">CALIFICACIÓN DEL BIMESTRE</th>
                {bimestres.map((bimestre) => (
                  <td key={bimestre}>
                    {conductaPorBimestre.get(bimestre)?.calificacionBimestre ??
                      ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="boleta__seccion">
        <h3>Asistencia</h3>
        <div className="boleta__tabla-contenedor">
          <table>
            <caption>Inasistencias y tardanzas por bimestre</caption>
            <thead>
              <tr>
                <th scope="col">Registro</th>
                {bimestres.map((bimestre) => (
                  <th scope="col" key={bimestre}>
                    {bimestre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteriosAsistencia.map(({ campo, nombre }) => (
                <tr key={campo}>
                  <th scope="row">{nombre}</th>
                  {bimestres.map((bimestre) => (
                    <td key={bimestre}>
                      {conductaPorBimestre.get(bimestre)?.[campo] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="boleta__seccion">
        <h3>Apreciación del tutor</h3>
        <div className="boleta__tabla-contenedor">
          <table>
            <caption>Observaciones por bimestre</caption>
            <thead>
              <tr>
                <th scope="col">Bimestre</th>
                <th scope="col">Apreciación</th>
              </tr>
            </thead>
            <tbody>
              {bimestres.map((bimestre) => (
                <tr key={bimestre}>
                  <th scope="row">{bimestre}</th>
                  <td>
                    {conductaPorBimestre.get(bimestre)?.apreciacionTutor ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="boleta__seccion">
        <h3>Evaluación del padre de familia</h3>
        <div className="boleta__tabla-contenedor">
          <table>
            <caption>Evaluación del padre de familia por bimestre</caption>
            <thead>
              <tr>
                <th scope="col">Indicador</th>
                {bimestres.map((bimestre) => (
                  <th scope="col" key={bimestre}>
                    {bimestre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteriosPadre.map(({ campo, nombre }) => (
                <tr key={campo}>
                  <th scope="row">{nombre}</th>
                  {bimestres.map((bimestre) => (
                    <td key={bimestre}>
                      {padrePorBimestre.get(bimestre)?.[campo] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="boleta__seccion">
        <h3>Resumen final del alumno</h3>
        <dl className="boleta__resumen">
          <div>
            <dt>Situación final</dt>
            <dd>
              {boleta.resumenFinal
                ? situaciones[boleta.resumenFinal.situacionFinal]
                : "Pendiente de cálculo"}
            </dd>
          </div>
          <div>
            <dt>Áreas a recuperar</dt>
            <dd>{boleta.resumenFinal?.areaARecuperar ?? ""}</dd>
          </div>
        </dl>
      </section>
    </article>
  );
}

function BloqueArea({ area }: { area: Boleta["areas"][number] }) {
  return (
    <>
      {area.competencias.map((competencia, indice) => (
        <tr key={`${indice}-${competencia.nombreCompetencia}`}>
          {indice === 0 && (
            <th scope="rowgroup" rowSpan={area.competencias.length}>
              {area.nombreArea}
            </th>
          )}
          <th scope="row">{competencia.nombreCompetencia}</th>
          {bimestres.map((bimestre) => (
            <td key={bimestre}>
              {competencia.notasPorBimestre[bimestre] ?? ""}
            </td>
          ))}
          <td>{competencia.promedioFinal ?? ""}</td>
        </tr>
      ))}

      {area.competencias.length === 0 && (
        <tr>
          <th scope="row">{area.nombreArea}</th>
          <td colSpan={6}>Sin competencias registradas</td>
        </tr>
      )}

      <tr className="boleta__calificativo-area">
        <th scope="row" colSpan={2}>
          Calificativo del área: {area.nombreArea}
        </th>
        {bimestres.map((bimestre) => (
          <td key={bimestre}>
            {area.calificativoAreaPorBimestre[bimestre] ?? ""}
          </td>
        ))}
        <td>{area.promedioFinalArea ?? ""}</td>
      </tr>
    </>
  );
}
