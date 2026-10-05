import { Navigate, Route, Routes } from "react-router";
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

interface AppRoutesProps {
  sesion: LoginResponse | null;
  onLogin: (sesion: LoginResponse) => void;
  onLogout: () => void;
}

export function AppRoutes({ sesion, onLogin, onLogout }: AppRoutesProps) {
  const rutaDelRol = sesion?.rol === "ADMIN" ? "/admin" : "/docente";

  return (
    <Routes>
      <Route
        path="/login"
        element={
          sesion ? (
            <Navigate to={rutaDelRol} replace />
          ) : (
            <LoginPage onLogin={onLogin} />
          )
        }
      />

      <Route
        path="/admin"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <AdminDashboardPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/estudiantes"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <EstudiantesPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/matriculas/nueva"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <NuevaMatriculaPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/matriculas"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <MatriculasPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/pensiones"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <PensionesPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/docentes"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <DocentesPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/pagos-docentes"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <PagosDocentesPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/cursos"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <CursosPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/movimientos-financieros"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <MovimientosFinancierosPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/reportes-financieros"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <ReporteFinancieroPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/admin/boletas"
        element={
          sesion?.rol === "ADMIN" ? (
            <AdminLayout onLogout={onLogout}>
              <BoletasPage token={sesion.token} />
            </AdminLayout>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="/docente"
        element={
          sesion?.rol === "DOCENTE" ? (
            <main>
              <h1>Panel del docente</h1>
              <button type="button" onClick={onLogout}>
                Cerrar sesión
              </button>
            </main>
          ) : (
            <Navigate to={sesion ? rutaDelRol : "/login"} replace />
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to={sesion ? rutaDelRol : "/login"} replace />}
      />
    </Routes>
  );
}
