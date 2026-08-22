# Arquitectura — DUCK Ω-MAX Studio OS

## Principio de identidad

Esta plataforma pertenece exclusivamente a **Duck/Lucas**. No contiene datos, identidad, medios, clientes, créditos ni automatizaciones de Pedro Belentani. Los únicos activos reutilizados proceden de patrones técnicos auditados de Duck Studio OS v2 y se reimplementan con marca, datos y permisos propios.

## Módulos separados

| Módulo | Responsabilidad | Acceso principal |
|---|---|---|
| Web pública | Servicios, casos publicados por Duck, contacto y acceso al portal | Público |
| CRM | Clientes, contactos, oportunidades, etiquetas, historial y presupuestos | Propietario y colaborador autorizado |
| Operaciones | Proyectos, tareas, tracks, versiones, archivos y control de calidad | Propietario, colaborador y cliente según pertenencia |
| Portal cliente | Cargas, revisiones, comentarios con marca temporal y entregables autorizados | Cliente vinculado y equipo autorizado |
| Producción | Cadenas de procesamiento y catálogo de herramientas/plugins | Equipo autorizado |
| Finanzas | Facturas, solicitudes de pago y decisiones de aprobación | Propietario y colaborador con permiso financiero |
| Inventario Ω-MAX | Productos, validación PVC-U, stock y propuestas de reposición | Equipo autorizado |
| Automatizaciones | Reglas, ejecuciones, pausas y bitácora | Propietario y colaborador autorizado |
| Auditoría | Eventos relevantes, cambios y decisiones | Propietario |

## Reglas no negociables

1. Los roles son `owner`, `collaborator` y `client`. El propietario gobierna todas las áreas; el colaborador opera sólo los módulos autorizados; el cliente sólo accede a sus datos vinculados.
2. Los archivos se guardan como objetos en almacenamiento y la base de datos conserva únicamente metadatos, referencias y permisos.
3. Las automatizaciones pueden crear tareas, recordatorios, notificaciones y propuestas. Cualquier automatización financiera crea exclusivamente una **solicitud pendiente de aprobación**.
4. No existe integración de cobro automático en esta fase. Un pago, envío de solicitud de pago o cambio a ejecución requiere una decisión explícita de Duck o Elika registrada con fecha, actor y motivo.
5. El inventario emite propuestas de reposición auditables; no envía órdenes de compra ni contacta proveedores de forma automática.
6. Todas las modificaciones relevantes generan un registro de actividad. Los datos y contenidos públicos se introducen mediante flujos explícitos, no mediante datos simulados.

## Órdenes de ejecución

| Orden | Evento | Resultado permitido | Resultado bloqueado |
|---|---|---|---|
| `file_uploaded` | Cliente sube archivo | Registrar archivo, notificar y crear tarea QC | Publicar, borrar o compartir fuera del proyecto |
| `version_approved` | Cliente aprueba versión | Actualizar estado y crear tarea de entrega | Cerrar factura o cobrar |
| `task_overdue` | Vence una tarea | Recordatorio y registro de actividad | Penalizar al cliente o enviar cobro |
| `invoice_ready` | Factura lista | Crear solicitud de pago pendiente | Enviar enlace de pago o ejecutar cobro |
| `stock_low` | Stock igual o menor al mínimo | Crear propuesta de reposición y notificar | Comprar, pagar o emitir orden al proveedor |

## Flujo de una solicitud de pago

`draft → pending_approval → approved | rejected → sent | cancelled`

Solo `owner` y colaboradores expresamente aprobados por Duck/Elika pueden resolver una solicitud pendiente. La aplicación registra cada decisión y no expone ningún endpoint de ejecución de pago hasta que exista una integración elegida y autorizada.
