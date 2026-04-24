import { useState, useMemo, type KeyboardEvent } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '../ui/table';
import { Input } from '../ui/input';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { GestorRoles } from './GestorRoles';
import { Search, Users, Loader2 } from 'lucide-react';
import type { UsuarioAdmin } from '../../api/services/usuariosAdmin';

interface TablaUsuariosProps {
    usuarios: UsuarioAdmin[];
    cargando: boolean;
    onVerDetalle?: (usuario: UsuarioAdmin) => void;
    /** Si es true, muestra todos los usuarios (no solo acampantes) */
    mostrarTodos?: boolean;
}

const ALL_ROLES = ['ADMIN', 'DIRIGENTE', 'PADRE', 'ACAMPANTE'];

export function TablaUsuarios({ usuarios, cargando, onVerDetalle, mostrarTodos = false }: TablaUsuariosProps) {
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState<string>('todos');

    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter(u => {
            // Filtro por búsqueda
            const matchBusqueda = busqueda === '' || 
                u.nombreMostrar.toLowerCase().includes(busqueda.toLowerCase()) ||
                u.email.toLowerCase().includes(busqueda.toLowerCase());

            // Filtro por rol
            let matchRol = true;
            if (filtroRol === 'SIN_ROL') {
                matchRol = u.roles.length === 0;
            } else if (filtroRol !== 'todos') {
                matchRol = u.roles.includes(filtroRol);
            }

            return matchBusqueda && matchRol;
        });
    }, [usuarios, busqueda, filtroRol]);

    const getInitials = (nombre: string) => {
        return nombre
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, usuario: UsuarioAdmin) => {
        if (!onVerDetalle) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onVerDetalle(usuario);
        }
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o correo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filtroRol} onValueChange={setFiltroRol}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los roles</SelectItem>
                        {mostrarTodos && (
                            <SelectItem value="SIN_ROL">Sin rol asignado</SelectItem>
                        )}
                        {ALL_ROLES.map(rol => (
                            <SelectItem key={rol} value={rol}>{rol}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Contador */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{usuariosFiltrados.length} {mostrarTodos ? 'usuarios' : 'acampantes'}</span>
            </div>

            <div className="space-y-3 md:hidden">
                {usuariosFiltrados.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        No se encontraron {mostrarTodos ? 'usuarios' : 'acampantes'}
                    </div>
                ) : (
                    usuariosFiltrados.map(usuario => (
                        <Card
                            key={usuario.keycloakId}
                            className="gap-0 py-0 transition-colors hover:border-primary/40 hover:bg-muted/20"
                            role={onVerDetalle ? 'button' : undefined}
                            tabIndex={onVerDetalle ? 0 : undefined}
                            onClick={() => onVerDetalle?.(usuario)}
                            onKeyDown={(event) => handleCardKeyDown(event, usuario)}
                        >
                            <div className="flex items-start gap-3 px-4 py-4">
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={usuario.urlFoto ?? undefined} />
                                    <AvatarFallback className="text-xs">
                                        {getInitials(usuario.nombreMostrar)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">{usuario.nombreMostrar}</div>
                                            <div className="break-all text-xs text-muted-foreground">{usuario.email}</div>
                                        </div>
                                        <Badge variant={usuario.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                                            {usuario.estado}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {usuario.roles.length} roles asignados
                                    </p>
                                </div>
                            </div>

                            <CardContent
                                className="space-y-2 border-t px-4 py-3"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Roles
                                </div>
                                <GestorRoles
                                    keycloakId={usuario.keycloakId}
                                    rolesActuales={usuario.roles}
                                />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Tabla */}
            <div className="hidden rounded-lg border md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="hidden sm:table-cell">Email</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead className="hidden md:table-cell">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usuariosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No se encontraron {mostrarTodos ? 'usuarios' : 'acampantes'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            usuariosFiltrados.map(usuario => (
                                <TableRow 
                                    key={usuario.keycloakId}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => onVerDetalle?.(usuario)}
                                >
                                    <TableCell>
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={usuario.urlFoto ?? undefined} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(usuario.nombreMostrar)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{usuario.nombreMostrar}</div>
                                            <div className="text-xs text-muted-foreground sm:hidden">
                                                {usuario.email}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                                        {usuario.email}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <GestorRoles 
                                            keycloakId={usuario.keycloakId} 
                                            rolesActuales={usuario.roles}
                                        />
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge 
                                            variant={usuario.estado === 'ACTIVO' ? 'default' : 'secondary'}
                                        >
                                            {usuario.estado}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
