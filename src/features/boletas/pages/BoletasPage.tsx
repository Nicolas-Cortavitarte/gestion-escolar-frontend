import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { obtenerMatriculas } from "../../matriculas/matriculas.service";
import type { Matricula } from "../../matriculas/matriculas.types";
import { obtenerBoleta } from "../boletas.service";
import type { Boleta } from "../boletas.types";
import { BoletaVista } from "../components/BoletaVista";
import "./BoletasPage.css";

interface BoletasPageProps {
  token: string;
}

export function BoletasPage({ token }: BoletasPageProps) {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [cargandoMatriculas, setCargandoMatriculas] = useState(true);
  const [errorMatriculas, setErrorMatriculas] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [busqueda, setBusqueda] = useState("");
  const [matriculaId, setMatriculaId] = useState("");
  const [boleta, setBoleta] = useState<Boleta | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState("");

  const consultaRef = useRef(0);

  useEffect(() => {
    let activo = true;

    obtenerMatriculas(token)
      .then((datos) => {
        if (activo) {
          setMatriculas(datos);
          setErrorMatriculas("");
        }
      })
      .catch((fallo: unknown) => {
        if (activo) {
          setErrorMatriculas(
            fallo instanceof Error
              ? fallo.message
              : "No se pudieron cargar los estudiantes matriculados.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargandoMatriculas(false);
      });

    return () => {
      activo = false;
      consultaRef.current += 1;
    };
  }, [token]);

  function limpiarConsulta() {
    consultaRef.current += 1;
    setConsultando(false);
    setBoleta(null);
    setError("");
  }

  const anios = Array.from(
    new Set([
      new Date().getFullYear(),
      ...matriculas.map((matricula) => matricula.anioLectivo),
    ]),
  ).sort((a, b) => b - a);

  const termino = busqueda.trim().toLocaleLowerCase("es");

  const opciones = matriculas
    .filter(
      (matricula) =>
        matricula.anioLectivo === Number(anio) &&
        matricula.nombreEstudiante.toLocaleLowerCase("es").includes(termino),
    )
    .sort((a, b) => a.nombreEstudiante.localeCompare(b.nombreEstudiante, "es"));

  async function consultar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (consultando) return;

    const seleccionada = opciones.find(
      (matricula) => matricula.id === matriculaId,
    );

    if (!seleccionada) {
      setError("Selecciona un estudiante matriculado.");
      return;
    }

    const consultaId = ++consultaRef.current;

    setConsultando(true);
    setError("");
    setBoleta(null);

    try {
      const datos = await obtenerBoleta(
        token,
        seleccionada.estudianteId,
        seleccionada.anioLectivo,
      );

      if (consultaId === consultaRef.current) {
        setBoleta(datos);
      }
    } catch (fallo: unknown) {
      if (consultaId === consultaRef.current) {
        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo consultar la boleta.",
        );
      }
    } finally {
      if (consultaId === consultaRef.current) {
        setConsultando(false);
      }
    }
  }

  return (
    <section className="boletas-page">
      <header className="boletas-page__encabezado">
        <h1>Boletas de notas</h1>
        <p>Selecciona el año y el estudiante para consultar su boleta.</p>
      </header>

      {cargandoMatriculas && (
        <p role="status">Cargando estudiantes matriculados...</p>
      )}

      {errorMatriculas && <p role="alert">{errorMatriculas}</p>}

      {!cargandoMatriculas && !errorMatriculas && (
        <form className="boletas-page__filtros" onSubmit={consultar}>
          <div className="boletas-page__campo">
            <label htmlFor="boletas-anio">Año lectivo</label>
            <select
              id="boletas-anio"
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

          <div className="boletas-page__campo">
            <label htmlFor="boletas-busqueda">Buscar estudiante</label>
            <input
              id="boletas-busqueda"
              type="search"
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setMatriculaId("");
                limpiarConsulta();
              }}
              placeholder="Nombres o apellidos"
            />
          </div>

          <div className="boletas-page__campo">
            <label htmlFor="boletas-estudiante">Estudiante</label>
            <select
              id="boletas-estudiante"
              value={matriculaId}
              onChange={(evento) => {
                setMatriculaId(evento.target.value);
                limpiarConsulta();
              }}
              required
            >
              <option value="">Selecciona un estudiante</option>
              {opciones.map((matricula) => (
                <option key={matricula.id} value={matricula.id}>
                  {matricula.nombreEstudiante} — {matricula.nivel}{" "}
                  {matricula.grado}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="boletas-page__boton"
            disabled={consultando || !matriculaId}
          >
            {consultando ? "Consultando..." : "Consultar boleta"}
          </button>

          {opciones.length === 0 && (
            <p>No hay estudiantes que coincidan con el año y la búsqueda.</p>
          )}
        </form>
      )}

      {error && <p role="alert">{error}</p>}
      {consultando && <p role="status">Cargando boleta...</p>}

      {boleta && (
        <>
          <div className="boletas-page__acciones">
            <button
              type="button"
              className="boletas-page__boton"
              onClick={() => window.print()}
            >
              Imprimir boleta
            </button>
          </div>

          <BoletaVista boleta={boleta} />
        </>
      )}
    </section>
  );
}
