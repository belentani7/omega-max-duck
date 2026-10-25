# Release readiness — Duck Ω-MAX

**Estado histórico (no revalidado):** las marcas «Aprobado» de la tabla proceden de una revisión anterior. **No equivalen a pruebas verificadas de la rama actual ni autorizan publicar.** Esta revisión del 25/10/2026 mantiene el release bloqueado.

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

**Bloqueo actual:** la CI de la rama de trabajo termina antes de ejecutar pasos (sin runner verificable). Falta repetir `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`, E2E autenticado y anónimo, escáneres, revisión de permisos, datos y licencias, y cotejar el SHA del despliegue autorizado. No usar **Publish** ni habilitar recordatorios hasta completar estos controles. La copia Git/LFS/metadatos, el respaldo cifrado offsite y su restauración tampoco se han verificado.

La landing ya no muestra créditos de colaboraciones sin fuente/licencia comprobadas. `LICENSE` atribuye copyright del código a Pedro Belentani, mientras `README.md` define el producto como exclusivo de Duck/Lucas: **la titularidad y derechos de explotación de la marca, activos y colaboraciones siguen sin verificarse**. El formulario de contacto preserva el borrador cuando falla el envío; la telemetría de terceros por plantilla se ha retirado. La privacidad de la base de datos y del historial Git aún requiere revisión.

## Controles posteriores a la publicación

Duck o Elika debe realizar una prueba con usuarios reales: crear un cliente y su proyecto, asignar rol `client`, subir un archivo no sensible, crear una versión y comprobar que el cliente no ve archivos no autorizados. También debe crear una solicitud de cobro y confirmar que permanece en `pending_approval` hasta una decisión explícita del rol Owner.

No se debe conectar una pasarela de pago ni programar un cron antes de esa verificación. Las integraciones externas siguen el orden y requisitos de `docs/INTEGRATIONS.md` y `docs/DEPLOYMENT.md`.
