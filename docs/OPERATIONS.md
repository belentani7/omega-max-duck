# Operación de Duck Ω-MAX

## Gobierno de acceso

El primer usuario propietario viene del acceso del proyecto. Duck o Elika deben entrar al panel, abrir **Auditoría** y asignar roles a los usuarios que ya hayan iniciado sesión. La plataforma distingue `owner`, `collaborator` y `client`.

| Rol | Puede hacer | No puede hacer |
|---|---|---|
| Owner | Cambiar roles, aprobar o rechazar solicitudes de cobro, consultar auditoría y operar todos los módulos. | Retirar su propio acceso de propietario desde la misma sesión. |
| Collaborator | Operar CRM, proyectos, producción, inventario y automatizaciones. | Aprobar pagos o modificar roles. |
| Client | Consultar sus proyectos, cargar archivos, comentar versiones y descargar solo entregables autorizados. | Ver otros clientes, datos internos o archivos sin autorización. |

## Flujo recomendado de proyecto

Primero se crea el cliente real en CRM. Después se abre el proyecto, se registran tareas y se recibe el material en el portal. El equipo crea versiones y checklist de calidad; el cliente comenta por versión y segundo. Cuando haya entregable, el equipo autoriza el archivo para ese cliente.

## Flujo financiero

Una factura empieza como borrador. Si se necesita pedir un pago, se crea una solicitud con su razón e importe. Una regla de automatización puede crear la misma solicitud, pero nunca puede enviarla ni ejecutarla. Duck o Elika revisan la solicitud, registran una razón y la aprueban o rechazan. La integración de pago no se conecta hasta que el equipo elija un proveedor y autorice sus credenciales.

## Automatizaciones y vencimientos

Las reglas por evento ya responden a cambio de estado de proyecto, carga de archivo y stock bajo. Para tareas vencidas, recordatorios periódicos o resúmenes, primero hay que desplegar la aplicación; después se configura un trabajo gestionado que invoque una ruta `/api/scheduled/*`. No se permiten temporizadores dentro del servidor porque no sobreviven al escalado automático.

## Inventario

Un producto solo se valida como PVC-U cuando su esfera es un entero entre 1 y 7 y los valores de stock no son negativos. Si el stock alcanza el mínimo, una regla puede generar una propuesta de reposición. La propuesta no compra ni contacta a proveedores; exige revisión humana.
