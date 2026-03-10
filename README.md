# CAS - Campamento Andino Sayhueque

Sistema de gestión integral para el Campamento Andino Sayhueque.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
firebase deploy --only hosting
```

## Estructura

- `/src/routes` - Rutas de la aplicación (file-based routing)
- `/src/components` - Componentes reutilizables
- `/src/api` - Servicios y clientes API
- `/src/hooks` - Hooks personalizados

## Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

| Variable | Descripción |
|----------|-------------|
| `VITE_KEYCLOAK_URL` | URL del servidor Keycloak |
| `VITE_KEYCLOAK_REALM` | Realm de Keycloak |
| `VITE_KEYCLOAK_CLIENT_ID` | Client ID del frontend |
| `VITE_API_BASE_URL` | URL del backend API |
| `VITE_APP_ENV` | Entorno visual de la app. Usar `dev` para mostrar `[DEV] CAS` en la pestaña |

## Despliegue

- **Dev:** `firebase use dev && firebase deploy --only hosting`
- **Prod:** `firebase use prod && firebase deploy --only hosting`
