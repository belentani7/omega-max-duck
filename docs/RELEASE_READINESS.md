# Release readiness — Duck Ω-MAX

**Estado de esta revisión:** preparada para checkpoint y publicación manual. La validación es **pre-publicación**; no se ha publicado ni activado ninguna tarea programada desde el entorno de desarrollo.

| Control | Resultado | Evidencia |
|---|---|---|
| Tipos | Aprobado | `pnpm check` termina sin errores. |
| Pruebas | Aprobado | 5 archivos y 11 pruebas Vitest aprobadas. |
| Migraciones | Aprobado | `0000` a `0003`, incluida la tabla `communications`, aplicadas a la base gestionada. |
| Identidad | Aprobado | Interfaz y modelo operativo muestran solo Duck/Lucas; la vista de accesos enmascara la identidad heredada como `Duck owner`. |
| Roles | Aprobado | Owner, Collaborator y Client están protegidos por procedimientos y gestión de acceso. |
| Pagos | Aprobado | Las automatizaciones solo generan solicitudes pendientes; no hay pasarela ni ejecución de cargo. |
| Portal | Aprobado | Proyectos vinculados, archivos, versiones, comentarios temporales, entregables, QC y comunicaciones internas. |
| Automatización | Aprobado en código | Eventos, ejecuciones, avisos internos, notificación de propietario y handler de vencimientos protegidos por cron. |
| Vistas críticas | Aprobado en desarrollo | Web pública, Producción, Finanzas, Automatizaciones, Proyectos, Portal y Auditoría revisados visualmente. |

## Bloqueadores

No hay bloqueadores de código, tipos, pruebas o esquema para crear el checkpoint. La publicación y cualquier configuración de recordatorios recurrentes requieren una acción posterior de Duck/Elika: usar **Publish** y, solo después, crear reglas de vencimiento desde Automatizaciones.

## Controles posteriores a la publicación

Duck o Elika debe realizar una prueba con usuarios reales: crear un cliente y su proyecto, asignar rol `client`, subir un archivo no sensible, crear una versión y comprobar que el cliente no ve archivos no autorizados. También debe crear una solicitud de cobro y confirmar que permanece en `pending_approval` hasta una decisión explícita del rol Owner.

No se debe conectar una pasarela de pago ni programar un cron antes de esa verificación. Las integraciones externas siguen el orden y requisitos de `docs/INTEGRATIONS.md` y `docs/DEPLOYMENT.md`.
