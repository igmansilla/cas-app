import { useState } from "react";
import { Phone, MapPin, User, AlertTriangle, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useActualizarPerfil } from "../../hooks/useActualizarPerfil";
import type { Usuario, ActualizarPerfilRequest } from "../../api/schemas/usuario";

// Relaciones para contacto de emergencia
const RELACIONES = [
    { value: "madre", label: "Madre" },
    { value: "padre", label: "Padre" },
    { value: "abuelo", label: "Abuelo/a" },
    { value: "tio", label: "Tío/a" },
    { value: "hermano", label: "Hermano/a mayor" },
    { value: "otro", label: "Otro familiar" },
];

interface WizardCompletarPerfilProps {
    usuario: Usuario;
    onComplete: () => void;
    onSkip?: () => void;
}

export function WizardCompletarPerfil({ usuario, onComplete, onSkip }: WizardCompletarPerfilProps) {
    // Determinar tipo de usuario basado en roles
    const esAcampante = usuario.roles.includes("ACAMPANTE") || usuario.roles.includes("HIJO");
    const totalPasos = esAcampante ? 2 : 2;
    
    const [paso, setPaso] = useState(1);
    const [formData, setFormData] = useState<ActualizarPerfilRequest>({
        telefono: usuario.telefono || "",
        direccion: usuario.direccion || "",
        localidad: usuario.localidad || "",
        fechaNacimiento: usuario.fechaNacimiento || "",
        contactoEmergenciaNombre: usuario.contactoEmergenciaNombre || "",
        contactoEmergenciaTelefono: usuario.contactoEmergenciaTelefono || "",
        contactoEmergenciaRelacion: usuario.contactoEmergenciaRelacion || "",
    });
    
    const actualizarPerfil = useActualizarPerfil();

    const updateField = (field: keyof ActualizarPerfilRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Filtrar campos vacíos
        const dataToSend = Object.fromEntries(
            Object.entries(formData).filter(([_, v]) => v && v.trim() !== "")
        ) as ActualizarPerfilRequest;

        try {
            await actualizarPerfil.mutateAsync(dataToSend);
            onComplete();
        } catch (error) {
            console.error("Error actualizando perfil:", error);
        }
    };

    const canProceed = () => {
        if (paso === 1) {
            // Teléfono es obligatorio para todos
            if (!formData.telefono?.trim()) return false;
            // Para acampantes, fecha de nacimiento también es obligatoria
            if (esAcampante && !formData.fechaNacimiento) return false;
            return true;
        }
        if (paso === 2 && esAcampante) {
            // Contacto de emergencia obligatorio para acampantes
            return formData.contactoEmergenciaNombre?.trim() && formData.contactoEmergenciaTelefono?.trim();
        }
        return true;
    };

    const handleNext = () => {
        if (paso < totalPasos) {
            setPaso(paso + 1);
        } else {
            handleSubmit();
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <Card className="animate-in fade-in duration-300">
                    <CardHeader>
                        {/* Progress indicator */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPasos }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                            i + 1 < paso
                                                ? "bg-emerald-500 text-white"
                                                : i + 1 === paso
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {i + 1 < paso ? <Check className="w-4 h-4" /> : i + 1}
                                    </div>
                                ))}
                            </div>
                            {onSkip && (
                                <Button variant="ghost" size="sm" onClick={onSkip}>
                                    Omitir
                                </Button>
                            )}
                        </div>

                        <div className="text-4xl mb-2">
                            {paso === 1 && (esAcampante ? "🎒" : "📱")}
                            {paso === 2 && (esAcampante ? "🆘" : "📍")}
                        </div>
                        <CardTitle className="text-xl">
                            {paso === 1 && (esAcampante ? "Contanos sobre vos" : "¿Cómo te contactamos?")}
                            {paso === 2 && (esAcampante ? "Contacto de emergencia" : "¿Dónde vivís?")}
                        </CardTitle>
                        <CardDescription>
                            {paso === 1 && (esAcampante 
                                ? "Necesitamos algunos datos básicos para inscribirte"
                                : "Tu teléfono nos sirve para mantenerte informado"
                            )}
                            {paso === 2 && (esAcampante
                                ? "¿A quién llamamos si pasa algo durante el campamento?"
                                : "Esta info es opcional pero nos ayuda mucho"
                            )}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Paso 1: Datos básicos */}
                        {paso === 1 && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="telefono" className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Teléfono celular *
                                    </Label>
                                    <Input
                                        id="telefono"
                                        type="tel"
                                        placeholder="Ej: 11 2345-6789"
                                        value={formData.telefono}
                                        onChange={(e) => updateField("telefono", e.target.value)}
                                        className="text-lg"
                                    />
                                </div>

                                {esAcampante && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fechaNacimiento" className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Fecha de nacimiento *
                                        </Label>
                                        <Input
                                            id="fechaNacimiento"
                                            type="date"
                                            value={formData.fechaNacimiento}
                                            onChange={(e) => updateField("fechaNacimiento", e.target.value)}
                                            className="text-lg"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Paso 2 para Acampantes: Contacto de emergencia */}
                        {paso === 2 && esAcampante && (
                            <>
                                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                                    <AlertTriangle className="w-4 h-4 inline-block mr-2" />
                                    Es obligatorio para participar del campamento
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactoNombre" className="flex items-center gap-2">
                                        Nombre completo *
                                    </Label>
                                    <Input
                                        id="contactoNombre"
                                        placeholder="Ej: María García"
                                        value={formData.contactoEmergenciaNombre}
                                        onChange={(e) => updateField("contactoEmergenciaNombre", e.target.value)}
                                        className="text-lg"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactoTelefono" className="flex items-center gap-2">
                                        Teléfono *
                                    </Label>
                                    <Input
                                        id="contactoTelefono"
                                        type="tel"
                                        placeholder="Ej: 11 9876-5432"
                                        value={formData.contactoEmergenciaTelefono}
                                        onChange={(e) => updateField("contactoEmergenciaTelefono", e.target.value)}
                                        className="text-lg"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactoRelacion">Parentesco</Label>
                                    <Select
                                        value={formData.contactoEmergenciaRelacion}
                                        onValueChange={(v) => updateField("contactoEmergenciaRelacion", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="¿Quién es?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RELACIONES.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {/* Paso 2 para Padres: Dirección (opcional) */}
                        {paso === 2 && !esAcampante && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="direccion" className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Dirección
                                    </Label>
                                    <Input
                                        id="direccion"
                                        placeholder="Ej: Av. Corrientes 1234"
                                        value={formData.direccion}
                                        onChange={(e) => updateField("direccion", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="localidad">Localidad / Barrio</Label>
                                    <Input
                                        id="localidad"
                                        placeholder="Ej: Palermo, CABA"
                                        value={formData.localidad}
                                        onChange={(e) => updateField("localidad", e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Navigation buttons */}
                        <div className="flex gap-3 pt-4">
                            {paso > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setPaso(paso - 1)}
                                    className="flex-1"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Anterior
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed() || actualizarPerfil.isPending}
                                className="flex-1"
                            >
                                {actualizarPerfil.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : paso === totalPasos ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Completar
                                    </>
                                ) : (
                                    <>
                                        Siguiente
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
