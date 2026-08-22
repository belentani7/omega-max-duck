# Despliegue de Duck Ω-MAX

## Precondiciones

Antes de publicar, revisa que la base de datos incluya las migraciones de `drizzle/`, que los archivos de proyecto utilicen almacenamiento gestionado y que no existan datos o marca de Pedro Belentani. La aplicación recibe sus secretos de autenticación, almacenamiento y base de datos desde el entorno gestionado; no deben copiarse a repositorios ni documentos.

## Lista de publicación

| Orden | Acción | Comprobación esperada |
|---|---|---|
| 1 | Ejecutar `pnpm check`. | Sin errores de TypeScript. |
| 2 | Ejecutar `pnpm test`. | Pruebas de sesión, PVC-U y compuerta de cobro aprobadas. |
| 3 | Revisar `todo.md`. | Todo ítem marcado como completado corresponde a una función entregada. |
| 4 | Crear un checkpoint de la plataforma. | El checkpoint permite publicar y restaurar. |
| 5 | Publicar desde el botón **Publish** de la interfaz de gestión. | La URL productiva responde con la web de Duck. |
| 6 | Probar contacto, inicio de sesión, portal y control de roles. | Datos aislados y permisos correctos. |
| 7 | Probar una solicitud de pago. | Permanece en `pending_approval` hasta una decisión de Duck/Elika. |

## Verificación operativa posterior

Primero, Duck o Elika debe entrar con la cuenta que será propietaria y verificar el rol `owner` en **Auditoría**. Después se puede conceder `collaborator` o `client` únicamente a usuarios reales que ya hayan iniciado sesión. Crea un cliente de prueba interno, un proyecto y una versión; comprueba que el portal solo muestre sus propios datos y que un archivo no autorizado no se descargue desde el portal de cliente.

Para almacenamiento, sube un archivo no sensible de menos de 25 MB y confirma que el registro aparece en el proyecto. El enlace debe apuntar al almacenamiento gestionado y no a un archivo dentro del repositorio. Elimina después el registro de prueba si no debe conservarse.

## Recordatorios y vencimientos

No se debe crear ningún cron antes de publicar. Una vez publicada la plataforma, los vencimientos y recordatorios se programan mediante un trabajo gestionado que invoque una ruta `/api/scheduled/*`; no se usan `setInterval`, `node-cron` ni procesos que deban quedar activos.

La implementación de un trabajo de vencimientos debe incluir: una fila propietaria con `scheduleCronTaskUid`, un procedimiento que cree, pause o elimine el trabajo gestionado, un handler autenticado de `/api/scheduled/*` que busque por ese identificador, y un handler idempotente con errores JSON. Antes de activar el primer trabajo, Duck/Elika debe revisar la regla y verificar que no realice pagos, publicaciones ni cambios irreversibles.

## Integraciones y pagos

Una pasarela de pago no se activa en esta publicación. Cuando Duck/Elika elija y autorice un proveedor, se añadirán sus credenciales al entorno gestionado, se verificará el flujo en modo de prueba y se mantendrá la aprobación explícita existente. Una integración nunca puede omitir la creación y decisión de la solicitud de pago.
