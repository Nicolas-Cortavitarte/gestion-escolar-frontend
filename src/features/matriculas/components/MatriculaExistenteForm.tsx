import { useRef, useState, type FormEvent } from "react";
import { buscarEstudiantePorDni } from "../../estudiantes/estudiantes.service";
import type { Estudiante } from "../../estudiantes/estudiantes.types";
import { crearMatricula } from "../matriculas.service";
import { Boton } from "../../../shared/components/Boton";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { useValidacion } from "../../../shared/hooks/useValidacion";
import { GRADOS_POR_NIVEL } from "../../../shared/constants/academico";
import "./InscripcionForm.css";

interface MatriculaExistenteFormProps {
  token: string;
}

export function MatriculaExistenteForm({ token }: MatriculaExistenteFormProps) {
  const [dni, setDni] = useState("");
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [errorMatricula, setErrorMatricula] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [montoMatricula, setMontoMatricula] = useState("");
  const [montoPensionMensual, setMontoPensionMensual] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const buscandoRef = useRef(false);
  const guardandoRef = useRef(false);
  const dniRef = useRef<HTMLDivElement>(null);

  const validacionBusqueda = useValidacion();
  const validacionMatricula = useValidacion();

  const anioLectivo = new Date().getFullYear();
  const bloqueado = guardando || registrada;

  async function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (buscandoRef.current || bloqueado) return;

    setErrorBusqueda("");
    setEstudiante(null);

    if (!validacionBusqueda.validar(evento.currentTarget)) return;

    buscandoRef.current = true;
    setBuscando(true);

    try {
      const encontrado = await buscarEstudiantePorDni(token, dni);
      setEstudiante(encontrado);
    } catch (fallo: unknown) {
      setErrorBusqueda(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo buscar al estudiante. Inténtalo nuevamente.",
      );
    } finally {
      buscandoRef.current = false;
      setBuscando(false);
    }
  }

  async function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (
      !estudiante ||
      buscandoRef.current ||
      guardandoRef.current ||
      registrada
    ) {
      return;
    }

    setErrorMatricula("");
    setMensaje("");

    if (!validacionMatricula.validar(evento.currentTarget)) return;

    const gradosPermitidos = GRADOS_POR_NIVEL[nivel];

    if (!gradosPermitidos || !gradosPermitidos.includes(grado)) {
      setErrorMatricula("Selecciona un nivel y un grado válidos.");
      return;
    }

    const monto = Number(montoMatricula);
    const pension = Number(montoPensionMensual);
    const dia = Number(fechaVencimiento);

    if (
      !montoMatricula ||
      !montoPensionMensual ||
      !Number.isFinite(monto) ||
      !Number.isFinite(pension) ||
      monto <= 0 ||
      pension <= 0
    ) {
      setErrorMatricula("Los montos deben ser mayores a cero.");
      return;
    }

    if (!fechaVencimiento || !Number.isInteger(dia) || dia < 1 || dia > 31) {
      setErrorMatricula("Selecciona el día de vencimiento de la pensión.");
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      await crearMatricula(token, {
        estudianteId: estudiante.id,
        anioLectivo,
        nivel,
        grado,
        montoMatricula: monto,
        montoPensionMensual: pension,
        fechaVencimiento: dia,
      });

      setRegistrada(true);
      setMensaje(
        `Matrícula registrada para ${estudiante.nombres} ${estudiante.apellidos}.`,
      );
    } catch (fallo: unknown) {
      setErrorMatricula(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar la matrícula. Inténtalo nuevamente.",
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  function nuevaMatricula() {
    setDni("");
    setEstudiante(null);
    setNivel("");
    setGrado("");
    setMontoMatricula("");
    setMontoPensionMensual("");
    setFechaVencimiento("");
    setErrorBusqueda("");
    setErrorMatricula("");
    setMensaje("");
    setRegistrada(false);

    requestAnimationFrame(() => {
      dniRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    });
  }

  return (
    <div className="inscripcion">
      <form
        className="inscripcion__tarjeta"
        onSubmit={buscar}
        {...validacionBusqueda.eventos}
        noValidate
        aria-busy={buscando}
      >
        <h2>Buscar estudiante registrado</h2>

        <div ref={dniRef}>
          <CampoEntrada
            id="matricula-estudiante-dni"
            etiqueta="DNI del estudiante"
            value={dni}
            onChange={(evento) => {
              setDni(evento.target.value.replace(/\D/g, "").slice(0, 8));
              setEstudiante(null);
              setErrorBusqueda("");
              setErrorMatricula("");
            }}
            inputMode="numeric"
            pattern="[0-9]{8}"
            data-mensaje-patron="El DNI debe tener 8 dígitos."
            maxLength={8}
            ayuda="Busca al estudiante antes de configurar su matrícula."
            error={validacionBusqueda.errores["matricula-estudiante-dni"]}
            disabled={buscando || bloqueado}
            required
          />
        </div>

        <div className="inscripcion__acciones">
          <Boton
            type="submit"
            variante={estudiante ? "secundario" : "principal"}
            cargando={buscando}
            textoCargando="Buscando..."
            disabled={bloqueado}
          >
            Buscar estudiante
          </Boton>
        </div>

        {errorBusqueda && (
          <p className="inscripcion__error" role="alert">
            {errorBusqueda}
          </p>
        )}

        {estudiante && (
          <p className="inscripcion__confirmacion" role="status">
            Estudiante encontrado: {estudiante.nombres} {estudiante.apellidos}.
          </p>
        )}
      </form>

      {estudiante && (
        <form
          className="inscripcion__tarjeta"
          onSubmit={registrar}
          {...validacionMatricula.eventos}
          noValidate
          aria-busy={guardando}
        >
          <h2>Datos de matrícula</h2>

          <p className="inscripcion__resumen">
            {estudiante.nombres} {estudiante.apellidos} · Año {anioLectivo}
          </p>

          <fieldset className="inscripcion__datos" disabled={bloqueado}>
            <legend className="solo-lectores">
              Configuración de matrícula
            </legend>

            <div className="inscripcion__campos">
              <div className="campo">
                <label className="campo__etiqueta" htmlFor="existente-nivel">
                  Nivel
                </label>

                <select
                  id="existente-nivel"
                  className="campo__entrada"
                  value={nivel}
                  onChange={(evento) => {
                    setNivel(evento.target.value);
                    setGrado("");
                    setErrorMatricula("");
                  }}
                  required
                >
                  <option value="">Selecciona un nivel</option>
                  <option value="INICIAL">Inicial</option>
                  <option value="PRIMARIA">Primaria</option>
                </select>
              </div>

              <div className="campo">
                <label className="campo__etiqueta" htmlFor="existente-grado">
                  Grado
                </label>

                <select
                  id="existente-grado"
                  className="campo__entrada"
                  value={grado}
                  onChange={(evento) => {
                    setGrado(evento.target.value);
                    setErrorMatricula("");
                  }}
                  disabled={!nivel}
                  aria-describedby="existente-grado-ayuda"
                  required
                >
                  <option value="">
                    {nivel
                      ? "Selecciona un grado"
                      : "Selecciona primero el nivel"}
                  </option>

                  {(GRADOS_POR_NIVEL[nivel] ?? []).map((valor) => (
                    <option key={valor} value={valor}>
                      {valor}
                    </option>
                  ))}
                </select>

                <p className="campo__ayuda" id="existente-grado-ayuda">
                  Los grados disponibles dependen del nivel seleccionado.
                </p>
              </div>

              <CampoEntrada
                id="existente-matricula"
                etiqueta="Monto de matrícula (S/)"
                type="number"
                min="0.01"
                step="0.01"
                value={montoMatricula}
                onChange={(evento) => setMontoMatricula(evento.target.value)}
                error={validacionMatricula.errores["existente-matricula"]}
                required
              />

              <CampoEntrada
                id="existente-pension"
                etiqueta="Pensión mensual (S/)"
                type="number"
                min="0.01"
                step="0.01"
                value={montoPensionMensual}
                onChange={(evento) =>
                  setMontoPensionMensual(evento.target.value)
                }
                error={validacionMatricula.errores["existente-pension"]}
                required
              />

              <div className="campo">
                <label
                  className="campo__etiqueta"
                  htmlFor="existente-vencimiento"
                >
                  Día de vencimiento de la pensión
                </label>

                <select
                  id="existente-vencimiento"
                  className="campo__entrada"
                  value={fechaVencimiento}
                  onChange={(evento) => {
                    setFechaVencimiento(evento.target.value);
                    setErrorMatricula("");
                  }}
                  required
                >
                  <option value="">Selecciona un día</option>

                  {Array.from({ length: 31 }, (_, indice) => indice + 1).map(
                    (dia) => (
                      <option key={dia} value={dia}>
                        Día {dia}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </fieldset>

          {errorMatricula && (
            <p className="inscripcion__error" role="alert">
              {errorMatricula}
            </p>
          )}

          {registrada ? (
            <>
              <p className="inscripcion__confirmacion" role="status">
                {mensaje}
              </p>

              <div className="inscripcion__acciones">
                <Boton variante="principal" onClick={nuevaMatricula}>
                  Nueva matrícula
                </Boton>
              </div>
            </>
          ) : (
            <div className="inscripcion__acciones">
              <Boton
                type="submit"
                variante="principal"
                cargando={guardando}
                textoCargando="Registrando..."
              >
                Registrar matrícula
              </Boton>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
