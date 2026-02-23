# STATUS
**Repositorio Remoto:** [camiloluvino/roamMultiGraphManager](https://github.com/camiloluvino/roamMultiGraphManager)

## 1. Versión Actual
**v0.3.0** (Nueva Pestaña: Plugins - Sincronización Multi-Grafo de roam/js)

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
- 🟢 **🔌 Plugins (NUEVO):** Pestaña dedicada para gestionar y sincronizar plugins `roam/js/` en múltiples grafos simultáneamente.

## 3. Historial Reciente
- **NUEVA PESTAÑA PLUGINS (v0.3.0):** Se implementó una nueva pestaña principal "Plugins" para resolver el problema de sincronización de complementos `roam/js/` entre múltiples grafos. Funcionalidades:
  - **Auto-Escaneo de Plugins:** Botón "Escanear Plugins" que busca todas las páginas con prefijo `roam/js/` en los grafos activos y registra cada plugin con la lista de grafos donde existe.
  - **Tabla de Plugins:** Vista tabular con nombre del plugin, grafos donde está presente, y badge de cobertura (X/N grafos).
  - **Sincronización de Código:** Al seleccionar un plugin, aparece un panel con textarea monospace para pegar código JavaScript nuevo. La sincronización elimina todo el contenido existente de la página y lo reemplaza con la estructura correcta de Roam: `{{[[roam/js]]}}` → bloque hijo con code fence.
  - **Creación en grafos faltantes:** Opción checkbox para también crear el plugin en grafos donde no existe aún.
  - **Preview en tiempo real:** Al escribir código se muestra preview con grafos destino y estructura que se escribirá.
  - **Confirmación de seguridad:** Modal de confirmación antes de ejecutar (ya que reemplaza contenido existente).
  - **Resultados detallados:** Modal de resultados por grafo (éxito/error) como en las demás operaciones.
  - **Persistencia:** Los plugins descubiertos se guardan en `localStorage` (`roam_mg_plugins`).
  - **Nuevos métodos API:** `getPagesByPrefix()`, `getPageChildren()`, `deleteBlock()`, `syncPluginPage()`.
- **REDISEÑO PESTAÑA OPERACIONES (v0.2.2):** Se rediseñó completamente la pestaña de Operaciones con un layout de 2 columnas. Panel izquierdo **sticky** con selector dinámico de grafos (checkboxes generados automáticamente), panel derecho con formularios y preview. Se implementó sincronización bidireccional: cambios en Config ↔ Operaciones se sincronizan automáticamente.
- **CORRECCIÓN PREVIEW PANEL (v0.2.1):** Se arregló la sección de "Grafos destino" en el preview. Se agregó `flex-wrap: wrap` y mejor espaciado visual.
- **REDISEÑO FULL-WIDTH Y NAVEGACIÓN (v0.2.0):** Se eliminó la columna lateral (sidebar) para liberar espacio y ampliar el contenido de las pestañas principales.

## 4. Problemas Conocidos (Bugs / TODOs)
- **Limitación en UI:** Si falla un event listener por un ID que no se encuentra en el HTML en `app.js`, la consola arrojará error pero la interfaz no dará feedback visible.
- **Riesgo:** Los tokens se guardan en texto plano en localStorage; si bien se mitigo XSS básico, extensiones maliciosas siguen siendo un vector de ataque.
- **Limitación:** Las operaciones sobre múltiples grafos fallan en modo "todo o nada".
- **Plugins:** El escaneo de plugins requiere grafos activos seleccionados. Si no hay ninguno seleccionado, no se puede escanear.

## 5. Próximos Pasos Recomendados
1. Implementar un "Dry-run" de conexión con la API la primera vez que inicia la app para marcar de color rojo tokens inválidos o caducados.
2. Añadir un sistema de "Deshacer" básico (ej. si se creó una página en 10 grafos y uno quiere revertir la acción).
3. Mejorar visibilidad del estado de los grafos (ej. indicador de conexión exitosa/fallida junto a cada grafo en el selector).
4. Añadir opción de leer código desde un grafo fuente (complemento al textarea manual) para los plugins.
5. Soporte para plugins con estructura más compleja (múltiples bloques hijos, no solo código).

---

### Notas para la IA
> **Mantén este documento actualizado:** Al final de cada sesión de trabajo con el usuario, revisa los cambios realizados y actualiza el estado de las funcionalidades, el historial reciente y los próximos pasos. Si resolves un problema crítico, quítalo de la sección 4 y regístralo como resuelto en el historial.
