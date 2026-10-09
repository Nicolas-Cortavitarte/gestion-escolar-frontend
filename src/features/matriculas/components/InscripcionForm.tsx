import {
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import { buscarApoderadoPorDni, crearInscripcion } from "../matriculas.service";
import type {
  ApoderadoExistente,
  InscripcionRequest,
} from "../matriculas.types";
import { CampoEntrada } from "../../../shared/components/CampoEntrada";
import { Boton } from "../../../shared/components/Boton";
import { useValidacion } from "../../../shared/hooks/useValidacion";
import { GRADOS_POR_NIVEL } from "../../../shared/constants/academico";
import "./InscripcionForm.css";

interface InscripcionFormProps {
  token: string;
}

const estudianteVacio = {
  dni: "",
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  direccion: "",
};

const apoderadoVacio = {
  dni: "",
  nombre: "",
  apellidos: "",
  telefono: "",
  email: "",
  parentesco: "",
};

const matriculaVacia = {
  nivel: "",
  grado: "",
  montoMatricula: "",
  montoPensionMensual: "",
  fechaVencimiento: "",
};

type DatosEstudiante = typeof estudianteVacio;
type DatosApoderado = typeof apoderadoVacio;

interface DefinicionCampo<T extends string> {
  clave: T;
  etiqueta: string;
  tipo?: InputHTMLAttributes<HTMLInputElement>["type"];
  requerido?: boolean;
  digitos?: number;
}

const camposEstudiante: DefinicionCampo<keyof DatosEstudiante>[] = [
  { clave: "dni", etiqueta: "DNI", requerido: true, digitos: 8 },
  { clave: "nombres", etiqueta: "Nombres", requerido: true },
  { clave: "apellidos", etiqueta: "Apellidos", requerido: true },
  {
    clave: "fechaNacimiento",
    etiqueta: "Fecha de nacimiento",
    tipo: "date",
    requerido: true,
  },
  { clave: "direccion", etiqueta: "Dirección (opcional)" },
];

const camposApoderado: DefinicionCampo<keyof DatosApoderado>[] = [
  { clave: "dni", etiqueta: "DNI", requerido: true, digitos: 8 },
  { clave: "nombre", etiqueta: "Nombres", requerido: true },
  { clave: "apellidos", etiqueta: "Apellidos", requerido: true },
  {
    clave: "telefono",
    etiqueta: "Teléfono (opcional)",
    tipo: "tel",
    digitos: 9,
  },
  {
    clave: "email",
    etiqueta: "Correo electrónico (opcional)",
    tipo: "email",
  },
  { clave: "parentesco", etiqueta: "Parentesco (opcional)" },
];

function limpiarDigitos(valor: string, cantidad: number) {
  return valor.replace(/\D/g, "").slice(0, cantidad);
}

function fechaHoy() {
  const hoy = new Date();

  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-");
}

export function InscripcionForm({ token }: InscripcionFormProps) {
  const [estudiante, setEstudiante] = useState(estudianteVacio);
  const [nuevoApoderado, setNuevoApoderado] = useState(apoderadoVacio);
  const [matricula, setMatricula] = useState(matriculaVacia);

  const [tipoApoderado, setTipoApoderado] = useState<"existente" | "nuevo">(
    "existente",
  );
  const [dniApoderado, setDniApoderado] = useState("");
  const [apoderado, setApoderado] = useState<ApoderadoExistente | null>(null);

  const [paso, setPaso] = useState<1 | 2>(1);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  const [errorApoderado, setErrorApoderado] = useState("");
  const [errorMatricula, setErrorMatricula] = useState("");
  const [mensaje, setMensaje] = useState("");

  const guardandoRef = useRef(false);
  const buscandoRef = useRef(false);
  const formularioRef = useRef<HTMLFormElement>(null);
  const tituloPasoRef = useRef<HTMLHeadingElement>(null);

  const validacion = useValidacion();
  const anioLectivo = new Date().getFullYear();

  function cambiarPaso(nuevo: 1 | 2) {
    setPaso(nuevo);

    requestAnimationFrame(() => {
      tituloPasoRef.current?.focus();
    });
  }

  async function buscarApoderado() {
    if (buscandoRef.current) return;

    setErrorApoderado("");
    setApoderado(null);

    if (!/^\d{8}$/.test(dniApoderado)) {
      setErrorApoderado("El DNI del apoderado debe tener 8 dígitos.");
      return;
    }

    buscandoRef.current = true;
    setBuscando(true);

    try {
      const encontrado = await buscarApoderadoPorDni(token, dniApoderado);
      setApoderado(encontrado);
    } catch (fallo: unknown) {
      setErrorApoderado(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo buscar al apoderado. Inténtalo nuevamente.",
      );
    } finally {
      buscandoRef.current = false;
      setBuscando(false);
    }
  }

  function avanzar(formulario: HTMLFormElement) {
    if (buscando) return;

    setErrorApoderado("");

    if (!validacion.validar(formulario)) return;

    if (tipoApoderado === "existente" && !apoderado) {
      setErrorApoderado("Busca al apoderado registrado antes de continuar.");
      return;
    }

    cambiarPaso(2);
  }

  async function registrar(formulario: HTMLFormElement) {
    if (guardandoRef.current || registrada) return;

    setErrorMatricula("");
    setMensaje("");

    if (!validacion.validar(formulario)) return;

    const gradosPermitidos = GRADOS_POR_NIVEL[matricula.nivel];

    if (!gradosPermitidos || !gradosPermitidos.includes(matricula.grado)) {
      setErrorMatricula("Selecciona un nivel y un grado válidos.");
      return;
    }

    const dia = Number(matricula.fechaVencimiento);

    if (
      !matricula.fechaVencimiento ||
      !Number.isInteger(dia) ||
      dia < 1 ||
      dia > 31
    ) {
      setErrorMatricula("Selecciona el día de vencimiento de la pensión.");
      return;
    }

    if (tipoApoderado === "existente" && !apoderado) {
      setErrorMatricula("Vuelve al paso anterior y busca al apoderado.");
      return;
    }

    const datosEstudiante = {
      dni: estudiante.dni,
      nombres: estudiante.nombres.trim(),
      apellidos: estudiante.apellidos.trim(),
      fechaNacimiento: estudiante.fechaNacimiento,
      direccion: estudiante.direccion.trim(),
    };

    const estudianteRequest: InscripcionRequest["estudiante"] =
      tipoApoderado === "existente" && apoderado
        ? {
            ...datosEstudiante,
            idApoderado: apoderado.id,
          }
        : {
            ...datosEstudiante,
            apoderadoNuevo: {
              dni: nuevoApoderado.dni,
              nombre: nuevoApoderado.nombre.trim(),
              apellidos: nuevoApoderado.apellidos.trim(),
              ...(nuevoApoderado.telefono.trim() && {
                telefono: nuevoApoderado.telefono.trim(),
              }),
              ...(nuevoApoderado.email.trim() && {
                email: nuevoApoderado.email.trim(),
              }),
              ...(nuevoApoderado.parentesco.trim() && {
                parentesco: nuevoApoderado.parentesco.trim(),
              }),
            },
          };

    const datos: InscripcionRequest = {
      estudiante: estudianteRequest,
      anioLectivo,
      nivel: matricula.nivel,
      grado: matricula.grado.trim(),
      montoMatricula: Number(matricula.montoMatricula),
      montoPensionMensual: Number(matricula.montoPensionMensual),
      fechaVencimiento: dia,
    };

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const resultado = await crearInscripcion(token, datos);

      setMensaje(
        `Matrícula registrada para ${resultado.estudiante.nombres} ${resultado.estudiante.apellidos}.`,
      );
      setRegistrada(true);
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

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (paso === 1) {
      avanzar(evento.currentTarget);
    } else {
      void registrar(evento.currentTarget);
    }
  }

  return (
    <form
      ref={formularioRef}
      className="inscripcion"
      onSubmit={enviar}
      {...validacion.eventos}
      noValidate
      aria-busy={guardando}
    >
      <p className="inscripcion__progreso">
        Paso {paso} de 2 —{" "}
        {paso === 1 ? "Estudiante y apoderado" : "Datos de matrícula"}
      </p>

      {paso === 1 ? (
        <div className="inscripcion__tarjeta">
          <h2 ref={tituloPasoRef} tabIndex={-1}>
            Datos del estudiante
          </h2>

          <div className="inscripcion__campos">
            {camposEstudiante.map((campo) => {
              const id = `inscripcion-${campo.clave}`;

              return (
                <CampoEntrada
                  key={campo.clave}
                  id={id}
                  etiqueta={campo.etiqueta}
                  type={campo.tipo ?? "text"}
                  value={estudiante[campo.clave]}
                  onChange={(evento) => {
                    const valor = campo.digitos
                      ? limpiarDigitos(evento.target.value, campo.digitos)
                      : evento.target.value;

                    setEstudiante((actual) => ({
                      ...actual,
                      [campo.clave]: valor,
                    }));
                  }}
                  required={campo.requerido}
                  inputMode={campo.digitos ? "numeric" : undefined}
                  pattern={campo.digitos ? "[0-9]{8}" : undefined}
                  data-mensaje-patron="El DNI debe tener 8 dígitos."
                  maxLength={campo.digitos}
                  max={campo.tipo === "date" ? fechaHoy() : undefined}
                  error={validacion.errores[id]}
                />
              );
            })}
          </div>

          <fieldset className="inscripcion__seleccion" disabled={buscando}>
            <legend>Apoderado</legend>

            <label>
              <input
                type="radio"
                name="tipo-apoderado"
                checked={tipoApoderado === "existente"}
                onChange={() => {
                  setTipoApoderado("existente");
                  setErrorApoderado("");
                }}
              />
              Ya está registrado
            </label>

            <label>
              <input
                type="radio"
                name="tipo-apoderado"
                checked={tipoApoderado === "nuevo"}
                onChange={() => {
                  setTipoApoderado("nuevo");
                  setErrorApoderado("");
                }}
              />
              Registrar nuevo
            </label>
          </fieldset>

          {tipoApoderado === "existente" ? (
            <div className="inscripcion__apoderado">
              <CampoEntrada
                id="inscripcion-apoderado-dni"
                etiqueta="DNI del apoderado"
                value={dniApoderado}
                onChange={(evento) => {
                  setDniApoderado(limpiarDigitos(evento.target.value, 8));
                  setApoderado(null);
                  setErrorApoderado("");
                }}
                inputMode="numeric"
                pattern="[0-9]{8}"
                data-mensaje-patron="El DNI debe tener 8 dígitos."
                maxLength={8}
                error={validacion.errores["inscripcion-apoderado-dni"]}
                disabled={buscando}
                required
              />

              <Boton
                onClick={() => void buscarApoderado()}
                cargando={buscando}
                textoCargando="Buscando..."
              >
                Buscar apoderado
              </Boton>

              {apoderado && (
                <p className="inscripcion__confirmacion" role="status">
                  Apoderado encontrado: {apoderado.nombre} {apoderado.apellidos}
                  .
                </p>
              )}
            </div>
          ) : (
            <div className="inscripcion__apoderado">
              <h3>Datos del nuevo apoderado</h3>

              <div className="inscripcion__campos">
                {camposApoderado.map((campo) => {
                  const id = `nuevo-apoderado-${campo.clave}`;

                  return (
                    <CampoEntrada
                      key={campo.clave}
                      id={id}
                      etiqueta={campo.etiqueta}
                      type={campo.tipo ?? "text"}
                      value={nuevoApoderado[campo.clave]}
                      onChange={(evento) => {
                        const valor = campo.digitos
                          ? limpiarDigitos(evento.target.value, campo.digitos)
                          : evento.target.value;

                        setNuevoApoderado((actual) => ({
                          ...actual,
                          [campo.clave]: valor,
                        }));
                      }}
                      required={campo.requerido}
                      inputMode={campo.digitos ? "numeric" : undefined}
                      pattern={
                        campo.digitos ? `[0-9]{${campo.digitos}}` : undefined
                      }
                      data-mensaje-patron={
                        campo.clave === "telefono"
                          ? "El teléfono debe tener 9 dígitos."
                          : "El DNI debe tener 8 dígitos."
                      }
                      maxLength={campo.digitos}
                      error={validacion.errores[id]}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {errorApoderado && (
            <p className="inscripcion__error" role="alert">
              {errorApoderado}
            </p>
          )}

          <div className="inscripcion__acciones">
            <Boton type="submit" variante="principal" disabled={buscando}>
              Continuar
            </Boton>
          </div>
        </div>
      ) : (
        <div className="inscripcion__tarjeta">
          <h2 ref={tituloPasoRef} tabIndex={-1}>
            Datos de matrícula
          </h2>

          <p className="inscripcion__resumen">
            {estudiante.nombres} {estudiante.apellidos} · Año {anioLectivo}
          </p>

          <fieldset
            className="inscripcion__datos"
            disabled={guardando || registrada}
          >
            <legend className="solo-lectores">
              Configuración de matrícula
            </legend>

            <div className="inscripcion__campos">
              <div className="campo">
                <label className="campo__etiqueta" htmlFor="inscripcion-nivel">
                  Nivel
                </label>
                <select
                  id="inscripcion-nivel"
                  className="campo__entrada"
                  value={matricula.nivel}
                  onChange={(evento) => {
                    setMatricula((actual) => ({
                      ...actual,
                      nivel: evento.target.value,
                      grado: "",
                    }));
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
                <label className="campo__etiqueta" htmlFor="inscripcion-grado">
                  Grado
                </label>

                <select
                  id="inscripcion-grado"
                  className="campo__entrada"
                  value={matricula.grado}
                  onChange={(evento) => {
                    setMatricula((actual) => ({
                      ...actual,
                      grado: evento.target.value,
                    }));
                    setErrorMatricula("");
                  }}
                  disabled={!matricula.nivel}
                  required
                  aria-describedby="inscripcion-grado-ayuda"
                >
                  <option value="">
                    {matricula.nivel
                      ? "Selecciona un grado"
                      : "Selecciona primero el nivel"}
                  </option>

                  {(GRADOS_POR_NIVEL[matricula.nivel] ?? []).map((grado) => (
                    <option key={grado} value={grado}>
                      {grado}
                    </option>
                  ))}
                </select>

                <p className="campo__ayuda" id="inscripcion-grado-ayuda">
                  Los grados disponibles dependen del nivel seleccionado.
                </p>
              </div>

              <CampoEntrada
                id="inscripcion-monto"
                etiqueta="Monto de matrícula (S/)"
                type="number"
                min="0.01"
                step="0.01"
                value={matricula.montoMatricula}
                onChange={(evento) => {
                  setMatricula((actual) => ({
                    ...actual,
                    montoMatricula: evento.target.value,
                  }));
                }}
                error={validacion.errores["inscripcion-monto"]}
                required
              />

              <CampoEntrada
                id="inscripcion-pension"
                etiqueta="Pensión mensual (S/)"
                type="number"
                min="0.01"
                step="0.01"
                value={matricula.montoPensionMensual}
                onChange={(evento) => {
                  setMatricula((actual) => ({
                    ...actual,
                    montoPensionMensual: evento.target.value,
                  }));
                }}
                error={validacion.errores["inscripcion-pension"]}
                required
              />

              <div className="campo">
                <label
                  className="campo__etiqueta"
                  htmlFor="inscripcion-vencimiento"
                >
                  Día de vencimiento de la pensión
                </label>

                <select
                  id="inscripcion-vencimiento"
                  className="campo__entrada"
                  value={matricula.fechaVencimiento}
                  onChange={(evento) => {
                    setMatricula((actual) => ({
                      ...actual,
                      fechaVencimiento: evento.target.value,
                    }));
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

          {!registrada && (
            <div className="inscripcion__acciones">
              <Boton onClick={() => cambiarPaso(1)} disabled={guardando}>
                Volver
              </Boton>

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

          {mensaje && (
            <p className="inscripcion__confirmacion" role="status">
              {mensaje}
            </p>
          )}

          {registrada && (
            <Boton
              variante="principal"
              onClick={() => {
                setEstudiante(estudianteVacio);
                setNuevoApoderado(apoderadoVacio);
                setMatricula(matriculaVacia);
                setTipoApoderado("existente");
                setDniApoderado("");
                setApoderado(null);
                setErrorApoderado("");
                setErrorMatricula("");
                setMensaje("");
                setRegistrada(false);
                cambiarPaso(1);
              }}
            >
              Nueva inscripción
            </Boton>
          )}
        </div>
      )}
    </form>
  );
}
