import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Tent, Users, ArrowLeft, Loader2, Copy, Check, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useCrearFamilia, useUnirseConCodigo, useValidarCodigo } from "../../hooks/useFamilia";
import { toast } from "sonner";
import type { MiFamilia } from "../../api/schemas/familia";

type OnboardingStep = "select" | "crear" | "unirse" | "success";
// Roles disponibles al crear familia
const ROLES_CREADOR = [
    { value: "PADRE", label: "Soy Padre/Madre/Tutor" },
    { value: "HIJO", label: "Soy Acampante (hijo/a)" },
];

// Roles disponibles al unirse a familia
const ROLES_UNIRSE = [
    { value: "PADRE", label: "Padre" },
    { value: "MADRE", label: "Madre" },
    { value: "TUTOR_LEGAL", label: "Tutor Legal" },
    { value: "HIJO", label: "Hijo/a" },
    { value: "ABUELO", label: "Abuelo/a" },
    { value: "OTRO", label: "Otro familiar" },
];

interface OnboardingWizardProps {
    codigoInicial?: string;
}

export function OnboardingWizard({ codigoInicial }: OnboardingWizardProps) {
    // Si viene con código, ir directo al paso de unirse
    const [step, setStep] = useState<OnboardingStep>(codigoInicial ? "unirse" : "select");
    const [familiaCreada, setFamiliaCreada] = useState<MiFamilia | null>(null);
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {step === "select" && (
                    <SelectionStep
                        onCrear={() => setStep("crear")}
                        onUnirse={() => setStep("unirse")}
                    />
                )}
                {step === "crear" && (
                    <CrearFamiliaStep
                        onBack={() => setStep("select")}
                        onSuccess={(familia) => {
                            setFamiliaCreada(familia);
                            setStep("success");
                        }}
                    />
                )}
                {step === "unirse" && (
                    <UnirseStep
                        codigoInicial={codigoInicial}
                        onBack={() => setStep("select")}
                        onSuccess={() => {
                            toast.success("¡Te has unido a la familia!");
                            navigate({ to: "/dashboard" });
                        }}
                    />
                )}
                {step === "success" && familiaCreada && (
                    <SuccessStep
                        familia={familiaCreada}
                        onContinue={() => navigate({ to: "/dashboard" })}
                    />
                )}
            </div>
        </div>
    );
}

// Step 1: Selection
function SelectionStep({ onCrear, onUnirse }: { onCrear: () => void; onUnirse: () => void }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
                <div className="text-5xl mb-2">🏕️</div>
                <h1 className="text-3xl font-bold tracking-tight">
                    ¡Bienvenido al Campamento!
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Esta app te ayuda a gestionar inscripciones y pagos.
                    Primero, vamos a conectarte con tu familia.
                </p>
            </div>

            <div className="grid gap-4">
                <Card
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-emerald-400 group border-2"
                    onClick={onCrear}
                >
                    <CardHeader className="pb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                            <Tent className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="text-xl">Crear grupo familiar ✨</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                            Creá tu grupo familiar y recibí un <strong>código único</strong> de 6 caracteres
                            para compartir con el resto de tu familia.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-400 group border-2"
                    onClick={onUnirse}
                >
                    <CardHeader className="pb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="text-xl">Ya tengo un código �</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                            ¿Alguien de tu familia ya creó el grupo? Ingresá el <strong>código de 6 caracteres</strong> que
                            te compartieron para vincularte.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}

// Step 2A: Crear grupo familiar
function CrearFamiliaStep({ onBack, onSuccess }: { onBack: () => void; onSuccess: (familia: MiFamilia) => void }) {
    const [apellidoFamilia, setApellidoFamilia] = useState("");
    const [rol, setRol] = useState("PADRE");
    const crearFamilia = useCrearFamilia();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apellidoFamilia.trim()) {
            toast.error("Por favor ingresa tu apellido");
            return;
        }

        const nombreFamilia = `Familia ${apellidoFamilia.trim()}`;

        try {
            const familia = await crearFamilia.mutateAsync({ nombreFamilia });
            onSuccess(familia);
        } catch (error: unknown) {
            console.error("Error creando familia:", error);
            const message = error instanceof Error ? error.message : "";
            if (message.includes("ya pertenece") || message.includes("ya tiene")) {
                toast.error("Ya perteneces a una familia. Redirigiendo...");
                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            } else {
                toast.error("Error al crear la familia. Intenta nuevamente.");
            }
        }
    };

    return (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit -ml-2 mb-2"
                    onClick={onBack}
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver
                </Button>
                <div className="text-3xl mb-1">🎉</div>
                <CardTitle>Creemos tu grupo familiar</CardTitle>
                <CardDescription className="leading-relaxed">
                    Una vez creado, vas a recibir un <strong>código único</strong> para compartir
                    con el resto de tu familia.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rol">¿Quién sos en la familia?</Label>
                        <Select value={rol} onValueChange={setRol} disabled={crearFamilia.isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES_CREADOR.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="apellidoFamilia">¿Cuál es el apellido familiar?</Label>
                        <Input
                            id="apellidoFamilia"
                            placeholder="Ej: García, López, Martínez"
                            value={apellidoFamilia}
                            onChange={(e) => setApellidoFamilia(e.target.value)}
                            disabled={crearFamilia.isPending}
                            className="text-lg"
                        />
                        {apellidoFamilia && (
                            <p className="text-sm text-muted-foreground">
                                Tu grupo se llamará <strong>"Familia {apellidoFamilia}"</strong>
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base"
                        disabled={crearFamilia.isPending || !apellidoFamilia.trim()}
                    >
                        {crearFamilia.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            "🚀 Crear y Obtener mi Código"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// Step Success: Shows the family code
function SuccessStep({ familia, onContinue }: { familia: MiFamilia; onContinue: () => void }) {
    const [copied, setCopied] = useState(false);
    const codigo = familia.codigoVinculacion || "";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codigo);
            setCopied(true);
            toast.success("¡Código copiado!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("No se pudo copiar");
        }
    };

    const handleShare = () => {
        // URL con el código como parámetro - cuando el familiar haga click, irá directo al onboarding con el código
        const inviteUrl = `${window.location.origin}/onboarding?codigo=${codigo}`;

        // Formato optimizado para WhatsApp - link primero para mejor clickeabilidad
        const shareText = `🏕️ *Campamento - Vinculación Familiar*

Usá este link para vincularte:
👉 ${inviteUrl}

Código: *${codigo}*`;

        // Abrimos WhatsApp con el mensaje preparado
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Card className="animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="text-center pb-2">
                <div className="text-6xl mb-4">🎊</div>
                <CardTitle className="text-2xl">¡Listo! Tu familia está creada</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                    Compartí este código con tus papás para que puedan vincularse a tu cuenta.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Código prominente */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-xl p-6 text-center border-2 border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-muted-foreground mb-2">Tu código familiar es:</p>
                    <div className="text-4xl md:text-5xl font-mono font-bold tracking-[0.3em] text-emerald-700 dark:text-emerald-400">
                        {codigo}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-1 text-emerald-600" />
                                ¡Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copiar código
                            </>
                        )}
                    </Button>
                </div>

                {/* Instrucciones */}
                <div className="text-sm text-muted-foreground space-y-2 bg-muted/50 rounded-lg p-4">
                    <p className="font-medium text-foreground">📱 ¿Cómo lo comparto?</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                        <li>Copiá o compartí el código con tus papás</li>
                        <li>Ellos entran a la app y eligen "Soy Papá/Mamá"</li>
                        <li>Ingresan este código y listo, quedan vinculados</li>
                    </ol>
                </div>

                {/* Botones de acción */}
                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full h-12"
                        onClick={handleShare}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartir por WhatsApp
                    </Button>

                    <Button
                        className="w-full h-12 text-base"
                        onClick={onContinue}
                    >
                        ✨ Continuar a la App
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


// Step 2B: Unirse a familia con código
function UnirseStep({ codigoInicial, onBack, onSuccess }: { codigoInicial?: string; onBack: () => void; onSuccess: () => void }) {
    const [codigo, setCodigo] = useState(codigoInicial?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "");
    const [rol, setRol] = useState("PADRE");
    const validacion = useValidarCodigo(codigo);
    const unirse = useUnirseConCodigo();

    const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo letras y números, máximo 6 caracteres, auto mayúsculas
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
        setCodigo(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (codigo.length !== 6) {
            toast.error("El código debe tener 6 caracteres");
            return;
        }

        try {
            await unirse.mutateAsync({ codigo, rol });
            onSuccess();
        } catch (error: unknown) {
            console.error("Error uniéndose a familia:", error);
            const message = error instanceof Error ? error.message : "Error al unirse";
            if (message.includes("ya pertenece")) {
                toast.error("Ya perteneces a una familia");
            } else if (message.includes("inválido")) {
                toast.error("Código inválido");
            } else {
                toast.error("Error al unirse a la familia. Intenta nuevamente.");
            }
        }
    };

    const codigoValido = validacion.data?.valido === true;
    const familiaNombre = validacion.data?.nombreFamilia;

    return (
        <Card className="animate-in fade-in slide-in-from-right-4 duration-300">
            <CardHeader>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit -ml-2 mb-2"
                    onClick={onBack}
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver
                </Button>
                <div className="text-3xl mb-1">👨‍👩‍👧</div>
                <CardTitle>Vinculación Familiar</CardTitle>
                <CardDescription className="leading-relaxed">
                    Tu hijo/a debería haberte compartido un <strong>código de 6 caracteres</strong> (letras y números).
                    Ingresalo abajo para conectarte a su grupo familiar y poder seguir su experiencia en el campamento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="codigo">Código de Vinculación</Label>
                        <Input
                            id="codigo"
                            placeholder="ABC123"
                            value={codigo}
                            onChange={handleCodigoChange}
                            disabled={unirse.isPending}
                            className="text-center text-2xl font-mono tracking-widest"
                            maxLength={6}
                        />

                        {/* Validación en tiempo real */}
                        {codigo.length === 6 && (
                            <div className="text-sm">
                                {validacion.isLoading && (
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Verificando...
                                    </span>
                                )}
                                {codigoValido && familiaNombre && (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        ✓ {familiaNombre}
                                    </span>
                                )}
                                {validacion.data && !codigoValido && (
                                    <span className="text-destructive">
                                        ✗ Código no encontrado
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rol">Tu parentesco</Label>
                        <Select value={rol} onValueChange={setRol} disabled={unirse.isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES_UNIRSE.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base"
                        disabled={unirse.isPending || codigo.length !== 6 || !codigoValido}
                    >
                        {unirse.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            "✨ Vincularme a la Familia"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
