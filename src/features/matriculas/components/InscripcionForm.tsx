import { useState } from "react";
import { buscarApoderadoPorDni } from "../matriculas.service";
import type { ApoderadoExistente } from "../matriculas.types";
import { crearInscripcion } from "../matriculas.service";
import type { InscripcionRequest } from "../matriculas.types";
import "./InscripcionForm.css";

interface InscripcionFormProps {
  token: string;
}

export function InscripcionForm({ token }: InscripcionFormProps) {
  const [dni, setDni] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoApoderado, setTipoApoderado] = useState<"existente" | "nuevo">(
    "existente",
  );
  const [dniApoderado, setDniApoderado] = useState("");
  const [apoderado, setApoderado] = useState<ApoderadoExistente | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorApoderado, setErrorApoderado] = useState("");
  const [nuevoApoderado, setNuevoApoderado] = useState({
    dni: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    parentesco: "",
  });
  const [paso, setPaso] = useState<1 | 2>(1);
  const anioLectivo = new Date().getFullYear();
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [montoMatricula, setMontoMatricula] = useState("");
  const [montoPensionMensual, setMontoPensionMensual] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [errorMatricula, setErrorMatricula] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [registrada, setRegistrada] = useState(false);

  async function buscarApoderado() {
    setErrorApoderado("");
    setApoderado(null);

    if (!/^\d{8}$/.test(dniApoderado)) {
      setErrorApoderado("El DNI debe tener 8 dígitos.");
      return;
    }

    setBuscando(true);

    try {
      const encontrado = await buscarApoderadoPorDni(token, dniApoderado);
      setApoderado(encontrado);
    } catch (fallo) {
      setErrorApoderado(
        fallo instanceof Error
          ? fallo.message
          : "Ocurrió un error al buscar al apoderado.",
      );
    } finally {
      setBuscando(false);
    }
  }

  function avanzar() {
    if (
      !/^\d{8}$/.test(dni) ||
      !nombres.trim() ||
      !apellidos.trim() ||
      !fechaNacimiento
    ) {
      setErrorApoderado(
        "Completa el DNI, nombres, apellidos y fecha de nacimiento del estudiante.",
      );
      return;
    }

    if (tipoApoderado === "existente" && !apoderado) {
      setErrorApoderado("Busca y selecciona un apoderado antes de continuar.");
      return;
    }

    if (
      tipoApoderado === "nuevo" &&
      (!/^\d{8}$/.test(nuevoApoderado.dni) ||
        !nuevoApoderado.nombre.trim() ||
        !nuevoApoderado.apellidos.trim())
    ) {
      setErrorApoderado(
        "Completa el DNI, nombre y apellidos del nuevo apoderado.",
      );
      return;
    }

    setErrorApoderado("");
    setPaso(2);
  }

  function validarMatricula(): boolean {
    const monto = Number(montoMatricula);
    const pension = Number(montoPensionMensual);
    const dia = Number(fechaVencimiento);

    if (!nivel || !grado.trim()) {
      setErrorMatricula("Selecciona el nivel e indica el grado.");
      return false;
    }

    if (
      !montoMatricula ||
      !montoPensionMensual ||
      !Number.isFinite(monto) ||
      !Number.isFinite(pension) ||
      monto <= 0 ||
      pension <= 0
    ) {
      setErrorMatricula(
        "La matrícula y la pensión deben tener montos mayores a cero.",
      );
      return false;
    }

    if (!fechaVencimiento || !Number.isInteger(dia) || dia < 1 || dia > 31) {
      setErrorMatricula("Selecciona un día de vencimiento.");
      return false;
    }

    setErrorMatricula("");
    return true;
  }

  async function registrarMatricula() {
    if (guardando || registrada || !validarMatricula()) return;

    setMensaje("");
    setErrorMatricula("");

    const estudiante: InscripcionRequest["estudiante"] =
      tipoApoderado === "existente" && apoderado
        ? {
            dni,
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            fechaNacimiento,
            direccion: direccion.trim(),
            idApoderado: apoderado.id,
          }
        : {
            dni,
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            fechaNacimiento,
            direccion: direccion.trim(),
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
      estudiante,
      anioLectivo,
      nivel,
      grado: grado.trim(),
      montoMatricula: Number(montoMatricula),
      montoPensionMensual: Number(montoPensionMensual),
      fechaVencimiento: Number(fechaVencimiento),
    };

    setGuardando(true);

    try {
      const resultado = await crearInscripcion(token, datos);
      setMensaje(
        `Matrícula registrada para ${resultado.estudiante.nombres} ${resultado.estudiante.apellidos}.`,
      );
      setRegistrada(true);
    } catch (fallo) {
      setErrorMatricula(
        fallo instanceof Error
          ? fallo.message
          : "No se pudo registrar la matrícula.",
      );
    } finally {
      setGuardando(false);
    }
  }

  function nuevaInscripcion() {
    setDni("");
    setNombres("");
    setApellidos("");
    setFechaNacimiento("");
    setDireccion("");

    setTipoApoderado("existente");
    setDniApoderado("");
    setApoderado(null);
    setNuevoApoderado({
      dni: "",
      nombre: "",
      apellidos: "",
      telefono: "",
      email: "",
      parentesco: "",
    });

    setNivel("");
    setGrado("");
    setMontoMatricula("");
    setMontoPensionMensual("");
    setFechaVencimiento("");

    setErrorApoderado("");
    setErrorMatricula("");
    setMensaje("");
    setRegistrada(false);
    setPaso(1);
  }

  return (
    <div className="inscripcion">
      {paso === 1 && (
        <div className="inscripcion__tarjeta">
          <h2>1. Datos del estudiante</h2>

          <label htmlFor="inscripcion-dni">DNI</label>
          <input
            id="inscripcion-dni"
            value={dni}
            onChange={(evento) =>
              setDni(evento.target.value.replace(/\D/g, "").slice(0, 8))
            }
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            required
          />

          <label htmlFor="inscripcion-nombres">Nombres</label>
          <input
            id="inscripcion-nombres"
            value={nombres}
            onChange={(evento) => setNombres(evento.target.value)}
            required
          />

          <label htmlFor="inscripcion-apellidos">Apellidos</label>
          <input
            id="inscripcion-apellidos"
            value={apellidos}
            onChange={(evento) => setApellidos(evento.target.value)}
            required
          />

          <label htmlFor="inscripcion-fecha">Fecha de nacimiento</label>
          <input
            id="inscripcion-fecha"
            type="date"
            value={fechaNacimiento}
            onChange={(evento) => setFechaNacimiento(evento.target.value)}
            required
          />

          <label htmlFor="inscripcion-direccion">Dirección</label>
          <input
            id="inscripcion-direccion"
            value={direccion}
            onChange={(evento) => setDireccion(evento.target.value)}
          />

          <fieldset>
            <legend>Apoderado</legend>

            <label>
              <input
                type="radio"
                name="tipo-apoderado"
                checked={tipoApoderado === "existente"}
                onChange={() => setTipoApoderado("existente")}
              />
              Existente
            </label>

            <label>
              <input
                type="radio"
                name="tipo-apoderado"
                checked={tipoApoderado === "nuevo"}
                onChange={() => setTipoApoderado("nuevo")}
              />
              Nuevo
            </label>
          </fieldset>

          {tipoApoderado === "existente" && (
            <div className="inscripcion__apoderado">
              <label htmlFor="inscripcion-apoderado-dni">
                DNI del apoderado
              </label>
              <input
                id="inscripcion-apoderado-dni"
                value={dniApoderado}
                onChange={(evento) => {
                  setDniApoderado(
                    evento.target.value.replace(/\D/g, "").slice(0, 8),
                  );
                  setApoderado(null);
                }}
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
              />

              <button
                type="button"
                onClick={buscarApoderado}
                disabled={buscando}
              >
                {buscando ? "Buscando..." : "Buscar apoderado"}
              </button>

              {apoderado && (
                <p>
                  Encontrado: {apoderado.nombre} {apoderado.apellidos}
                </p>
              )}
            </div>
          )}

          {tipoApoderado === "nuevo" && (
            <div className="inscripcion__apoderado">
              <label htmlFor="nuevo-apoderado-dni">
                DNI del nuevo apoderado
              </label>
              <input
                id="nuevo-apoderado-dni"
                value={nuevoApoderado.dni}
                onChange={(evento) =>
                  setNuevoApoderado({
                    ...nuevoApoderado,
                    dni: evento.target.value.replace(/\D/g, "").slice(0, 8),
                  })
                }
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                required
              />

              <label htmlFor="nuevo-apoderado-nombre">Nombre</label>
              <input
                id="nuevo-apoderado-nombre"
                value={nuevoApoderado.nombre}
                onChange={(evento) =>
                  setNuevoApoderado({
                    ...nuevoApoderado,
                    nombre: evento.target.value,
                  })
                }
                required
              />

              <label htmlFor="nuevo-apoderado-apellidos">Apellidos</label>
              <input
                id="nuevo-apoderado-apellidos"
                value={nuevoApoderado.apellidos}
                onChange={(evento) =>
                  setNuevoApoderado({
                    ...nuevoApoderado,
                    apellidos: evento.target.value,
                  })
                }
                required
              />

              <label htmlFor="nuevo-apoderado-telefono">Teléfono</label>
              <input
                id="nuevo-apoderado-telefono"
                value={nuevoApoderado.telefono}
                onChange={(evento) =>
                  setNuevoApoderado({
                    ...nuevoApoderado,
                    telefono: evento.target.value
                      .replace(/\D/g, "")
                      .slice(0, 9),
                  })
                }
                inputMode="tel"
                pattern="[0-9]{9}"
                maxLength={9}
              />

              <label htmlFor="nuevo-apoderado-email">Correo electrónico</label>
              <input
                id="nuevo-apoderado-email"
                type="email"
                value={nuevoApoderado.email}
                onChange={(evento) =>
                  setNuevoApoderado({
                    ...nuevoApoderado,
                    email: evento.target.value,
                  })
                }
              />

              <label htmlFor="nuevo-apoderado-parentesco">Parentesco</label>
              <input
                id="nuevo-apoderado-parentesco"
                value={nuevoApoderado.parentesco}
                onChange={(evento) =>
                  setNuevoApoderado({
                    ...nuevoApoderado,
                    parentesco: evento.target.value,
                  })
                }
              />
            </div>
          )}

          {errorApoderado && <p role="alert">{errorApoderado}</p>}

          <button
            type="button"
            className="inscripcion__boton-secundario"
            onClick={avanzar}
          >
            Siguiente
          </button>
        </div>
      )}

      {paso === 2 && (
        <div className="inscripcion__tarjeta">
          <h2>2. Configuración de matrícula</h2>

          <p>Año lectivo: {anioLectivo}</p>

          <label htmlFor="nivel">Nivel</label>
          <select
            id="nivel"
            value={nivel}
            onChange={(evento) => {
              setNivel(evento.target.value);
              setGrado("");
            }}
            disabled={registrada}
          >
            <option value="">Selecciona un nivel</option>
            <option value="INICIAL">Inicial</option>
            <option value="PRIMARIA">Primaria</option>
          </select>

          <label htmlFor="grado">Grado</label>
          <input
            id="grado"
            value={grado}
            onChange={(evento) => setGrado(evento.target.value)}
            placeholder="Ejemplo: 3"
            disabled={registrada}
          />

          <label htmlFor="monto-matricula">Monto de matrícula (S/)</label>
          <input
            id="monto-matricula"
            type="number"
            min="0.01"
            step="0.01"
            value={montoMatricula}
            onChange={(evento) => setMontoMatricula(evento.target.value)}
            disabled={registrada}
          />

          <label htmlFor="monto-pension">Pensión mensual (S/)</label>
          <input
            id="monto-pension"
            type="number"
            min="0.01"
            step="0.01"
            value={montoPensionMensual}
            onChange={(evento) => setMontoPensionMensual(evento.target.value)}
            disabled={registrada}
          />

          <label htmlFor="fecha-vencimiento">
            Día de vencimiento de la pensión
          </label>
          <select
            id="fecha-vencimiento"
            value={fechaVencimiento}
            onChange={(evento) => setFechaVencimiento(evento.target.value)}
            disabled={registrada}
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

          {errorMatricula && <p role="alert">{errorMatricula}</p>}

          <div className="inscripcion__acciones">
            <button
              type="button"
              className="inscripcion__boton-secundario"
              onClick={() => setPaso(1)}
              disabled={guardando || registrada}
            >
              Volver
            </button>

            <button
              type="button"
              onClick={registrarMatricula}
              disabled={guardando || registrada}
            >
              {guardando
                ? "Registrando..."
                : registrada
                  ? "Matrícula registrada"
                  : "Registrar matrícula"}
            </button>
          </div>

          {mensaje && <p role="status">{mensaje}</p>}

          {registrada && (
            <button type="button" onClick={nuevaInscripcion}>
              Nueva inscripción
            </button>
          )}
        </div>
      )}
    </div>
  );
}
