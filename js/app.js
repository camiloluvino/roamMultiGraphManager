const App = {
    selectedGraphs: new Set(),
    currentOperation: 'create',
    currentView: 'dashboard', // default top-level view

    /**
     * Initialize the application
     */
    init() {
        this.seedDefaultGraphs();
        this.bindEvents();
        this.loadSelectedGraphsState();
        this.loadGraphs();
        this.renderLogs();
        this.setActiveTab('create');
    },

    /**
     * Load selected graphs state from storage
     */
    loadSelectedGraphsState() {
        const saved = Storage.getSelectedGraphs();
        this.selectedGraphs = new Set(saved);

        // Verificamos que los grafos seleccionados sigan existiendo
        const allGraphs = Storage.getGraphs();
        let changed = false;
        for (const name of this.selectedGraphs) {
            if (!allGraphs[name]) {
                this.selectedGraphs.delete(name);
                changed = true;
            }
        }
        if (changed) {
            Storage.saveSelectedGraphs(Array.from(this.selectedGraphs));
        }
    },

    /**
     * Seed default graphs from config
     */
    seedDefaultGraphs() {
        const defaultGraphs = {
            "metodometodo": "roam-graph-token-sVJ9No69ESjfTCR60yKJzYImUTE67",
            "metodoMetodo_pensiero": "roam-graph-token-wDAIAWQfMpdfz_2yN7SFFBW0BefOD",
            "teson": "roam-graph-token-udznoik4TDVrCFM4EuQtivBfcN4fW",
            "teson_labmet": "roam-graph-token-Y0YY_J_Xn-l75hWclNZmk3O4q0_ek",
            "teson_taller": "roam-graph-token-mny9cg7j2XLLdzphsh2N89eiP14By",
            "mentographus": "roam-graph-token-MYpNKkFDjDCDWLsDx9f6jR4OnZ_Em",
            "terrenal_mh": "roam-graph-token-3zC91QuzJLljptDbOX6MEkRtSsNtX",
            "estoesTeoriaAvanzada": "roam-graph-token-9km0AjKE-WjFl-NrksFSRACIIcaV_",
            "estoesTeoriaAvanzada_psico": "roam-graph-token-2nOTXcZk5oL2qNZdoUEmUGrtGop5f"
        };

        const currentGraphs = Storage.getGraphs();
        let added = false;

        for (const [name, token] of Object.entries(defaultGraphs)) {
            if (!currentGraphs[name]) {
                Storage.saveGraph(name, token);
                added = true;
            }
        }

        if (added) {
            Storage.addLog('info', 'Grafos por defecto cargados automáticamente.');
        }
    },

    /**
     * Bind UI event listeners
     */
    bindEvents() {
        // Top-level View switching
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setActiveView(btn.dataset.view));
        });

        // Dashboard refresh
        document.getElementById('btn-refresh-dashboard')?.addEventListener('click', () => {
            if (this.currentView === 'dashboard') {
                this.refreshDashboard();
            }
        });

        // Dashboard filters change
        const filters = ['dashboard-time-filter', 'dashboard-action-filter', 'dashboard-type-filter', 'dashboard-view-mode'];
        filters.forEach(filterId => {
            document.getElementById(filterId)?.addEventListener('change', () => {
                if (this.currentView === 'dashboard') {
                    this.refreshDashboard();
                }
            });
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.setActiveTab(tab.dataset.tab));
        });

        // Add graph form
        document.getElementById('add-graph-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGraph();
        });

        // All graphs list interactions (Config Tab)
        document.getElementById('all-graph-list')?.addEventListener('click', (e) => {
            const graphItem = e.target.closest('.graph-item');
            if (!graphItem) return;

            if (e.target.classList.contains('btn-remove')) {
                this.removeGraph(graphItem.dataset.graph);
            } else {
                // Determine if it was the checkbox or the container clicked
                const isCheckbox = e.target.classList.contains('checkbox');
                const checkbox = graphItem.querySelector('.checkbox');

                // If container clicked, toggle the checkbox checked state
                if (!isCheckbox && checkbox) {
                    checkbox.checked = !checkbox.checked;
                }

                if (checkbox) {
                    // Update graph UI selection without destructive rerender
                    UI.toggleGraphItemSelection(graphItem, checkbox.checked);
                    // Update internal state
                    this.toggleGraphSelection(graphItem.dataset.graph, checkbox.checked);
                }
            }
        });

        // Active Graph list interactions (Sidebar)
        document.getElementById('active-graph-list')?.addEventListener('click', (e) => {
            const graphItem = e.target.closest('.graph-item');
            if (!graphItem) return;

            if (e.target.classList.contains('btn-deselect')) {
                this.toggleGraphSelection(graphItem.dataset.graph, false);
                // Also update the UI in the all-graph-list if available
                const allList = document.getElementById('all-graph-list');
                if (allList) {
                    // Try to toggle visually to avoid full reload
                    const item = allList.querySelector(`[data-graph="${CSS.escape(graphItem.dataset.graph)}"]`);
                    if (item) {
                        const cb = item.querySelector('.checkbox');
                        if (cb) cb.checked = false;
                        UI.toggleGraphItemSelection(item, false);
                    }
                }
            }
        });

        // Select all/none buttons
        document.getElementById('btn-select-all')?.addEventListener('click', () => this.selectAllGraphs(true));
        document.getElementById('btn-select-none')?.addEventListener('click', () => this.selectAllGraphs(false));

        // Operation forms
        document.getElementById('form-create')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.executeCreate();
        });

        document.getElementById('form-update')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.executeUpdate();
        });

        document.getElementById('form-delete')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.executeDelete();
        });

        // Preview updates on input change
        document.querySelectorAll('.operation-form input, .operation-form textarea').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });

        // Clear logs button
        document.getElementById('btn-clear-logs')?.addEventListener('click', () => {
            Storage.clearLogs();
            this.renderLogs();
            UI.toast('Logs limpiados', 'info');
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) {
                    el.closest('.modal-overlay')?.classList.remove('active');
                }
            });
        });

        // Accordion interactions (Dashboard)
        document.getElementById('dashboard-content')?.addEventListener('click', (e) => {
            const header = e.target.closest('.accordion-header');
            if (header) {
                const item = header.closest('.accordion-item');
                if (item) {
                    item.classList.toggle('active');
                }
            }
        });

        // Registros interactions
        document.getElementById('btn-show-add-registro')?.addEventListener('click', () => {
            document.getElementById('add-registro-container').style.display = 'block';
        });

        document.getElementById('btn-cancel-registro')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('add-registro-container').style.display = 'none';
            document.getElementById('form-add-registro').reset();
        });

        document.getElementById('btn-auto-scan-registros')?.addEventListener('click', () => {
            this.autoScanRegistros();
        });

        document.getElementById('form-add-registro')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRegistro();
        });

        document.getElementById('registros-content')?.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-registro');
            if (deleteBtn) {
                this.deleteRegistro(deleteBtn.dataset.id);
            }
        });
    },

    /**
     * Set active tab
     * @param {string} tabName - Tab name
     */
    setActiveTab(tabName) {
        this.currentOperation = tabName;

        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        this.updatePreview();
    },

    /**
     * Set active top-level view (Dashboard / Operations)
     * @param {string} viewName - 'dashboard' | 'operations'
     */
    setActiveView(viewName) {
        this.currentView = viewName;

        // Toggle buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Toggle content containers
        document.querySelectorAll('.main-view').forEach(view => {
            view.classList.toggle('active', view.id === `view-${viewName}`);
        });

        // Auto-refresh dashboard when entering it
        if (viewName === 'dashboard') {
            this.refreshDashboard();
        } else if (viewName === 'registros') {
            this.refreshRegistros();
        }
    },

    /**
     * Refresh dashboard data from selected graphs
     */
    async refreshDashboard() {
        const container = document.getElementById('dashboard-content');
        // Filtering implementation
        const timeFilter = document.getElementById('dashboard-time-filter')?.value || 'all';
        const actionFilter = document.getElementById('dashboard-action-filter')?.value || 'all';
        const typeFilter = document.getElementById('dashboard-type-filter')?.value || 'all';

        let since = 0;
        let until = Infinity;
        const now = new Date();

        if (timeFilter === 'today') {
            now.setHours(0, 0, 0, 0);
            since = now.getTime();
        } else if (timeFilter === 'yesterday') {
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            until = today.getTime();

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            since = yesterday.getTime();
        } else if (timeFilter === 'week') {
            now.setHours(0, 0, 0, 0);
            now.setDate(now.getDate() - 7);
            since = now.getTime();
        }

        if (this.selectedGraphs.size === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📊</div>
                    <p>Selecciona grafos en el panel izquierdo para ver su actividad reciente.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `<div class="empty-state"><div class="spinner" style="margin: 0 auto 16px;"></div><p>Cargando actividad...</p></div>`;

        let graphData = [];

        // Fetch concurrently from selected graphs
        const promises = Array.from(this.selectedGraphs).map(async graphName => {
            const config = Storage.getGraph(graphName);
            if (!config) return { graphName, items: [], error: 'Configuración no encontrada' };

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);
                // Si hay filtro, traemos más items para no perder coincidencias antiguas
                const limit = timeFilter === 'all' ? 15 : 100;

                // Fire both queries
                const [pages, edits] = await Promise.all([
                    RoamAPI.getRecentPages(graph, limit, since, until),
                    RoamAPI.getRecentEdits(graph, limit, since, until)
                ]);

                let items = [...pages, ...edits];

                // Apply Time Filter
                if (timeFilter !== 'all') {
                    items = items.filter(item => item.time >= since && item.time < until);
                }

                // Apply Action Filter
                if (actionFilter !== 'all') {
                    items = items.filter(item => item.type === actionFilter);
                }

                // Apply Type Filter
                if (typeFilter !== 'all') {
                    items = items.filter(item => {
                        const isPage = item.type === 'create';
                        const itemType = isPage ? 'page' : 'block';
                        return itemType === typeFilter;
                    });
                }

                items.sort((a, b) => b.time - a.time);

                return { graphName, items: items.slice(0, 30), error: null };
            } catch (error) {
                console.error(`Error loading activity for ${graphName}:`, error);
                Storage.addLog('error', `Dashboard: Falló carga de ${graphName}`);
                return { graphName, items: [], error: error.message };
            }
        });

        graphData = await Promise.all(promises);

        const viewMode = document.getElementById('dashboard-view-mode')?.value || 'columns';

        // Render events grouped by graph according to the selected view mode
        UI.renderDashboardActivity(container, graphData, viewMode);
    },

    /**
     * Load saved graphs
     */
    loadGraphs() {
        const graphs = Storage.getGraphs();
        this.renderGraphLists(graphs);

        // Update registros select
        const select = document.getElementById('registro-graph');
        if (select) {
            select.innerHTML = '<option value="">Selecciona un grafo</option>' +
                Object.keys(graphs).map(name => `<option value="${name}">${name}</option>`).join('');
        }
    },

    /**
     * Render graph lists
     * @param {Object} graphs - Graph configurations
     */
    renderGraphLists(graphs) {
        const activeContainer = document.getElementById('active-graph-list');
        const allContainer = document.getElementById('all-graph-list');

        if (activeContainer) {
            UI.renderActiveGraphsList(activeContainer, this.selectedGraphs, graphs);
        }
        if (allContainer) {
            UI.renderAllGraphsList(allContainer, graphs, this.selectedGraphs);
        }
    },

    /**
     * Add a new graph
     */
    async addGraph() {
        const nameInput = document.getElementById('graph-name');
        const tokenInput = document.getElementById('graph-token');
        const submitBtn = document.querySelector('#add-graph-form button[type="submit"]');

        const name = nameInput.value.trim();
        const token = tokenInput.value.trim();

        if (!name || !token) {
            UI.toast('Ingresa nombre y token del grafo', 'error');
            return;
        }

        // Check if already exists
        if (Storage.getGraph(name)) {
            UI.toast(`El grafo "${name}" ya existe`, 'error');
            return;
        }

        UI.setButtonLoading(submitBtn, true);

        try {
            // Test connection
            const graph = RoamAPI.initGraph(name, token);
            const connected = await RoamAPI.testConnection(graph);

            // Save graph
            Storage.saveGraph(name, token);
            Storage.updateGraphStatus(name, connected ? 'connected' : 'error');
            Storage.addLog(
                connected ? 'success' : 'error',
                `Grafo "${name}" ${connected ? 'agregado y conectado' : 'agregado (error de conexión)'}`
            );

            // Clear form and reload
            nameInput.value = '';
            tokenInput.value = '';
            this.loadGraphs();
            this.renderLogs();

            UI.toast(
                connected ? `Grafo "${name}" agregado correctamente` : `Grafo agregado pero hay error de conexión`,
                connected ? 'success' : 'warning'
            );
        } catch (error) {
            UI.toast(`Error: ${error.message}`, 'error');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    },

    /**
     * Remove a graph
     * @param {string} name - Graph name
     */
    async removeGraph(name) {
        const confirmed = await UI.confirm(
            'Eliminar grafo',
            `¿Seguro que quieres eliminar "${name}"? Solo se elimina la configuración local.`
        );

        if (confirmed) {
            Storage.removeGraph(name);
            this.selectedGraphs.delete(name);
            Storage.saveSelectedGraphs(Array.from(this.selectedGraphs));
            this.loadGraphs();
            Storage.addLog('info', `Grafo "${name}" eliminado de la configuración`);
            this.renderLogs();
            UI.toast(`Grafo "${name}" eliminado`, 'info');
        }
    },

    /**
     * Toggle graph selection
     * @param {string} name - Graph name
     * @param {boolean} selected - Selection state
     */
    toggleGraphSelection(name, selected) {
        if (selected) {
            this.selectedGraphs.add(name);
        } else {
            this.selectedGraphs.delete(name);
        }
        Storage.saveSelectedGraphs(Array.from(this.selectedGraphs));

        // Update active graphs view in sidebar
        const graphs = Storage.getGraphs();
        const activeContainer = document.getElementById('active-graph-list');
        if (activeContainer) {
            UI.renderActiveGraphsList(activeContainer, this.selectedGraphs, graphs);
        }

        // Update specific view based on what is active
        if (this.currentView === 'dashboard') {
            this.refreshDashboard();
        } else {
            this.updatePreview();
        }
    },

    /**
     * Select all or no graphs
     * @param {boolean} selectAll - Whether to select all
     */
    selectAllGraphs(selectAll) {
        const graphNames = Storage.getGraphNames();

        if (selectAll) {
            graphNames.forEach(name => this.selectedGraphs.add(name));
        } else {
            this.selectedGraphs.clear();
        }

        Storage.saveSelectedGraphs(Array.from(this.selectedGraphs));
        this.loadGraphs();
        this.updatePreview();
    },

    /**
     * Update preview panel
     */
    updatePreview() {
        const container = document.getElementById('preview-panel');
        const data = this.getFormData();
        UI.renderPreview(container, this.currentOperation, data, Array.from(this.selectedGraphs));
    },

    /**
     * Get form data for current operation
     * @returns {Object} Form data
     */
    getFormData() {
        const data = {};

        switch (this.currentOperation) {
            case 'create':
                data.title = document.getElementById('create-title')?.value || '';
                data.content = (document.getElementById('create-content')?.value || '').split('\n').filter(l => l.trim());
                break;
            case 'update':
                data.pageTitle = document.getElementById('update-search')?.value || '';
                data.newTitle = document.getElementById('update-title')?.value || '';
                break;
            case 'delete':
                data.title = document.getElementById('delete-search')?.value || '';
                break;
        }

        return data;
    },

    /**
     * Execute create operation
     */
    async executeCreate() {
        const data = this.getFormData();

        if (!data.title) {
            UI.toast('Ingresa el título de la página', 'error');
            return;
        }

        if (this.selectedGraphs.size === 0) {
            UI.toast('Selecciona al menos un grafo', 'error');
            return;
        }

        const submitBtn = document.querySelector('#form-create button[type="submit"]');
        UI.setButtonLoading(submitBtn, true);

        const results = [];

        for (const graphName of this.selectedGraphs) {
            const config = Storage.getGraph(graphName);
            if (!config) continue;

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);

                // Check if page exists
                const exists = await RoamAPI.pageExists(graph, data.title);
                if (exists) {
                    results.push({ graph: graphName, success: false, message: 'La página ya existe' });
                    continue;
                }

                // Create page with content
                await RoamAPI.createPageWithContent(graph, data.title, data.content);
                results.push({ graph: graphName, success: true, message: 'Página creada' });

                Storage.addLog('success', `Página "${data.title}" creada en ${graphName}`);
            } catch (error) {
                results.push({ graph: graphName, success: false, message: error.message });
                Storage.addLog('error', `Error en ${graphName}: ${error.message}`);
            }
        }

        UI.setButtonLoading(submitBtn, false);
        UI.showResults(results);
        this.renderLogs();

        // Clear form on success
        if (results.some(r => r.success)) {
            document.getElementById('create-title').value = '';
            document.getElementById('create-content').value = '';
            this.updatePreview();
        }
    },

    /**
     * Execute update operation
     */
    async executeUpdate() {
        const data = this.getFormData();

        if (!data.pageTitle) {
            UI.toast('Ingresa el título de la página a buscar', 'error');
            return;
        }

        if (!data.newTitle) {
            UI.toast('Ingresa el nuevo título', 'error');
            return;
        }

        if (this.selectedGraphs.size === 0) {
            UI.toast('Selecciona al menos un grafo', 'error');
            return;
        }

        const submitBtn = document.querySelector('#form-update button[type="submit"]');
        UI.setButtonLoading(submitBtn, true);

        const results = [];

        for (const graphName of this.selectedGraphs) {
            const config = Storage.getGraph(graphName);
            if (!config) continue;

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);

                // Find page
                const page = await RoamAPI.getPageByTitle(graph, data.pageTitle);
                if (!page) {
                    results.push({ graph: graphName, success: false, message: 'Página no encontrada' });
                    continue;
                }

                // Update page
                await RoamAPI.updatePage(graph, page[':block/uid'], data.newTitle);
                results.push({ graph: graphName, success: true, message: 'Página actualizada' });

                Storage.addLog('success', `Página "${data.pageTitle}" → "${data.newTitle}" en ${graphName}`);
            } catch (error) {
                results.push({ graph: graphName, success: false, message: error.message });
                Storage.addLog('error', `Error en ${graphName}: ${error.message}`);
            }
        }

        UI.setButtonLoading(submitBtn, false);
        UI.showResults(results);
        this.renderLogs();
    },

    /**
     * Execute delete operation
     */
    async executeDelete() {
        const data = this.getFormData();

        if (!data.title) {
            UI.toast('Ingresa el título de la página a eliminar', 'error');
            return;
        }

        if (this.selectedGraphs.size === 0) {
            UI.toast('Selecciona al menos un grafo', 'error');
            return;
        }

        // Double confirm for delete
        const confirmed = await UI.confirm(
            '⚠️ Eliminar página',
            `¿Seguro que quieres eliminar "${data.title}" de ${this.selectedGraphs.size} grafo(s)? Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        const submitBtn = document.querySelector('#form-delete button[type="submit"]');
        UI.setButtonLoading(submitBtn, true);

        const results = [];

        for (const graphName of this.selectedGraphs) {
            const config = Storage.getGraph(graphName);
            if (!config) continue;

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);

                // Find page
                const page = await RoamAPI.getPageByTitle(graph, data.title);
                if (!page) {
                    results.push({ graph: graphName, success: false, message: 'Página no encontrada' });
                    continue;
                }

                // Delete page
                await RoamAPI.deletePage(graph, page[':block/uid']);
                results.push({ graph: graphName, success: true, message: 'Página eliminada' });

                Storage.addLog('success', `Página "${data.title}" eliminada de ${graphName}`);
            } catch (error) {
                results.push({ graph: graphName, success: false, message: error.message });
                Storage.addLog('error', `Error en ${graphName}: ${error.message}`);
            }
        }

        UI.setButtonLoading(submitBtn, false);
        UI.showResults(results);
        this.renderLogs();

        // Clear form
        document.getElementById('delete-search').value = '';
        this.updatePreview();
    },

    /**
     * Render logs
     */
    renderLogs() {
        const container = document.getElementById('logs-list');
        const logs = Storage.getLogs();
        UI.renderLogs(container, logs);
    },

    /**
     * Refresh view of manual registers
     */
    async refreshRegistros() {
        const container = document.getElementById('registros-content');
        if (!container) return;
        const registros = Storage.getRegistros();
        // Sort newest first
        registros.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

        // Render in "loading times" state
        UI.renderRegistros(container, registros, true);

        if (registros.length === 0) return;

        // Fetch last edit times
        const timePromises = registros.map(async (reg) => {
            const config = Storage.getGraph(reg.graph);
            if (!config) return { ...reg, lastEdited: null, error: 'Sin conf' };
            try {
                const graph = RoamAPI.initGraph(reg.graph, config.token);
                // Return max edited time 
                const time = await RoamAPI.getPageEditTime(graph, reg.title);
                return { ...reg, lastEdited: time, error: null };
            } catch (e) {
                return { ...reg, lastEdited: null, error: 'Error API' };
            }
        });

        const updatedRegistros = await Promise.all(timePromises);
        UI.renderRegistros(container, updatedRegistros, false);
    },

    /**
     * Add new manual register
     */
    addRegistro() {
        const graph = document.getElementById('registro-graph').value;
        const title = document.getElementById('registro-title').value.trim();

        if (!graph || !title) {
            UI.toast('Por favor completa todos los campos', 'error');
            return;
        }

        Storage.saveRegistro({ graph, title });

        document.getElementById('add-registro-container').style.display = 'none';
        document.getElementById('form-add-registro').reset();

        Storage.addLog('success', `Registro manual añadido: ${title}`);
        UI.toast('Página registrada con éxito', 'success');

        this.refreshRegistros();
        this.renderLogs();
    },

    /**
     * Auto scan configured active graphs for /grafoDeDiscurso
     */
    async autoScanRegistros() {
        if (this.selectedGraphs.size === 0) {
            UI.toast('Selecciona al menos un grafo activo', 'warning');
            return;
        }

        const btn = document.getElementById('btn-auto-scan-registros');
        if (btn) UI.setButtonLoading(btn, true);

        let addedCount = 0;
        const currentRegistros = Storage.getRegistros();
        const existingSet = new Set(currentRegistros.map(r => `${r.graph}::${r.title}`));

        for (const graphName of this.selectedGraphs) {
            const config = Storage.getGraph(graphName);
            if (!config) continue;

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);
                // Hardcoded to suffix '/grafoDeDiscurso' per user requirement
                const pages = await RoamAPI.getPagesBySuffix(graph, '/grafoDeDiscurso');

                for (const title of pages) {
                    const key = `${graphName}::${title}`;
                    if (!existingSet.has(key)) {
                        Storage.saveRegistro({ graph: graphName, title });
                        existingSet.add(key);
                        addedCount++;
                    }
                }
            } catch (error) {
                console.error(`Error escaneando ${graphName}:`, error);
                Storage.addLog('error', `Error escaneando ${graphName}: ${error.message}`);
                UI.toast(`Error en ${graphName}: ${error.message}`, 'error');
            }
        }

        if (btn) {
            // Revert loading state
            btn.disabled = false;
            btn.innerHTML = '🔍 Auto-Escanear "/grafoDeDiscurso"';
        }

        if (addedCount > 0) {
            UI.toast(`Se agregaron ${addedCount} nuevos registros automáticamente`, 'success');
            Storage.addLog('success', `Auto-escaneo: ${addedCount} páginas agregadas`);
            this.refreshRegistros();
            this.renderLogs();
        } else {
            UI.toast('No se encontraron nuevos registros', 'info');
        }
    },

    /**
     * Delete manual register
     */
    async deleteRegistro(id) {
        const confirmed = await UI.confirm(
            'Eliminar registro',
            '¿Seguro que quieres eliminar este marcador? La página no se borrará de Roam.'
        );

        if (confirmed) {
            Storage.deleteRegistro(id);
            UI.toast('Registro eliminado', 'info');
            this.refreshRegistros();
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Exported for use as module
