import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import type { LoginResponse } from "../../features/auth/auth.types";
import { AdminLayout } from "../../layouts/admin/AdminLayout";
import { DocenteLayout } from "../../layouts/docente/DocenteLayout";

const AdminDashboardPage = lazy(() =>
  import("../../features/dashboard/pages/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const EstudiantesPage = lazy(() =>
  import("../../features/estudiantes/pages/EstudiantesPage").then((m) => ({
    default: m.EstudiantesPage,
  })),
);
const NuevaMatriculaPage = lazy(() =>
  import("../../features/matriculas/pages/NuevaMatriculaPage").then((m) => ({
    default: m.NuevaMatriculaPage,
  })),
);
const MatriculasPage = lazy(() =>
  import("../../features/matriculas/pages/MatriculasPage").then((m) => ({
    default: m.MatriculasPage,
  })),
);
const PensionesPage = lazy(() =>
  import("../../features/pensiones/pages/PensionesPage").then((m) => ({
    default: m.PensionesPage,
  })),
);
const DocentesPage = lazy(() =>
  import("../../features/docentes/pages/DocentesPage").then((m) => ({
    default: m.DocentesPage,
  })),
);
const PagosDocentesPage = lazy(() =>
  import("../../features/pagos-docentes/pages/PagosDocentesPage").then((m) => ({
    default: m.PagosDocentesPage,
  })),
);
const CursosPage = lazy(() =>
  import("../../features/cursos/pages/CursosPage").then((m) => ({
    default: m.CursosPage,
  })),
);
const MovimientosFinancierosPage = lazy(() =>
  import(
    "../../features/movimientos-financieros/pages/MovimientosFinancierosPage"
  ).then((m) => ({
    default: m.MovimientosFinancierosPage,
  })),
);
const ReporteFinancieroPage = lazy(() =>
  import("../../features/reportes-financieros/pages/ReporteFinancieroPage").then(
    (m) => ({
      default: m.ReporteFinancieroPage,
    }),
  ),
);
const BoletasPage = lazy(() =>
  import("../../features/boletas/pages/BoletasPage").then((m) => ({
    default: m.BoletasPage,
  })),
);
const AuditoriaPage = lazy(() =>
  import("../../features/auditoria/pages/AuditoriaPage").then((m) => ({
    default: m.AuditoriaPage,
  })),
);
const DocenteDashboardPage = lazy(() =>
  import("../../features/dashboard/pages/DocenteDashboardPage").then((m) => ({
    default: m.DocenteDashboardPage,
  })),
);
const MisCursosPage = lazy(() =>
  import("../../features/cursos/pages/MisCursosPage").then((m) => ({
    default: m.MisCursosPage,
  })),
);
const CursoDocentePage = lazy(() =>
  import("../../features/cursos/pages/CursoDocentePage").then((m) => ({
    default: m.CursoDocentePage,
  })),
);

interface AppRoutesProps {
  sesion: LoginResponse | null;
  onLogin: (sesion: LoginResponse) => void;
  onLogout: () => void;
}

interface RutaProtegidaProps {
  sesion: LoginResponse | null;
  rolPermitido: LoginResponse["rol"];
}

function obtenerRutaInicial(sesion: LoginResponse | null): string {
  if (!sesion) return "/login";

  return sesion.rol === "ADMIN" ? "/admin" : "/docente";
}

function RutaProtegida({ sesion, rolPermitido }: RutaProtegidaProps) {
  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  if (sesion.rol !== rolPermitido) {
    return <Navigate to={obtenerRutaInicial(sesion)} replace />;
  }

  return <Outlet />;
}

export function AppRoutes({ sesion, onLogin, onLogout }: AppRoutesProps) {
  const rutaInicial = obtenerRutaInicial(sesion);

  return (
    <Suspense
      fallback={
        <p className="estado-listado" role="status">
          Cargando vista...
        </p>
      }
    >
      <Routes>
      <Route
        path="/login"
        element={
          sesion ? (
            <Navigate to={rutaInicial} replace />
          ) : (
            <LoginPage onLogin={onLogin} />
          )
        }
      />

      <Route element={<RutaProtegida sesion={sesion} rolPermitido="ADMIN" />}>
        <Route
          path="/admin"
          element={
            <AdminLayout onLogout={onLogout}>
              <Outlet />
            </AdminLayout>
          }
        >
          {sesion?.rol === "ADMIN" && (
            <>
              <Route
                index
                element={<AdminDashboardPage token={sesion.token} />}
              />

              <Route
                path="estudiantes"
                element={<EstudiantesPage token={sesion.token} />}
              />

              <Route
                path="matriculas/nueva"
                element={<NuevaMatriculaPage token={sesion.token} />}
              />

              <Route
                path="matriculas"
                element={<MatriculasPage token={sesion.token} />}
              />

              <Route
                path="pensiones"
                element={<PensionesPage token={sesion.token} />}
              />

              <Route
                path="docentes"
                element={<DocentesPage token={sesion.token} />}
              />

              <Route
                path="pagos-docentes"
                element={<PagosDocentesPage token={sesion.token} />}
              />

              <Route
                path="cursos"
                element={<CursosPage token={sesion.token} />}
              />

              <Route
                path="movimientos-financieros"
                element={<MovimientosFinancierosPage token={sesion.token} />}
              />

              <Route
                path="reportes-financieros"
                element={<ReporteFinancieroPage token={sesion.token} />}
              />

              <Route
                path="boletas"
                element={<BoletasPage token={sesion.token} />}
              />

              <Route
                path="auditoria"
                element={<AuditoriaPage token={sesion.token} />}
              />
            </>
          )}

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route element={<RutaProtegida sesion={sesion} rolPermitido="DOCENTE" />}>
        <Route
          path="/docente"
          element={
            <DocenteLayout onLogout={onLogout}>
              <Outlet />
            </DocenteLayout>
          }
        >
          <Route
            index
            element={
              sesion?.rol === "DOCENTE" ? (
                <DocenteDashboardPage token={sesion.token} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="cursos"
            element={
              sesion?.rol === "DOCENTE" ? (
                <MisCursosPage key={sesion.token} token={sesion.token} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="cursos/:cursoId"
            element={
              sesion?.rol === "DOCENTE" ? (
                <CursoDocentePage token={sesion.token} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/docente" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={rutaInicial} replace />} />
    </Routes>
    </Suspense>
  );
}
