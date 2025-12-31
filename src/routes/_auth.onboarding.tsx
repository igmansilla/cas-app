import { createFileRoute } from "@tanstack/react-router";
import { OnboardingWizard } from "../components/onboarding/OnboardingWizard";
import { useEffect, useState } from "react";

const CODIGO_STORAGE_KEY = "cas_onboarding_codigo";

// Definimos los search params que acepta esta ruta
type OnboardingSearch = {
    codigo?: string;
};

export const Route = createFileRoute("/_auth/onboarding")({
    validateSearch: (search: Record<string, unknown>): OnboardingSearch => {
        return {
            codigo: typeof search.codigo === 'string' ? search.codigo : undefined,
        };
    },
    component: OnboardingPage,
});

function OnboardingPage() {
    const { codigo: codigoFromUrl } = Route.useSearch();
    const [codigoFinal, setCodigoFinal] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Si viene código en la URL, guardarlo en localStorage
        if (codigoFromUrl) {
            localStorage.setItem(CODIGO_STORAGE_KEY, codigoFromUrl);
            setCodigoFinal(codigoFromUrl);
        } else {
            // Si no viene en URL, intentar recuperar de localStorage
            const storedCodigo = localStorage.getItem(CODIGO_STORAGE_KEY);
            if (storedCodigo) {
                setCodigoFinal(storedCodigo);
                // Limpiar después de usar (solo queremos usarlo una vez)
                localStorage.removeItem(CODIGO_STORAGE_KEY);
            }
        }
    }, [codigoFromUrl]);

    return <OnboardingWizard codigoInicial={codigoFinal} />;
}
