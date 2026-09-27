import { useState } from "react";
import { AppRoutes } from "./app/routes/AppRoutes";
import type { LoginResponse } from "./features/auth/auth.types";

function App() {
  const [sesion, setSesion] = useState<LoginResponse | null> (null)

  return (
    <AppRoutes
      sesion={sesion}
      onLogin={setSesion}
      onLogout={() => setSesion(null)}
    />
  )
}

export default App