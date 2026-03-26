# STATUS
**Repositorio Remoto:** [camiloluvino/roamMultiGraphManager](https://github.com/camiloluvino/roamMultiGraphManager)

## 1. Versión Actual
**v0.6.1** (Auditoría de Seguridad y Hardening)


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
- 🟢 **🔌 Plugins:** Pestaña dedicada para gestionar y sincronizar plugins `roam/js/` en múltiples grafos simultáneamente.
- 🟢 **Auto-Shutdown (NUEVO):** Cierre automático de la terminal (servidor local) al cerrar la pestaña del navegador mediante sistema de heartbeat.
- 🟢 **Persistencia de Plugins (v0.4.1):** La selección de plugins de la lista inferior ahora persiste entre sesiones.
- 🟢 **Proxy de API (NUEVO v0.4.2):** Sistema de puente para operaciones de escritura que evita límites de tamaño del navegador y maneja redirecciones HTTP 308 de Roam.

## 3. Historial Reciente
- **AUDITORÍA Y SEGURIDAD (v0.6.1):**
  - **Localhost Binding:** Restricción definitiva del servidor Python a `127.0.0.1` para evitar accesos desde la red local/Wi-Fi.
  - **Protección SSRF:** Validación estricta de URLs en el proxy para permitir únicamente tráfico hacia `api.roamresearch.com`.
  - **CORS Hardening:** Sustitución de `*` por validación dinámica de origen limitada a `localhost` y `127.0.0.1`.
  - **Audit de Código:** Verificación de seguridad en `ui.js`, `app.js` y `storage.js` confirmando el uso correcto de `escapeHTML` y manejo seguro de tokens.
- **OPTIMIZACIÓN INTEGRAL DE RECURSOS (v0.6.0):**

  - **Heartbeat Inteligente:** Reducción de frecuencia de 2s a 15s, disminuyendo el tráfico de red constante en un 87%.
  - **Servidor Multi-hilo:** Migración a `ThreadingTCPServer` en `server.py` para procesar peticiones de proxy y heartbeat en paralelo sin bloqueos.
  - **Caché en Memoria (App):** Sistema de caché con TTL de 30 segundos y deduplicación de peticiones para evitar calls duplicadas al cambiar entre pestañas.
  - **Datomic Query Tuning:** Reducción de la ventana de búsqueda automática de 30 a 7 días en `api.js` para aligerar la carga de datos.
  - **DOM Hash-Rendering:** Optimización en `ui.js` que salta el re-renderizado costoso (`innerHTML`) si los datos no han cambiado.
  - **MemCache Storage:** Abstracción en `storage.js` que cachea lecturas de `localStorage` para evitar `JSON.parse` repetitivos en el hilo principal.
- **OPTIMIZACIÓN DE RENDIMIENTO Y LOTES (v0.5.0):**
  - **Bulk Storage Write:** Implementación de guardado masivo en `localStorage` reduciendo el bloqueo del hilo principal durante escaneos.
  - **Batch Fetching:** Las consultas de metadatos (tiempos de edición) ahora se procesan en baches concurrentes de a 10 para evitar saturación de red.
  - **UI Fluida:** Eliminación de micro-congelamientos al navegar por listas extensas de registros.
- **PROXY DE API PARA ESCRITURA (v0.4.2):**
  - **Bypass de Límites:** Las operaciones de escritura (`write`) ahora se enrutan a través del servidor local Python para evitar el error `ERR_CONNECTION_RESET` en plugins de gran tamaño.
  - **Soporte Redirect 308:** Implementación de un manejador de redirecciones personalizado en el servidor para seguir correctamente los cambios de URL de la API de Roam sin perder el método POST ni el body.
  - **Telemetría de Sincronización:** Se añadieron logs detallados paso a paso en la consola para facilitar el diagnóstico de errores en la sincronización de plugins.
- **PERSISTENCIA DE SELECCIÓN DE PLUGINS (v0.4.1):**
  - **Memoria de Selección:** Se implementó la persistencia de los plugins seleccionados en la lista inferior usando `localStorage`.
  - **Recuperación Automática:** Al iniciar la app, los plugins que estaban seleccionados vuelven a aparecer en la columna de "Plugin Seleccionado".
  - **Sincronización:** El almacenamiento se actualiza automáticamente al marcar/desmarcar plugins o al eliminarlos del registro.
- **AUTO-SHUTDOWN RELIABLE (v0.4.0):** Se sustituyó el servidor genérico de Python por uno personalizado para mejorar la experiencia de usuario:
  - **Mecanismo Heartbeat:** Implementación de un sistema de "latido" donde la app avisa al servidor que sigue activa cada 2 segundos.
  - **Cierre Automático:** Si el servidor deja de recibir latidos por más de 5 segundos (ej. al cerrar la pestaña), se apaga automáticamente, liberando la consola.
  - **Server.py:** Nuevo script `server.py` que centraliza la lógica del servidor y silencia los logs de heartbeat para mantener la consola limpia.
  - **Update Iniciar.bat:** Se actualizó el acceso directo para usar el nuevo servidor.
- **HOTFIX: 3 BUGS CRÍTICOS (v0.3.1):** Tras una revisión integral de código, se corrigieron tres errores que afectaban la usabilidad:
  - **Arreglo en Sort Dashboard:** Se corrigió un error de sintaxis en `app.js` que impedía que el ordenamiento de columnas alternara entre ascendente y descendente.
  - **Funciones Faltantes:** Se implementaron `autoScanConversaciones()` y `toggleAllPluginGraphs()` que estaban siendo llamadas pero no existían, eliminando crashes al usarlas.
  - **Fondo de Modal:** Se cambió el background de `.modal` de transparente a sólido (`var(--bg-primary)`), haciendo que los diálogos de confirmación y resultados sean legibles.
  - **Correcciones JSDoc:** Limpieza de comentarios inconsistentes.
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
3. Mejorar visibilidad del estado de los grafos (ej. indicador de conexión exitosa/fallida junto a cada grafo en el selector).

---

### Notas para la IA
> **Mantén este documento actualizado:** Al final de cada sesión de trabajo con el usuario, revisa los cambios realizados y actualiza el estado de las funcionalidades, el historial reciente y los próximos pasos. Si resolves un problema crítico, quítalo de la sección 4 y regístralo como resuelto en el historial.
