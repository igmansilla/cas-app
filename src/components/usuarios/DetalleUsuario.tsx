import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
} from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { GestorRoles } from './GestorRoles';
import { GestorGrupos } from './GestorGrupos';
import { useGruposUsuario } from '../../hooks/useGrupos';
import { 
    Mail, 
    Shield, 
    CheckCircle, 
    XCircle, 
    User, 
    Hash,
    Clock,
    Users
} from 'lucide-react';
import type { UsuarioAdmin } from '../../api/services/usuariosAdmin';

interface DetalleUsuarioProps {
    usuario: UsuarioAdmin | null;
    open: boolean;
    onClose: () => void;
}

export function DetalleUsuario({ usuario, open, onClose }: DetalleUsuarioProps) {
    const { grupos } = useGruposUsuario(usuario?.id ?? 0, !!usuario);
    
    if (!usuario) return null;

    const getInitials = (nombre: string) => {
        return nombre
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent className="w-full max-w-full gap-0 overflow-y-auto sm:max-w-md">
                <SheetHeader className="border-b pb-3 sm:pb-4">
                    <SheetTitle className="pr-8 text-lg sm:text-xl">Ficha de acampante</SheetTitle>
                </SheetHeader>

                <div className="space-y-5 px-4 py-3 sm:space-y-6 sm:px-6 sm:py-4">
                    {/* Header con avatar grande */}
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted p-4 text-center sm:gap-4 sm:p-6">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-lg sm:h-24 sm:w-24">
                            <AvatarImage src={usuario.urlFoto ?? undefined} />
                            <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {getInitials(usuario.nombreMostrar)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold sm:text-xl">{usuario.nombreMostrar}</h3>
                            <p className="flex items-center justify-center gap-2 break-all text-xs text-muted-foreground sm:text-sm">
                                <Mail className="w-4 h-4" />
                                {usuario.email}
                            </p>
                        </div>
                        {/* Status badges */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Badge 
                                variant={usuario.estado === 'ACTIVO' ? 'default' : 'destructive'}
                                className="gap-1"
                            >
                                {usuario.estado === 'ACTIVO' ? (
                                    <CheckCircle className="w-3 h-3" />
                                ) : (
                                    <XCircle className="w-3 h-3" />
                                )}
                                {usuario.estado}
                            </Badge>
                            <Badge 
                                variant={usuario.perfilCompleto ? 'outline' : 'secondary'}
                                className="gap-1"
                            >
                                <User className="w-3 h-3" />
                                {usuario.perfilCompleto ? 'Perfil completo' : 'Perfil incompleto'}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Sección de Roles */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="font-semibold">Roles del Sistema</h4>
                        </div>
                        <div className="rounded-xl border bg-card p-3 sm:p-4">
                            <GestorRoles 
                                usuarioId={usuario.id}
                                rolesActuales={usuario.roles}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                            Los cambios de rol se aplican inmediatamente. 
                            El usuario deberá cerrar sesión para ver los cambios.
                        </p>
                    </div>

                    <Separator />

                    {/* Sección de Grupos */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="font-semibold">Grupos</h4>
                        </div>
                        <div className="rounded-xl border bg-card p-3 sm:p-4">
                            <GestorGrupos 
                                usuarioId={usuario.id}
                                gruposActuales={grupos}
                                rolesUsuario={usuario.roles}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                            Vinculaciones de la persona dentro de acampantes y dirigencia.
                        </p>
                    </div>

                    <Separator />

                    {/* Info adicional */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <Hash className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <h4 className="font-semibold">Información del Sistema</h4>
                        </div>
                        
                        <div className="grid gap-3 rounded-xl border bg-card p-3 sm:p-4">
                            <InfoRow 
                                label="ID interno" 
                                value={<code className="break-all rounded bg-muted px-2 py-1 text-xs font-mono">{usuario.id}</code>}
                            />
                            <InfoRow 
                                label="Email verificado" 
                                value={
                                    usuario.emailVerificado ? (
                                        <span className="flex items-center gap-1 text-green-600">
                                            <CheckCircle className="w-4 h-4" />
                                            Verificado
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-amber-600">
                                            <Clock className="w-4 h-4" />
                                            Pendiente
                                        </span>
                                    )
                                }
                            />
                            <InfoRow 
                                label="Cantidad de roles" 
                                value={<span className="font-medium">{usuario.roles.length}</span>}
                            />
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Helper component for info rows
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 py-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="text-sm">{value}</div>
        </div>
    );
}
