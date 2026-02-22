# STATUS
**Repositorio Remoto:** [camiloluvino/roamMultiGraphManager](https://github.com/camiloluvino/roamMultiGraphManager)

## 1. Versión Actual
**v0.2.2** (Rediseño Pestaña Operaciones: Selector de Grafos Dinámico y Layout 2 Columnas)

## 2. Estado de Funcionalidades
- 🟢 **UI General:** Rediseño total minimalista. Layout **Full-Width** (sin barra lateral) para máxima área de trabajo.
- 🟢 **Historial:** Movido de la barra lateral a una pestaña dedicada en el menú principal.
- 🟢 **Gestión de Grafos:** Sidebar eliminada; "Grafos Activos" reubicados en la pestaña de Configuración.
- 🟢 **Tipografía:** Implementación de sistema dual: Lora (Serif) e Inter (Sans).
- 🟢 **Dashboard Avanzado:** Vista de Columnas establecida como predeterminada. Alineación de textos mejorada.
- 🟢 **Grafos (ex-Registros):** Marcadores para páginas `/grafoDeDiscurso` con auto-escaneo.
- 🟢 **Conversaciones:** Nueva pestaña para monitorear `/conversacionesChatbots` con soporte para auto-escaneo independiente.
- 🟢 **Ordenamiento Inteligente:** Todas las tablas se ordenan por defecto por fecha de actividad (más reciente a más antigua).
- 🟢 **Pestaña Operaciones Rediseñada:** Layout de 2 columnas con selector de grafos dinámico (sticky) en panel izquierdo y formularios + preview en panel derecho.
- 🟢 **Selector de Grafos en Operaciones:** Checkboxes dinámicos que se actualizan automáticamente cuando cambian los grafos configurados. Sincronización bidireccional con selecciones.
- 🟢 **Controlador (App):** Sincronización de estados, carga concurrente de actividad y consultas Datalog avanzadas.
- 🟢 **Componentes (UI):** Renderizado dual (Acordeón/Tabular). Soporte para múltiples tipos de registros manuales.
- 🟢 **Gestión de Almacenamiento:** Sin cambios (localStorage).

## 3. Historial Reciente
- **REDISEÑO PESTAÑA OPERACIONES (v0.2.2):** Se rediseñó completamente la pestaña de Operaciones con un layout de 2 columnas. Panel izquierdo **sticky** con selector dinámico de grafos (checkboxes generados automáticamente), panel derecho con formularios y preview. Se implementó sincronización bidireccional: cambios en Config ↔ Operaciones se sincronizan automáticamente. Los checkboxes se regeneran cuando se agregan/eliminan grafos. Mejora visual: el selector de grafos ahora es siempre visible y accesible durante la entrada de datos del formulario. Responsive design: en pantallas <1024px el layout se apila verticalmente.
- **CORRECCIÓN PREVIEW PANEL (v0.2.1):** Se arregló la sección de "Grafos destino" en el preview. Se agregó `flex-wrap: wrap` y mejor espaciado visual para que los nombres de grafos se distribuyan en múltiples líneas cuando hay muchos. Se mejoró la jerarquía visual con fondos, bordes y padding individual para cada grafo.
- **REDISEÑO FULL-WIDTH Y NAVEGACIÓN (v0.2.0):** Se eliminó la columna lateral (sidebar) para liberar espacio y ampliar el contenido de las pestañas principales. Los componentes que residían en la sidebar fueron reubicados estratégicamente: el **Historial** ahora tiene su propia pestaña de navegación principal, y la lista de **Grafos Activos** se integró en la pestaña de Configuración. Se ajustó el sistema de rejilla CSS para soportar el layout de ancho completo y se optimizó la vista de configuración para manejar tres paneles laterales.
- **GRAFOS Y CONVERSACIONES (v0.2.1):** Se reorganizó la sección de marcadores en dos categorías distintas: **Grafos** (para páginas terminadas en `/grafoDeDiscurso`) y **Conversaciones** (para páginas terminadas en `/conversacionesChatbots`). Esta división permite un monitoreo más limpio de diferentes flujos de trabajo. Se añadieron botones de **Auto-Escaneo** específicos para cada tipo y se implementó un sistema de almacenamiento independiente en `localStorage` (`roam_mg_conversaciones`). Además, se estableció el **ordenamiento por fecha (descendente)** como el comportamiento predeterminado para todas las tablas de la aplicación (Dashboard, Grafos y Conversaciones).

## 4. Problemas Conocidos (Bugs / TODOs)
- **Limitación en UI:** Si falla un event listener por un ID que no se encuentra en el HTML en `app.js`, la consola arrojará error pero la interfaz no dará feedback visible.
- **Riesgo:** Los tokens se guardan en texto plano en localStorage; si bien se mitigo XSS básico, extensiones maliciosas siguen siendo un vector de ataque.
- **Limitación:** Las operaciones sobre múltiples grafos fallan en modo "todo o nada".

## 5. Próximos Pasos Recomendados
1. Implementar un "Dry-run" de conexión con la API la primera vez que inicia la app para marcar de color rojo tokens inválidos o caducados.
2. Añadir un sistema de "Deshacer" básico (ej. si se creó una página en 10 grafos y uno quiere revertir la acción).
3. Mejorar visibilidad del estado de los grafos (ej. indicador de conexión exitosa/fallida junto a cada grafo en el selector).

---

### Notas para la IA
> **Mantén este documento actualizado:** Al final de cada sesión de trabajo con el usuario, revisa los cambios realizados y actualiza el estado de las funcionalidades, el historial reciente y los próximos pasos. Si resolves un problema crítico, quítalo de la sección 4 y regístralo como resuelto en el historial.
