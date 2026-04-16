## Resumen
Actualización del PR #74 para resolver los hallazgos de la auditoría técnica. Se mejora la persistencia visual (Portals), se optimiza el diseño (Dark Mode) y se implementa un sistema robusto de logs de diagnóstico para depurar los fallos de guardado en el servidor.

## Cambios
- **Refactorización de Diálogos**: Migración de `ConfirmDialog` a React Portal para evitar recortes del canvas (H1).
- **Consistencia Visual**: Mejora del estilo del selector SQL para evitar parpadeos en modo oscuro (B3/H2).
- **Trazabilidad de Datos**: Inyección de logs en el lado servidor (pino) para identificar cuellos de botella en la persistencia.
- **Robustez en React Flow**: Adición de clases `nodrag nowheel` en todos los puntos de interacción para asegurar la captura de eventos.
- **Limpieza de Código**: Eliminación de `console.debug` prohibidos y corrección de un `any` ilegal en el servidor (§5, §12).

## Secciones de AGENTS.md aplicadas
3, 4, 5, 12, 13.4, 13.5, 20.1, 20.13, 22.1.

## Test plan
1. Levanta el entorno con `pnpm dev`.
2. Valida que el diálogo de confirmación tape toda la pantalla y no se corte por los bordes de la tabla.
3. Valida que el selector de tipo SQL se vea correctamente en Dark Mode.
4. Revisa los logs del servidor para ver el mensaje `incoming client message`.

## Fuera de alcance
La reparación definitiva de la persistencia en disco, ya que requiere depuración en tiempo de ejecución con los nuevos logs implementados.

## Riesgos
Prioridad de `z-index` en el Portal si se añaden otros elementos superpuestos globales.

## Revisión Visual Obligatoria (§20.13)
> [!IMPORTANT]
> He refactorizado el `ConfirmDialog` y el selector SQL. He confirmado visualmente que el contraste es suficiente y que el selector es legible en dark mode.
