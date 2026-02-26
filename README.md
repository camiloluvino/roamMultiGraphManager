# Roam Multi-Graph Manager

Aplicación web para gestionar páginas en múltiples grafos de Roam Research simultáneamente.

## 🚀 Características

- **Diseño Full-Width Minimalista:** Una interfaz limpia y profesional que utiliza todo el ancho de la pantalla para máxima visibilidad. Sin barras laterales distractoras.
- **Dashboard Dinámico:** Selector de vista para alternar entre **Acordeones** (jerárquico Grafo → Página → Bloques) y **Columnas** (tabla plana tipo Excel). Ordenamiento automático por actividad reciente.
- **Grafos y Conversaciones (Marcadores Inteligentes):** Pestañas dedicadas a trackear páginas específicas como `/grafoDeDiscurso` o `/conversacionesChatbots`.
- **Auto-Escaneo Masivo:** Descubrimiento automático de flujos de trabajo basados en patrones de nombre directamente en todos los grafos activos.
- **Historial Dedicado:** Nueva pestaña que centraliza todos los logs de operaciones en una vista de pantalla completa.
- **Filtros Avanzados:** Filtra por tiempo (Hoy/Ayer/Semana), tipo de acción (Creación/Modificación) y tipo de elemento (Página/Bloque).
- **Gestión de Grafos Mejorada:** Los grafos se gestionan y activan íntegramente desde la pestaña de Configuración, eliminando la necesidad de una barra lateral.
- **Persistencia de Selección:** Recuerda tus grafos activos y los plugins seleccionados automáticamente entre sesiones.
- **Crear páginas** en múltiples grafos con un solo clic.
- **Modificar títulos** de páginas existentes.
- **Eliminar páginas** con confirmación de seguridad.
- **Preview antes de ejecutar** cada operación.
- **🔌 Sincronización de Plugins:** Escanea automáticamente todos tus plugins `roam/js/` en los grafos activos, selecciona uno, pega el código nuevo y sincronízalo en todos los grafos con un solo click. Incluye opción para crear el plugin en grafos donde aún no existe.
- **🛡️ Auto-Shutdown Inteligente:** El servidor local se cierra automáticamente al detectar inactividad (heartbeat optimizado de 15s), manteniendo tu entorno limpio.
- **🔗 Proxy de API (v0.4.2):** Las operaciones de escritura se realizan a través del servidor local para permitir la subida de plugins pesados y manejar redirecciones de la API de Roam.
- **⚡ Optimización de Recursos (v0.6.0):** Implementación de **Caché en Memoria (30s TTL)**, servidor multi-hilo, y reducción del tráfico de red para una experiencia ultra-fluida.

## 📋 Requisitos

1. Cuenta de Roam Research con acceso a la API
2. **Grafos NO encriptados** (la API no soporta E2E encryption)
3. Navegador moderno (Chrome, Firefox, Edge)

## 🔧 Configuración

### 1. Obtener API Token

Para cada grafo que quieras gestionar:

1. Abre el grafo en Roam Research
2. Ve a **Settings** (⚙️)
3. Click en la pestaña **Graph**
4. En la sección **API Tokens**, click **+ New API Token**
5. Ponle un nombre descriptivo (ej: "Multi-Graph Manager")
6. Selecciona el scope **edit** (para poder crear/modificar/eliminar)
7. Copia el token generado

### 2. Configurar y Activar Grafos

1. Crea un archivo `config.local.js` en la raíz del proyecto con tus grafos (ver instrucciones abajo)
2. Ejecuta `iniciar.bat` (doble click) para iniciar el servidor local
3. Se abrirá automáticamente el navegador con la app en `http://localhost:8000`
4. Ve a la pestaña **⚙️ Configuración**.
5. En la columna **Tus Grafos**, marca los checkboxes de los grafos que quieras activar.
6. Los grafos seleccionados aparecerán en la columna **Grafos Activos** para confirmar tu selección antes de operar.


### 3. Registrar Páginas de Interés (Manual o Auto)
1. Ve a la pestaña **Grafos** o **Conversaciones**.
2. **Método Automático:** Click en **🔍 Auto-Escanear** para encontrar y registrar instantáneamente todas las páginas que sigan la nomenclatura correspondiente (`/grafoDeDiscurso` o `/conversacionesChatbots`) en tus grafos activos.
3. **Método Manual:** Click en **+ Nuevo Registro**, selecciona el grafo y escribe el título exacto.
4. Las páginas aparecerán en tu listado con monitoreo en vivo de su última fecha de actualización, ordenadas por actividad reciente.

## 🎯 Uso

### Crear Página

1. Selecciona los grafos destino (checkboxes en el panel izquierdo)
2. Ve a la pestaña **➕ Crear**
3. Ingresa el título de la página
4. (Opcional) Agrega contenido inicial - cada línea será un bloque
5. Click en **Crear Página**

### Modificar Página

1. Selecciona los grafos donde existe la página
2. Ve a la pestaña **✏️ Modificar**
3. Ingresa el título exacto de la página a buscar
4. Ingresa el nuevo título
5. Click en **Modificar Página**

### Eliminar Página

1. Selecciona los grafos donde quieres eliminar
2. Ve a la pestaña **🗑️ Eliminar**
3. Ingresa el título exacto de la página
4. Click en **Eliminar Página**
5. Confirma en el modal de seguridad

### 🔌 Sincronizar Plugins

1. Ve a la pestaña **Plugins**
2. Click en **🔍 Escanear Plugins** para descubrir todas las páginas `roam/js/*` en tus grafos activos
3. En la lista de **Plugins Descubiertos** (abajo), marca los plugins que quieres sincronizar usando los checkboxes
4. Los plugins seleccionados aparecerán en la columna izquierda **Plugin Seleccionado** con su información
5. En la columna **Grafos Destino**, selecciona los grafos donde quieres sincronizar (o usa el botón ☑ para seleccionar todos)
6. Pega el código JavaScript actualizado en el textarea de la columna **Código JavaScript**
7. (Opcional) Marca "Crear en grafos faltantes" si quieres crear el plugin en grafos donde no existe
8. Click en **🔄 Sincronizar Plugin** y confirma
9. La app reemplazará el contenido en cada grafo con la estructura: `{{[[roam/js]]}}` → ` ```javascript [código] ``` `

## ⚠️ Notas Importantes

- Los tokens se guardan en `localStorage` del navegador
- **No uses esta app en computadoras públicas**
- Los grafos encriptados (E2E) no son compatibles con la API
- La búsqueda de páginas es por título **exacto**
- **Importante:** Siempre usa `iniciar.bat` (servidor local) para abrir la app. Abrir `index.html` directamente causará errores CORS al intentar escribir en los grafos.

## 🚀 Inicio Rápido

1. Haz **doble click** en `iniciar.bat`
2. Se abrirá automáticamente la app en tu navegador
3. ¡Listo para usar!

## 📁 Estructura

```
roamMultiGraphManager/
├── index.html         # Interfaz principal
├── config.local.js    # Configuración local (tokens de API) - NO subir a Git
├── .gitignore         # Excluye config.local.js
├── docs/              # Documentación y referencias externas
├── css/
│   └── styles.css     # Estilos dark theme
├── js/
│   ├── app.js         # Punto de entrada
│   ├── api.js         # Wrapper Roam API
│   ├── storage.js     # Gestión de tokens/logs
│   └── ui.js          # Componentes de UI
└── README.md          # Este archivo
├── server.py          # Servidor personalizado con auto-shutdown
```

## 🔐 Configuración Local (Tokens de API)

Para proteger tus tokens de API, puedes crear un archivo `config.local.js` con tus grafos. Este archivo **no se subirá a Git** gracias al `.gitignore`.

### Cómo crear config.local.js

1. Crea un archivo llamado `config.local.js` en la raíz del proyecto
2. Agrega tus grafos:

```javascript
// config.local.js
const LOCAL_CONFIG = {
    graphs: {
        "nombre-grafo-1": "roam-graph-token-xxx",
        "nombre-grafo-2": "roam-graph-token-yyy"
    }
};
```

3. Los grafos se cargarán automáticamente al abrir la aplicación

> **Nota:** Si no existe `config.local.js`, la aplicación funcionará pero sin grafos precargados. Deberás crear el archivo para agregar tus grafos.

## 🔗 Referencias

- [Roam API SDK (npm)](https://www.npmjs.com/package/@roam-research/roam-api-sdk)
- [Roam Developer Documentation](https://roamresearch.com/#/app/developer-documentation)
