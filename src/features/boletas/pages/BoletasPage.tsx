import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { obtenerMatriculas } from "../../matriculas/matriculas.service";
import type { Matricula } from "../../matriculas/matriculas.types";
import { obtenerBoleta } from "../boletas.service";
import type { Boleta } from "../boletas.types";
import { BoletaVista } from "../components/BoletaVista";
import { RegistroNotasModal } from "../../calificaciones/components/RegistroNotasModal";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import "../../../styles/listados.css";
import "./BoletasPage.css";

interface BoletasPageProps {
  token: string;
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

export function BoletasPage({ token }: BoletasPageProps) {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargandoMatriculas, setCargandoMatriculas] = useState(true);
  const [errorMatriculas, setErrorMatriculas] = useState("");
  const [intentoMatriculas, setIntentoMatriculas] = useState(0);

  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [busqueda, setBusqueda] = useState("");
  const [matriculaId, setMatriculaId] = useState("");
  const [boleta, setBoleta] = useState<Boleta | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [matriculaNotas, setMatriculaNotas] = useState<Matricula | null>(null);

  const consultaRef = useRef(0);
  const consultandoRef = useRef(false);
  const [ultimaConsulta, setUltimaConsulta] = useState<Matricula | null>(null);

  useEffect(() => {
    let activo = true;

    obtenerMatriculas(token)
      .then((datos) => {
        if (!activo) return;

        setMatriculas(datos);
        setErrorMatriculas("");
      })
      .catch((fallo: unknown) => {
        if (!activo) return;

        setErrorMatriculas(
          fallo instanceof Error
            ? fallo.message
            : "No se pudieron cargar los estudiantes matriculados.",
        );
      })
      .finally(() => {
        if (activo) setCargandoMatriculas(false);
      });

    return () => {
      activo = false;
      consultaRef.current += 1;
      consultandoRef.current = false;
    };
  }, [token, intentoMatriculas]);

  function reintentarMatriculas() {
    setErrorMatriculas("");
    setCargandoMatriculas(true);
    setIntentoMatriculas((actual) => actual + 1);
  }

  function limpiarConsulta() {
    consultaRef.current += 1;
    consultandoRef.current = false;
    setUltimaConsulta(null);
    setConsultando(false);
    setBoleta(null);
    setError("");
    setMensaje("");
  }

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...matriculas.map((matricula) => matricula.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const termino = normalizar(busqueda.trim());

  const opciones = matriculas
    .filter(
      (matricula) =>
        matricula.anioLectivo === Number(anio) &&
        normalizar(matricula.nombreEstudiante).includes(termino),
    )
    .sort((a, b) => a.nombreEstudiante.localeCompare(b.nombreEstudiante, "es"));

  async function cargarBoleta(
    seleccionada: Matricula,
    despuesDeGuardar = false,
  ) {
    if (consultandoRef.current) return;

    const consultaId = ++consultaRef.current;
    consultandoRef.current = true;
    setUltimaConsulta(seleccionada);

    setConsultando(true);
    setError("");
    setMensaje("");
    setBoleta(null);

    try {
      const datos = await obtenerBoleta(
        token,
        seleccionada.estudianteId,
        seleccionada.anioLectivo,
      );

      if (consultaId !== consultaRef.current) return;

      setBoleta(datos);

      if (despuesDeGuardar) {
        setMensaje("Las evaluaciones se guardaron y la boleta se actualizó.");
      }
    } catch (fallo: unknown) {
      if (consultaId !== consultaRef.current) return;

      const detalle =
        fallo instanceof Error ? fallo.message : "Inténtalo nuevamente.";

      setError(
        despuesDeGuardar
          ? `Las evaluaciones se guardaron, pero no se pudo actualizar la boleta. ${detalle}`
          : `No se pudo consultar la boleta. ${detalle}`,
      );
    } finally {
      if (consultaId === consultaRef.current) {
        consultandoRef.current = false;
        setConsultando(false);
      }
    }
  }

  function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const seleccionada = opciones.find(
      (matricula) => matricula.id === matriculaId,
    );

    if (!seleccionada) {
      setError("Selecciona un estudiante matriculado.");
      document.getElementById("boletas-estudiante")?.focus();
      return;
    }

    void cargarBoleta(seleccionada);
  }

  function abrirRegistroEvaluaciones() {
    if (!boleta || consultandoRef.current) return;

    const seleccionada = matriculas.find(
      (matricula) =>
        matricula.estudianteId === boleta.estudianteId &&
        matricula.anioLectivo === boleta.anioLectivo,
    );

    if (!seleccionada) {
      setError("No se encontró la matrícula correspondiente a esta boleta.");
      return;
    }

    setError("");
    setMensaje("");
    setMatriculaNotas(seleccionada);
  }

  function cerrarRegistroNotas(huboCambios: boolean) {
    const seleccionada = matriculaNotas;
    setMatriculaNotas(null);

    if (huboCambios && seleccionada) {
      void cargarBoleta(seleccionada, true);
    }
  }

  return (
    <section className="boletas-page">
      <header className="boletas-page__encabezado">
        <h1>Boletas de notas</h1>
        <p>
          Consulta la boleta del estudiante para registrar evaluaciones o
          imprimirla.
        </p>
      </header>

      {cargandoMatriculas && (
        <p role="status" className="boletas-page__carga">
          Cargando estudiantes matriculados...
        </p>
      )}

      {!cargandoMatriculas && errorMatriculas && (
        <div className="estado-listado boletas-page__estado">
          <p role="alert">{errorMatriculas}</p>
          <Boton onClick={reintentarMatriculas}>Reintentar</Boton>
        </div>
      )}

      {!cargandoMatriculas && !errorMatriculas && (
        <form className="boletas-page__filtros" onSubmit={consultar} noValidate>
          <div className="campo">
            <label htmlFor="boletas-anio">Año lectivo</label>
            <select
              id="boletas-anio"
              className="campo__entrada"
              value={anio}
              onChange={(evento) => {
                setAnio(evento.target.value);
                setMatriculaId("");
                limpiarConsulta();
              }}
            >
              {anios.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </div>

          <CampoEntrada
            id="boletas-busqueda"
            etiqueta="Buscar estudiante"
            type="search"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setMatriculaId("");
              limpiarConsulta();
            }}
            placeholder="Nombres o apellidos"
          />

          <div className="campo boletas-page__seleccion">
            <label htmlFor="boletas-estudiante">Estudiante</label>
            <select
              id="boletas-estudiante"
              className="campo__entrada"
              value={matriculaId}
              onChange={(evento) => {
                setMatriculaId(evento.target.value);
                limpiarConsulta();
              }}
              disabled={opciones.length === 0}
              required
            >
              <option value="">Selecciona un estudiante</option>

              {opciones.map((matricula) => (
                <option key={matricula.id} value={matricula.id}>
                  {matricula.nombreEstudiante} —{" "}
                  {matricula.nivel === "INICIAL" ? "Inicial" : "Primaria"}{" "}
                  {matricula.grado}
                </option>
              ))}
            </select>
          </div>

          <Boton
            type="submit"
            variante={boleta ? "secundario" : "principal"}
            cargando={consultando}
            textoCargando="Consultando..."
            disabled={!matriculaId}
          >
            Consultar boleta
          </Boton>

          {opciones.length === 0 && (
            <div className="boletas-page__sin-resultados">
              <p>No hay estudiantes que coincidan con el año y la búsqueda.</p>

              {busqueda && (
                <Boton
                  onClick={() => {
                    setBusqueda("");
                    setMatriculaId("");
                    limpiarConsulta();
                  }}
                >
                  Limpiar búsqueda
                </Boton>
              )}
            </div>
          )}
        </form>
      )}

      {error && (
        <div className="estado-listado boletas-page__estado">
          <p role="alert">{error}</p>

          {ultimaConsulta && (
            <Boton
              onClick={() => {
                void cargarBoleta(ultimaConsulta);
              }}
              disabled={consultando}
            >
              Reintentar consulta
            </Boton>
          )}
        </div>
      )}

      {mensaje && (
        <p role="status" className="boletas-page__exito">
          {mensaje}
        </p>
      )}

      {consultando && (
        <p role="status" className="boletas-page__carga">
          Cargando boleta...
        </p>
      )}

      {boleta && (
        <>
          <div className="boletas-page__acciones">
            <Boton variante="principal" onClick={abrirRegistroEvaluaciones}>
              Registrar evaluaciones
            </Boton>

            <Boton onClick={() => window.print()}>Imprimir boleta</Boton>
          </div>

          <BoletaVista boleta={boleta} />
        </>
      )}

      {matriculaNotas && (
        <RegistroNotasModal
          key={matriculaNotas.id}
          token={token}
          matricula={matriculaNotas}
          onCerrar={cerrarRegistroNotas}
        />
      )}
    </section>
  );
}
