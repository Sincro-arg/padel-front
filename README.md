# padel-front

Front de la app de gestión de un club de pádel. Angular standalone + signals.

## Desarrollo

```
npm install
npm start
```

Sirve en `http://localhost:4200` y espera el back en `http://localhost:5000/api`
(configurable en `src/environments/environment.development.ts`).

## Tests

```
npm test
```

## Usuarios de prueba

El back siembra dos usuarios al arrancar (ver `DbSeeder`):

- `admin` / `Admin123!` (rol admin)
- `empleado` / `Empleado123!` (rol empleado)

## Nota para revisión visual

`home`, `caja`, `torneos` y `reportes` están detrás de `authGuard`: sin sesión
iniciada, redirigen a `/login`. Una herramienta que solo navega a rutas (sin
completar el formulario de login) no va a poder capturarlas — hay que loguearse
a mano primero con alguno de los usuarios de arriba y recién ahí sacar las
capturas de esas pantallas.
