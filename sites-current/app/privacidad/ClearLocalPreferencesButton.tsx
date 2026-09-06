"use client";

import { useState } from "react";
import { clearLocalPreferences } from "@/lib/local-preferences";

export function ClearLocalPreferencesButton({
  compact = false,
  language = "both",
}: {
  compact?: boolean;
  language?: "es" | "en" | "both";
}) {
  const [failed, setFailed] = useState(false);
  const [cleared, setCleared] = useState(false);
  const label = language === "es"
    ? "Borrar preferencias locales"
    : language === "en"
      ? "Clear local preferences"
      : "Borrar preferencias locales / Clear local preferences";
  const success = language === "es"
    ? "Preferencias borradas de este navegador."
    : language === "en"
      ? "Preferences cleared from this browser."
      : "Preferencias borradas de este navegador. / Preferences cleared from this browser.";

  function clearPreferences() {
    const success = clearLocalPreferences();
    setCleared(success);
    setFailed(!success);
  }

  return (
    <div className={compact ? "privacy-clear-control compact" : "privacy-clear-control"}>
      <button type="button" onClick={clearPreferences}>{label}</button>
      <p role="status" aria-live="polite">
        {failed ? (language === "en" ? "Browser storage is unavailable. Clear site data in browser settings." : "El almacenamiento está bloqueado. Borra los datos del sitio desde el navegador.") : cleared ? success : compact ? "" : "Elimina solo las preferencias que ABCM guarda en este dispositivo."}
      </p>
    </div>
  );
}
