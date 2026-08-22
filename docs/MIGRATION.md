# Migración desde Duck Studio OS v2

## Alcance de reutilización

La nueva plataforma reutiliza patrones de dominio auditados de Duck Studio OS v2: roles, CRM, proyectos, archivos, versiones, comentarios, cadenas de procesamiento, facturas, automatizaciones y auditoría. No copia base de datos, usuarios, datos de demostración, marca ni identidad de proyectos anteriores.

## Proceso seguro

| Paso | Acción | Validación |
|---|---|---|
| 1 | Inventariar datos aprobados por Duck/Lucas. | Lista firmada o confirmada por el equipo. |
| 2 | Exportar únicamente clientes, proyectos y archivos que pertenezcan a Duck. | Sin datos de Pedro Belentani ni de terceros. |
| 3 | Crear usuarios y asignar roles en Ω-MAX. | Owner, collaborator o client correctamente definidos. |
| 4 | Importar CRM y proyectos en lotes pequeños. | Conteos reconciliados y bitácora revisada. |
| 5 | Subir archivos al almacenamiento de Ω-MAX. | Metadatos, proyecto y autorización correctos. |
| 6 | Crear reglas de automatización inicialmente pausadas. | Revisión de la acción, incluyendo la compuerta financiera. |
| 7 | Activar reglas no financieras y observar la bitácora. | Sin errores ni acciones inesperadas. |

No se deben insertar datos inventados para poblar el dashboard. La aplicación muestra estados vacíos hasta que Duck/Lucas introduzca datos reales o autorice una migración.
