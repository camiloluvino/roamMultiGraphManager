# Roam Multi-Graph Manager - AI Instructions

## 1. Descripción del Proyecto
Aplicación web vanilla para gestionar páginas en múltiples grafos de Roam Research de forma simultánea. Permite crear, modificar y eliminar páginas usando la API de Roam, manteniendo la configuración del usuario localmente en su navegador.

## 2. Fuente de Verdad y Flujo de Trabajo
- **Archivos fuente directos:** No hay bundlers, transpiladores (Webpack, Vite, Babel) ni proceso de build. Los archivos `.js`, `.html` y `.css` en la raíz son la versión ejecutada directamente por el navegador.
- **Edición:** Todos los archivos en el directorio del proyecto son editables y constituyen la única fuente de verdad.
- **Flujo de desarrollo:** Cualquier cambio en HTML, CSS o JS se refleja directamente al recargar la página en el navegador.

## 3. Arquitectura Conceptual
La aplicación sigue un patrón modular basado en namespaces globales (objetos de Javascript):
- `index.html`: Define la estructura y carga los scripts en un orden específico.
- `app.js` (`App`): El controlador principal. Coordina la inicialización, vincula eventos (event listeners) y ejecuta la lógica de mayor nivel de negocio.
- `ui.js` (`UI`): Capa de presentación abstracta. Contiene funciones puras de manipulación del DOM, modales, toasts y renderizado condicional.
- `api.js` (`RoamAPI`): Wrapper para la comunicación HTTP/WebSocket con la API de Roam Research.
- `storage.js` (`Storage`): Abstracción sobre `localStorage` para la persistencia de tokens de API y el registro (logs) de operaciones de manera segura.

## 4. Decisiones de Diseño
- **Vanilla web tech:** Se optó por cero dependencias de npm para mantener el despliegue trivial y la accesibilidad máxima sin curva de compilación.
- **Desacoplamiento UI/Lógica:** Se evita que `app.js` manipule `className` o `innerHTML` directamente, delegando eso a `ui.js`.
- **Persistencia local:** Los tokens y logs se almacenan en `localStorage`. Se debe advertir al usuario sobre los riesgos de seguridad asociados a este método en entornos compartidos.

## 5. Principios Operativos y Reglas
1. **Sin frameworks:** NO introduzcas React, Vue, ni bundlers a menos que el usuario lo solicite explícitamente. Mantén el código vanilla.
2. **Convenciones de Nombrado:**
   - Namespaces estructurales en PascalCase (`App`, `UI`, `Storage`, `RoamAPI`).
   - Métodos y variables en camelCase.
   - IDs de HTML y clases CSS en kebab-case.
3. **Manejo de Errores:** 
   - Las operaciones asíncronas deben siempre tener `try/catch`. 
   - Muestra siempre los errores al usuario utilizando `UI.toast(msg, 'error')`.
4. **Seguridad y DOM:** 
   - Siempre usa `UI.escapeHTML()` al renderizar datos dinámicos en literales de plantilla (template strings) para evitar XSS.
   - Evita re-renderizados destructivos (`innerHTML = ...`) de listas completas ante cambios de estado menores.
5. **Responsabilidad Modular:** `ui.js` NO debe contener estado de negocio. `app.js` coordina flujos. `api.js` es un wrapper basado en `fetch`.

## 6. Contexto Técnico Específico
- **Seguridad:** Los tokens de Roam Graph otorgan poder de escritura. El uso de `localStorage` requiere advertencias.
- **Limitaciones de API de Roam:** No soporta grafos encriptados (E2E).
- **Búsqueda exacta:** Se requiere coincidencia exacta del título de la página.

## 7. Fragilidades y Errores Comunes
- **Acoplamiento de selectores DOM:** `app.js` depende de IDs de HTML. Si cambias `index.html`, audita las referencias en `app.js`.
- **Asincronicidad de API:** Operar en múltiples grafos puede ser lento. Siempre usa `UI.setButtonLoading()` y bloques `finally` para no bloquear la interfaz permanentemente ante fallos.
- **Límites de Almacenamiento:** `Storage` tiene un límite de 100 logs para evitar saturar el `localStorage` del navegador.
