import { Navigate, Outlet, Route, Routes } from "react-router";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import type { LoginResponse } from "../../features/auth/auth.types";
import { AdminLayout } from "../../layouts/admin/AdminLayout";
import { AdminDashboardPage } from "../../features/dashboard/pages/AdminDashboardPage";
import { EstudiantesPage } from "../../features/estudiantes/pages/EstudiantesPage";
import { NuevaMatriculaPage } from "../../features/matriculas/pages/NuevaMatriculaPage";
import { MatriculasPage } from "../../features/matriculas/pages/MatriculasPage";
import { PensionesPage } from "../../features/pensiones/pages/PensionesPage";
import { DocentesPage } from "../../features/docentes/pages/DocentesPage";
import { PagosDocentesPage } from "../../features/pagos-docentes/pages/PagosDocentesPage";
import { CursosPage } from "../../features/cursos/pages/CursosPage";
import { MovimientosFinancierosPage } from "../../features/movimientos-financieros/pages/MovimientosFinancierosPage";
import { ReporteFinancieroPage } from "../../features/reportes-financieros/pages/ReporteFinancieroPage";
import { BoletasPage } from "../../features/boletas/pages/BoletasPage";
import { DocenteLayout } from "../../layouts/docente/DocenteLayout";
import { DocenteDashboardPage } from "../../features/dashboard/pages/DocenteDashboardPage";

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
                <DocenteDashboardPage key={sesion.token} token={sesion.token} />
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
  );
}
