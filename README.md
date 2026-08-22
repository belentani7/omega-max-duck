# DUCK Ω-MAX Studio OS

DUCK Ω-MAX Studio OS es una plataforma exclusiva de **Duck/Lucas** para coordinar relación con clientes, producción musical, operaciones, inventario y gobierno de automatizaciones. La aplicación no reutiliza identidad, datos de clientes ni contenidos de Pedro Belentani.

## Módulos disponibles

| Área | Qué resuelve |
|---|---|
| Web pública | Servicios, casos compartidos por el equipo, contacto y acceso al portal. |
| CRM | Clientes, contactos, oportunidades, presupuestos, proyectos y tareas. |
| Portal | Proyectos vinculados, carga de archivos, versiones, comentarios temporales y entregables autorizados. |
| Producción | Cadenas de procesamiento, catálogo de plugins, tracks, versiones y checklist de calidad. |
| Finanzas | Facturas y solicitudes de pago con aprobación explícita. |
| Inventario | Productos, validación PVC-U de esferas 1–7, alertas y propuestas de reposición. |
| Automatización | Reglas por evento, ejecuciones, pausas, errores y auditoría. |

## Regla financiera

> Una automatización nunca ejecuta un cobro. Como máximo crea una solicitud `pending_approval`, que debe ser aprobada o rechazada por Duck o Elika desde el módulo de Finanzas. Toda decisión queda registrada en Auditoría.

## Desarrollo local

El proyecto usa React, TypeScript, Express, tRPC, Drizzle y una base de datos gestionada. Para desarrollo, ejecuta `pnpm dev`; para verificar el proyecto, ejecuta `pnpm check` y `pnpm test`.

Las migraciones se generan con `pnpm drizzle-kit generate`, se revisan en `drizzle/` y se aplican mediante el flujo de migración gestionado. Los archivos de clientes se guardan en almacenamiento de objetos; la base de datos conserva solo metadatos y permisos.

## Estructura

| Ruta | Propósito |
|---|---|
| `client/src/pages/Home.tsx` | Sitio público de Duck. |
| `client/src/pages/Studio.tsx` | Dashboard, CRM, portal y módulos internos. |
| `server/routers/studio.ts` | Procedimientos tRPC con filtros de rol y pertenencia. |
| `server/domain/automationEngine.ts` | Ejecución trazable de automatizaciones por evento. |
| `server/domain/guards.ts` | Reglas de PVC-U y aprobación financiera. |
| `drizzle/schema.ts` | Modelo de datos y contratos de persistencia. |
| `docs/` | Operación, arquitectura, migración e integraciones. |

## Límites intencionales de esta entrega

No hay proveedor de pagos conectado ni se activa ninguna tarea programada todavía. Las credenciales de correo, pagos, calendario, mensajería o distribución deben suministrarse y aprobarse antes de activar esas integraciones. Los recordatorios periódicos se habilitan únicamente después de desplegar la plataforma, usando el mecanismo de programación gestionado.
