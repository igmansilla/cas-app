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
            <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                <SheetHeader className="pb-4">
                    <SheetTitle className="text-xl">Ficha de acampante</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 py-4">
                    {/* Header con avatar grande */}
                    <div className="flex flex-col items-center text-center gap-4 p-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                            <AvatarImage src={usuario.urlFoto ?? undefined} />
                            <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {getInitials(usuario.nombreMostrar)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl">{usuario.nombreMostrar}</h3>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
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
                        <div className="p-4 rounded-xl border bg-card">
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
                        <div className="p-4 rounded-xl border bg-card">
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
                        
                        <div className="grid gap-3 p-4 rounded-xl border bg-card">
                            <InfoRow 
                                label="ID interno" 
                                value={<code className="bg-muted px-2 py-1 rounded text-xs font-mono">{usuario.id}</code>}
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
        <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="text-sm">{value}</div>
        </div>
    );
}
