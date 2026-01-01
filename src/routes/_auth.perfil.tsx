import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useUsuarioActual } from '../hooks/useUsuarioActual';
import { WizardCompletarPerfil } from '../components/perfil/WizardCompletarPerfil';
import { useActualizarPerfil } from '../hooks/useActualizarPerfil';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
    AlertTriangle, 
    Phone, 
    MapPin, 
    Calendar, 
    Mail, 
    Shield, 
    Edit2, 
    Check, 
    X,
    User,
    AlertCircle
} from 'lucide-react';

export const Route = createFileRoute('/_auth/perfil')({
    component: PerfilPage,
})

function PerfilPage() {
    const { data: usuario, isLoading, error, refetch } = useUsuarioActual();
    const [mostrarWizard, setMostrarWizard] = useState(false);
    const [editandoCampo, setEditandoCampo] = useState<string | null>(null);
    const [valorEditado, setValorEditado] = useState<string>("");
    const actualizarPerfil = useActualizarPerfil();

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Cargando perfil...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <div>
                                <p className="font-medium">Error al cargar perfil</p>
                                <p className="text-sm text-muted-foreground">{error.message}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!usuario) return null;

    // Si el perfil no está completo y el usuario eligió completarlo
    if (mostrarWizard) {
        return (
            <WizardCompletarPerfil
                usuario={usuario}
                onComplete={() => {
                    setMostrarWizard(false);
                    refetch();
                }}
                onSkip={() => setMostrarWizard(false)}
            />
        );
    }

    // Obtener iniciales para avatar fallback
    const iniciales = usuario.nombreMostrar
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??';

    const handleEditar = (campo: string, valorActual: string | undefined | null) => {
        setEditandoCampo(campo);
        setValorEditado(valorActual || "");
    };

    const handleGuardar = async (campo: string) => {
        try {
            await actualizarPerfil.mutateAsync({ [campo]: valorEditado });
            setEditandoCampo(null);
            refetch();
        } catch (e) {
            console.error("Error guardando:", e);
        }
    };

    const handleCancelar = () => {
        setEditandoCampo(null);
        setValorEditado("");
    };

    // Determinar si es acampante
    const esAcampante = usuario.roles.includes("ACAMPANTE") || usuario.roles.includes("HIJO");

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
            {/* Banner de perfil incompleto */}
            {!usuario.perfilCompleto && (
                <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 dark:border-amber-700">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-amber-800 dark:text-amber-200">
                                        Tu perfil está incompleto
                                    </p>
                                    <p className="text-sm text-amber-600 dark:text-amber-400">
                                        {esAcampante 
                                            ? "Completá tus datos para poder inscribirte"
                                            : "Agregá tu teléfono para que podamos contactarte"
                                        }
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => setMostrarWizard(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                            >
                                Completar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Header del perfil */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20 text-xl">
                            <AvatarImage src={usuario.urlFoto || undefined} alt={usuario.nombreMostrar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                {iniciales}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold truncate">{usuario.nombreMostrar}</h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {usuario.email}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {usuario.roles.map(rol => (
                                    <Badge key={rol} variant="secondary">
                                        {rol}
                                    </Badge>
                                ))}
                                <Badge variant={usuario.perfilCompleto ? "default" : "outline"}>
                                    {usuario.perfilCompleto ? "✓ Perfil completo" : "Perfil incompleto"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Datos de contacto */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Phone className="w-5 h-5" />
                        Datos de Contacto
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CampoEditable
                        label="Teléfono"
                        valor={usuario.telefono}
                        campo="telefono"
                        icono={<Phone className="w-4 h-4" />}
                        editando={editandoCampo === "telefono"}
                        valorEditado={valorEditado}
                        onEditar={handleEditar}
                        onGuardar={handleGuardar}
                        onCancelar={handleCancelar}
                        onChange={setValorEditado}
                        isPending={actualizarPerfil.isPending}
                        placeholder="Ej: 11 2345-6789"
                    />
                    <Separator />
                    <CampoEditable
                        label="Dirección"
                        valor={usuario.direccion}
                        campo="direccion"
                        icono={<MapPin className="w-4 h-4" />}
                        editando={editandoCampo === "direccion"}
                        valorEditado={valorEditado}
                        onEditar={handleEditar}
                        onGuardar={handleGuardar}
                        onCancelar={handleCancelar}
                        onChange={setValorEditado}
                        isPending={actualizarPerfil.isPending}
                        placeholder="Ej: Av. Corrientes 1234"
                    />
                    <Separator />
                    <CampoEditable
                        label="Localidad"
                        valor={usuario.localidad}
                        campo="localidad"
                        icono={<MapPin className="w-4 h-4" />}
                        editando={editandoCampo === "localidad"}
                        valorEditado={valorEditado}
                        onEditar={handleEditar}
                        onGuardar={handleGuardar}
                        onCancelar={handleCancelar}
                        onChange={setValorEditado}
                        isPending={actualizarPerfil.isPending}
                        placeholder="Ej: Palermo, CABA"
                    />
                </CardContent>
            </Card>

            {/* Datos personales (solo si es acampante/tiene fecha nacimiento) */}
            {(esAcampante || usuario.fechaNacimiento) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="w-5 h-5" />
                            Datos Personales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                                    <p className="font-medium">
                                        {usuario.fechaNacimiento 
                                            ? new Date(usuario.fechaNacimiento).toLocaleDateString('es-AR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })
                                            : <span className="text-muted-foreground italic">No especificada</span>
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contacto de emergencia (solo si es acampante) */}
            {esAcampante && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="w-5 h-5" />
                            Contacto de Emergencia
                        </CardTitle>
                        <CardDescription>
                            Persona a contactar en caso de emergencia durante el campamento
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {usuario.contactoEmergenciaNombre ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nombre</p>
                                        <p className="font-medium">{usuario.contactoEmergenciaNombre}</p>
                                    </div>
                                    {usuario.contactoEmergenciaRelacion && (
                                        <Badge variant="outline">{usuario.contactoEmergenciaRelacion}</Badge>
                                    )}
                                </div>
                                <Separator />
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Teléfono</p>
                                        <p className="font-medium">{usuario.contactoEmergenciaTelefono}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground mb-3">No tenés contacto de emergencia configurado</p>
                                <Button variant="outline" onClick={() => setMostrarWizard(true)}>
                                    Agregar contacto
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Componente de campo editable inline
interface CampoEditableProps {
    label: string;
    valor: string | null | undefined;
    campo: string;
    icono: React.ReactNode;
    editando: boolean;
    valorEditado: string;
    onEditar: (campo: string, valor: string | null | undefined) => void;
    onGuardar: (campo: string) => void;
    onCancelar: () => void;
    onChange: (valor: string) => void;
    isPending: boolean;
    placeholder?: string;
}

function CampoEditable({
    label,
    valor,
    campo,
    icono,
    editando,
    valorEditado,
    onEditar,
    onGuardar,
    onCancelar,
    onChange,
    isPending,
    placeholder
}: CampoEditableProps) {
    if (editando) {
        return (
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    {icono}
                    {label}
                </Label>
                <div className="flex gap-2">
                    <Input
                        value={valorEditado}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={isPending}
                        autoFocus
                    />
                    <Button
                        size="icon"
                        onClick={() => onGuardar(campo)}
                        disabled={isPending}
                    >
                        <Check className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={onCancelar}
                        disabled={isPending}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{icono}</span>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-medium">
                        {valor || <span className="text-muted-foreground italic">No especificado</span>}
                    </p>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditar(campo, valor)}
            >
                <Edit2 className="w-4 h-4" />
            </Button>
        </div>
    );
}
