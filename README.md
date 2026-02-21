# Roam Multi-Graph Manager

Aplicación web para gestionar páginas en múltiples grafos de Roam Research simultáneamente.

## 🚀 Características

- **Dashboard de Actividad:** Visualización read-only de páginas creadas y bloques modificados recientemente
- **Filtros Temporales:** Consulta actividad de "Hoy", "Ayer" o "Esta Semana" en todos tus grafos
- **Crear páginas** en múltiples grafos con un solo clic
- **Modificar títulos** de páginas existentes
- **Eliminar páginas** con confirmación de seguridad
- **Gestión de múltiples grafos** con sus tokens de API
- **Preview antes de ejecutar** cada operación
- **Historial de operaciones** con logs detallados

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

### 2. Agregar Grafos a la App

1. Abre `index.html` en tu navegador
2. En el panel izquierdo, ingresa el nombre del grafo (exactamente como aparece en Roam)
3. Pega el API Token
4. Click en "Agregar Grafo"
5. Repite para cada grafo

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

## ⚠️ Notas Importantes

- Los tokens se guardan en `localStorage` del navegador
- **No uses esta app en computadoras públicas**
- Los grafos encriptados (E2E) no son compatibles con la API
- La búsqueda de páginas es por título **exacto**

## 📁 Estructura

```
roamMultiGraphManager/
├── index.html      # Interfaz principal
├── docs/           # Documentación y referencias externas
├── css/
│   └── styles.css  # Estilos dark theme
├── js/
│   ├── app.js      # Punto de entrada (ES Module)
│   ├── api.js      # Wrapper Roam API
│   ├── storage.js  # Gestión de tokens/logs
│   └── ui.js       # Componentes de UI
└── README.md       # Este archivo
```

## 🔗 Referencias

- [Roam API SDK (npm)](https://www.npmjs.com/package/@roam-research/roam-api-sdk)
- [Roam Developer Documentation](https://roamresearch.com/#/app/developer-documentation)
