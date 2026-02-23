const App = {
    selectedGraphs: new Set(),
    currentOperation: 'create',
    currentView: 'dashboard', // default top-level view
    selectedPlugins: new Set(), // multiple selected plugins for sync

    // Sort states
    dashboardSort: { column: 'time', direction: 'desc' },
    registrosSort: { column: 'status', direction: 'desc' },
    conversacionesSort: { column: 'status', direction: 'desc' },

    // Data caches for sorting without API calls
    lastDashboardData: null,
    lastRegistrosData: null,
    lastConversacionesData: null,

    /**
     * Initialize the application
     */
    init() {
        this.seedDefaultGraphs();
        this.bindEvents();
        this.loadSelectedGraphsState();
        this.loadSelectedPluginsState();
        this.loadGraphs();
        this.renderLogs();
        this.setActiveTab('create');
        this.renderGraphCheckboxes();
        this.setupAutoShutdown();
    },

    /**
     * Load selected plugins state from storage
     */
    loadSelectedPluginsState() {
        const saved = Storage.getSelectedPlugins();
        this.selectedPlugins = new Set(saved);

        // Opcionalmente, verificar que los plugins sigan existiendo
        const allPlugins = Storage.getPlugins();
        let changed = false;
        for (const name of this.selectedPlugins) {
            if (!allPlugins.find(p => p.name === name)) {
                this.selectedPlugins.delete(name);
                changed = true;
            }
        }
        if (changed) {
            Storage.saveSelectedPlugins(Array.from(this.selectedPlugins));
        }
    },

    /**
     * Setup auto-shutdown listener using a heartbeat (ping) mechanism
     */
    setupAutoShutdown() {
        // Enviar un "latido" al servidor cada 2 segundos.
        // Si el servidor deja de recibir estos latidos durante 5 segundos (porque cerraste la pestaña), se auto-apagará.
        setInterval(() => {
            fetch('/heartbeat', { cache: 'no-store' }).catch(() => { });
        }, 2000);
    },

    /**
     * Render graph checkboxes in operations panel
     */
    renderGraphCheckboxes() {
        const container = document.getElementById('graphs-checkboxes');
        if (!container) return;

        const allGraphs = Storage.getGraphs();
        const graphNames = Object.keys(allGraphs).sort();

        if (graphNames.length === 0) {
            container.innerHTML = '<p class="hint">No hay grafos configurados</p>';
            return;
        }

        container.innerHTML = graphNames.map(graphName => `
            <label>
                <input 
                    type="checkbox" 
                    class="graph-checkbox" 
                    data-graph="${CSS.escape(graphName)}"
                    ${this.selectedGraphs.has(graphName) ? 'checked' : ''}
                >
                <span class="graph-label-text">${UI.escapeHTML(graphName)}</span>
            </label>
        `).join('');

        // Bind checkbox change events
        container.querySelectorAll('.graph-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const graphName = e.target.dataset.graph;
                this.toggleGraphSelection(graphName, e.target.checked);
            });
        });
    },

    sortDashboard(column) {
        if (this.dashboardSort.column === column) {
            this.dashboardSort.direction = this.dashboardSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.dashboardSort.column = column;
            this.dashboardSort.direction = 'asc';
        }
        if (this.lastDashboardData) {
            const container = document.getElementById('dashboard-content');
            const viewMode = document.getElementById('dashboard-view-mode')?.value || 'columns';
            UI.renderDashboardActivity(container, this.lastDashboardData, viewMode, this.dashboardSort);
        }
    },

    sortRegistros(column) {
        if (this.registrosSort.column === column) {
            this.registrosSort.direction = this.registrosSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.registrosSort.column = column;
            this.registrosSort.direction = 'asc';
        }
        if (this.lastRegistrosData) {
            const container = document.getElementById('registros-content');
            UI.renderRegistros(container, this.lastRegistrosData, false, this.registrosSort, 'registro');
        }
    },

    sortConversaciones(column) {
        if (this.conversacionesSort.column === column) {
            this.conversacionesSort.direction = this.conversacionesSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.conversacionesSort.column = column;
            this.conversacionesSort.direction = 'asc';
        }
        if (this.lastConversacionesData) {
            const container = document.getElementById('conversaciones-content');
            UI.renderRegistros(container, this.lastConversacionesData, false, this.conversacionesSort, 'conversacion');
        }
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
     * Seed default graphs from config.local.js
     * Loads configuration from config.local.js if it exists
     */
    seedDefaultGraphs() {
        // Load local config if it exists (config.local.js)
        let defaultGraphs = {};

        if (typeof LOCAL_CONFIG !== 'undefined' && LOCAL_CONFIG && LOCAL_CONFIG.graphs) {
            defaultGraphs = LOCAL_CONFIG.graphs;
        }

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
        // Table sorting delegation
        document.addEventListener('click', (e) => {
            const dashboardHeader = e.target.closest('#dashboard-content .sortable-header');
            if (dashboardHeader) {
                const column = dashboardHeader.dataset.column;
                this.sortDashboard(column);
                return;
            }

            const registrosHeader = e.target.closest('#registros-content .sortable-header');
            if (registrosHeader) {
                const column = registrosHeader.dataset.column;
                this.sortRegistros(column);
                return;
            }

            const conversacionesHeader = e.target.closest('#conversaciones-content .sortable-header');
            if (conversacionesHeader) {
                const column = conversacionesHeader.dataset.column;
                this.sortConversaciones(column);
                return;
            }
        });

        // Top-level Navigation switching
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
        const filters = ['dashboard-time-filter', 'dashboard-action-filter', 'dashboard-view-mode'];
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

        // Graph checkboxes in operations panel
        document.getElementById('graphs-checkboxes')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('graph-checkbox')) {
                const graphName = e.target.dataset.graph;
                this.toggleGraphSelection(graphName, e.target.checked);
            }
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

        // Conversaciones interactions
        document.getElementById('btn-show-add-conversacion')?.addEventListener('click', () => {
            document.getElementById('add-conversacion-container').style.display = 'block';
        });

        document.getElementById('btn-cancel-conversacion')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('add-conversacion-container').style.display = 'none';
            document.getElementById('form-add-conversacion').reset();
        });

        document.getElementById('btn-auto-scan-conversaciones')?.addEventListener('click', () => {
            this.autoScanConversaciones();
        });

        document.getElementById('form-add-conversacion')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addConversacion();
        });

        document.getElementById('conversaciones-content')?.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-conversacion');
            if (deleteBtn) {
                this.deleteConversacion(deleteBtn.dataset.id);
            }
        });

        // Plugins interactions
        document.getElementById('btn-auto-scan-plugins')?.addEventListener('click', () => {
            this.autoScanPlugins();
        });

        // Select all/none for plugins graphs
        document.getElementById('btn-select-all-plugins')?.addEventListener('click', () => {
            this.toggleAllPluginGraphs(true);
        });

        // Plugin sync button
        document.getElementById('btn-execute-sync')?.addEventListener('click', () => {
            this.executeSyncPlugin();
        });

        // Plugin list: checkbox change or delete
        document.getElementById('plugins-content')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('plugin-checkbox')) {
                const pluginName = e.target.dataset.pluginName;
                this.togglePluginSelection(pluginName, e.target.checked);
                return;
            }
        });

        document.getElementById('plugins-content')?.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-plugin');
            if (deleteBtn) {
                e.stopPropagation();
                this.deletePlugin(deleteBtn.dataset.id);
            }
        });

        // Plugin sync panel: delegated events (buttons are dynamically created)
        document.getElementById('plugin-sync-panel')?.addEventListener('click', (e) => {
            if (e.target.closest('#btn-execute-sync')) {
                this.executeSyncPlugin();
            }
            if (e.target.closest('#btn-cancel-sync')) {
                this.selectedPluginName = null;
                this.refreshPlugins();
            }
        });

        // Plugin sync: live preview when typing code
        document.getElementById('plugin-sync-panel')?.addEventListener('input', (e) => {
            if (e.target.id === 'sync-code') {
                this.updateSyncPreview();
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

        // Auto-refresh when entering views
        if (viewName === 'dashboard') {
            this.refreshDashboard();
        } else if (viewName === 'registros') {
            this.refreshRegistros();
        } else if (viewName === 'conversaciones') {
            this.refreshConversaciones();
        } else if (viewName === 'plugins') {
            this.refreshPlugins();
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

                items.sort((a, b) => b.time - a.time);

                return { graphName, items: items.slice(0, 30), error: null };
            } catch (error) {
                console.error(`Error loading activity for ${graphName}:`, error);
                Storage.addLog('error', `Dashboard: Falló carga de ${graphName}`);
                return { graphName, items: [], error: error.message };
            }
        });

        graphData = await Promise.all(promises);
        this.lastDashboardData = graphData;

        const viewMode = document.getElementById('dashboard-view-mode')?.value || 'columns';

        // Render events grouped by graph according to the selected view mode
        UI.renderDashboardActivity(container, graphData, viewMode, this.dashboardSort);
    },

    /**
     * Load saved graphs
     */
    loadGraphs() {
        const graphs = Storage.getGraphs();
        this.renderGraphLists(graphs);
        this.renderGraphCheckboxes();

        // Update registros/conversaciones select
        const optionsHtml = '<option value="">Selecciona un grafo</option>' +
            Object.keys(graphs).map(name => `<option value="${name}">${name}</option>`).join('');

        const selectReg = document.getElementById('registro-graph');
        if (selectReg) selectReg.innerHTML = optionsHtml;

        const selectConv = document.getElementById('conversacion-graph');
        if (selectConv) selectConv.innerHTML = optionsHtml;
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

        // Update checkboxes in operations panel
        const checkbox = document.querySelector(`#graphs-checkboxes input[data-graph="${CSS.escape(name)}"]`);
        if (checkbox) {
            checkbox.checked = selected;
        }

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
        // Default initial sorting if not cached

        this.lastRegistrosData = registros;
        // Render in "loading times" state
        UI.renderRegistros(container, registros, true, this.registrosSort, 'registro');

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
        this.lastRegistrosData = updatedRegistros;
        UI.renderRegistros(container, updatedRegistros, false, this.registrosSort, 'registro');
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
     * Auto scan configured active graphs for /conversacionesChatbots
     */
    async autoScanConversaciones() {
        if (this.selectedGraphs.size === 0) {
            UI.toast('Selecciona al menos un grafo activo', 'warning');
            return;
        }

        const btn = document.getElementById('btn-auto-scan-conversaciones');
        if (btn) UI.setButtonLoading(btn, true);

        let addedCount = 0;
        const currentConversaciones = Storage.getConversaciones();
        const existingSet = new Set(currentConversaciones.map(r => `${r.graph}::${r.title}`));

        for (const graphName of this.selectedGraphs) {
            const config = Storage.getGraph(graphName);
            if (!config) continue;

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);
                const pages = await RoamAPI.getPagesBySuffix(graph, '/conversacionesChatbots');

                for (const title of pages) {
                    const key = `${graphName}::${title}`;
                    if (!existingSet.has(key)) {
                        Storage.saveConversacion({ graph: graphName, title });
                        existingSet.add(key);
                        addedCount++;
                    }
                }
            } catch (error) {
                console.error(`Error escaneando ${graphName}:`, error);
                Storage.addLog('error', `Error escaneando conversaciones en ${graphName}: ${error.message}`);
                UI.toast(`Error en ${graphName}: ${error.message}`, 'error');
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🔍 Auto-Escanear "/conversacionesChatbots"';
        }

        if (addedCount > 0) {
            UI.toast(`Se agregaron ${addedCount} nuevas conversaciones automáticamente`, 'success');
            Storage.addLog('success', `Auto-escaneo conversaciones: ${addedCount} páginas agregadas`);
            this.refreshConversaciones();
            this.renderLogs();
        } else {
            UI.toast('No se encontraron nuevas conversaciones', 'info');
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
    },

    /**
     * Refresh view of manual conversaciones
     */
    async refreshConversaciones() {
        const container = document.getElementById('conversaciones-content');
        if (!container) return;
        const conversaciones = Storage.getConversaciones();

        this.lastConversacionesData = conversaciones;
        // Render in "loading times" state
        UI.renderRegistros(container, conversaciones, true, this.conversacionesSort, 'conversacion');

        if (conversaciones.length === 0) return;

        // Fetch last edit times
        const timePromises = conversaciones.map(async (reg) => {
            const config = Storage.getGraph(reg.graph);
            if (!config) return { ...reg, lastEdited: null, error: 'Sin conf' };
            try {
                const graph = RoamAPI.initGraph(reg.graph, config.token);
                const time = await RoamAPI.getPageEditTime(graph, reg.title);
                return { ...reg, lastEdited: time, error: null };
            } catch (e) {
                return { ...reg, lastEdited: null, error: 'Error API' };
            }
        });

        const updatedConversaciones = await Promise.all(timePromises);
        this.lastConversacionesData = updatedConversaciones;
        UI.renderRegistros(container, updatedConversaciones, false, this.conversacionesSort, 'conversacion');
    },

    /**
     * Add new manual conversacion
     */
    addConversacion() {
        const graph = document.getElementById('conversacion-graph').value;
        const title = document.getElementById('conversacion-title').value.trim();

        if (!graph || !title) {
            UI.toast('Por favor completa todos los campos', 'error');
            return;
        }

        Storage.saveConversacion({ graph, title });

        document.getElementById('add-conversacion-container').style.display = 'none';
        document.getElementById('form-add-conversacion').reset();

        Storage.addLog('success', `Conversación añadida: ${title}`);
        UI.toast('Conversación registrada con éxito', 'success');

        this.refreshConversaciones();
        this.renderLogs();
    },

    /**
     * Render plugin info panel for selected plugins
     */
    renderPluginInfo() {
        const container = document.getElementById('plugin-info');
        if (!container) return;

        if (this.selectedPlugins.size === 0) {
            container.innerHTML = '<p class="hint">Selecciona plugins de la lista de abajo</p>';
            return;
        }

        const plugins = Storage.getPlugins().filter(p => this.selectedPlugins.has(p.name));

        if (plugins.length === 0) {
            container.innerHTML = '<p class="hint">Plugin no encontrado</p>';
            return;
        }

        // Show list with one radio per plugin (only one active at a time)
        let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

        for (const plugin of plugins) {
            const isActive = this.selectedPluginName === plugin.name;

            html += `
                <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: ${isActive ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'}; border-radius: var(--radius-sm); cursor: pointer; border: 1px solid ${isActive ? 'var(--accent-purple)' : 'transparent'};">
                    <input type="radio" name="active-plugin" class="active-plugin-radio" value="${UI.escapeHTML(plugin.name)}" ${isActive ? 'checked' : ''}>
                    <span style="font-weight: 600; color: var(--accent-purple);">🔌 ${UI.escapeHTML(plugin.name)}</span>
                </label>
            `;
        }

        html += '</div>';

        // Add hint
        html += '<p class="hint" style="margin-top: 12px; font-size: 0.75rem;">Marca el plugin que vas a sincronizar ahora</p>';

        container.innerHTML = html;

        // Bind radio change events
        container.querySelectorAll('.active-plugin-radio').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedPluginName = e.target.value;
                    this.updatePluginCodeTextarea();
                }
            });
        });
    },

    /**
     * Render graph checkboxes in plugins panel (compact)
     */
    renderPluginGraphCheckboxes() {
        const container = document.getElementById('plugin-graphs-checkboxes');
        if (!container) return;

        const allGraphs = Storage.getGraphs();
        const graphNames = Object.keys(allGraphs).sort();

        if (graphNames.length === 0) {
            container.innerHTML = '<p class="hint">No hay grafos configurados</p>';
            return;
        }

        container.innerHTML = graphNames.map(graphName => `
            <label>
                <input 
                    type="checkbox" 
                    class="plugin-graph-checkbox" 
                    data-graph="${CSS.escape(graphName)}"
                >
                <span class="graph-label-text">${UI.escapeHTML(graphName)}</span>
            </label>
        `).join('');
    },

    /**
     * Toggle all plugin graph checkboxes on/off
     * @param {boolean} selectAll - Whether to select all
     */
    toggleAllPluginGraphs(selectAll) {
        const checkboxes = document.querySelectorAll('.plugin-graph-checkbox');
        checkboxes.forEach(cb => { cb.checked = selectAll; });
    },

    /**
     * Refresh plugins view - 3-column layout
     */
    refreshPlugins() {
        const container = document.getElementById('plugins-content');

        if (!container) return;

        const plugins = Storage.getPlugins();
        const totalGraphs = Storage.getGraphNames().length;

        // Render full plugin list (bottom) with multi-select checkboxes
        UI.renderPlugins(container, plugins, totalGraphs, this.selectedPlugins);

        // Render plugin info (shows all selected plugins)
        this.renderPluginInfo();

        // Render graph checkboxes
        this.renderPluginGraphCheckboxes();
    },

    /**
     * Update the code textarea when a plugin is selected
     */
    updatePluginCodeTextarea() {
        const codeTextarea = document.getElementById('sync-code');
        if (!codeTextarea) return;

        if (!this.selectedPluginName) {
            codeTextarea.value = '';
            return;
        }

        const plugin = Storage.getPlugins().find(p => p.name === this.selectedPluginName);
        if (!plugin) return;

        // Could optionally load existing code from one of the graphs
        // For now just show placeholder
        codeTextarea.placeholder = `Editando: ${plugin.name}\nPega el código actualizado aquí...`;
    },

    /**
     * Toggle plugin selection (for multi-select with checkboxes)
     * @param {string} pluginName - Plugin name
     * @param {boolean} selected - Selection state
     */
    togglePluginSelection(pluginName, selected) {
        if (selected) {
            this.selectedPlugins.add(pluginName);
        } else {
            this.selectedPlugins.delete(pluginName);
        }

        Storage.saveSelectedPlugins(Array.from(this.selectedPlugins));

        // Update plugin info column with all selected plugins
        this.renderPluginInfo();
    },

    /**
     * Auto scan all active graphs for roam/js/ pages
     */
    async autoScanPlugins() {
        if (this.selectedGraphs.size === 0) {
            UI.toast('Selecciona al menos un grafo activo', 'warning');
            return;
        }

        const btn = document.getElementById('btn-auto-scan-plugins');
        if (btn) UI.setButtonLoading(btn, true);

        let addedCount = 0;
        // Map: pluginName → Set of graphNames
        const pluginMap = new Map();

        for (const graphName of this.selectedGraphs) {
            const config = Storage.getGraph(graphName);
            if (!config) continue;

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);
                const pages = await RoamAPI.getPagesByPrefix(graph, 'roam/js/');

                for (const title of pages) {
                    // Skip the base "roam/js" page itself
                    if (title === 'roam/js') continue;

                    if (!pluginMap.has(title)) {
                        pluginMap.set(title, new Set());
                    }
                    pluginMap.get(title).add(graphName);
                }
            } catch (error) {
                console.error(`Error escaneando plugins en ${graphName}:`, error);
                Storage.addLog('error', `Error escaneando plugins en ${graphName}: ${error.message}`);
                UI.toast(`Error en ${graphName}: ${error.message}`, 'error');
            }
        }

        // Save discovered plugins
        for (const [pluginName, graphSet] of pluginMap) {
            const before = Storage.getPlugins().find(p => p.name === pluginName);
            const beforeCount = before ? before.graphs.length : 0;

            Storage.savePlugin({ name: pluginName, graphs: Array.from(graphSet) });

            const after = Storage.getPlugins().find(p => p.name === pluginName);
            const afterCount = after ? after.graphs.length : 0;

            if (!before || afterCount > beforeCount) {
                addedCount++;
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🔍 Escanear Plugins';
        }

        if (addedCount > 0 || pluginMap.size > 0) {
            UI.toast(`Escaneo completo: ${pluginMap.size} plugins encontrados, ${addedCount} nuevos/actualizados`, 'success');
            Storage.addLog('success', `Escaneo plugins: ${pluginMap.size} encontrados, ${addedCount} nuevos/actualizados`);
            this.refreshPlugins();
            this.renderLogs();
        } else {
            UI.toast('No se encontraron plugins roam/js/', 'info');
        }
    },

    /**
     * Update the live preview when typing code in the sync textarea
     */
    updateSyncPreview() {
        const previewContainer = document.getElementById('sync-preview');
        const previewContent = document.getElementById('sync-preview-content');
        const codeTextarea = document.getElementById('sync-code');

        if (!previewContainer || !previewContent || !codeTextarea) return;

        const code = codeTextarea.value.trim();

        if (!code) {
            previewContainer.style.display = 'none';
            return;
        }

        previewContainer.style.display = 'block';

        const plugin = Storage.getPlugins().find(p => p.name === this.selectedPluginName);
        if (!plugin) return;

        // Use manually checked graphs from UI
        const checkboxes = document.querySelectorAll('.plugin-graph-checkbox:checked');
        const targetGraphs = Array.from(checkboxes).map(cb => cb.dataset.graph);
        const codePreview = code.length > 200 ? code.substring(0, 200) + '...' : code;

        previewContent.innerHTML = `
            <p><strong>Plugin:</strong> ${UI.escapeHTML(this.selectedPluginName)}</p>
            <p><strong>Grafos destino (${targetGraphs.length}):</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0 8px;">
                ${targetGraphs.map(g => {
            const isMissing = !plugin.graphs.includes(g);
            return `<span class="graph-pill" style="font-size: 0.7rem; ${isMissing ? 'border-color: var(--accent-yellow); color: var(--accent-yellow);' : ''}">${UI.escapeHTML(g)}${isMissing ? ' (nuevo)' : ''}</span>`;
        }).join('')}
            </div>
            <p><strong>Estructura:</strong></p>
            <pre style="background: var(--bg-tertiary); padding: 8px; border-radius: 4px; font-size: 0.8rem; overflow-x: auto; margin-top: 4px;">+ {{[[roam/js]]}}
  └─ \`\`\`javascript
     ${UI.escapeHTML(codePreview)}
     \`\`\`</pre>
        `;
    },

    /**
     * Execute plugin sync across graphs
     */
    async executeSyncPlugin() {
        if (!this.selectedPluginName) {
            UI.toast('No hay plugin seleccionado', 'error');
            return;
        }

        const codeTextarea = document.getElementById('sync-code');
        const code = codeTextarea?.value?.trim();

        if (!code) {
            UI.toast('Pega el código del plugin antes de sincronizar', 'error');
            return;
        }

        const plugin = Storage.getPlugins().find(p => p.name === this.selectedPluginName);
        if (!plugin) {
            UI.toast('Plugin no encontrado', 'error');
            return;
        }

        // Use manually checked graphs from UI
        const checkboxes = document.querySelectorAll('.plugin-graph-checkbox:checked');
        const targetGraphs = Array.from(checkboxes).map(cb => cb.dataset.graph);

        if (targetGraphs.length === 0) {
            UI.toast('Selecciona al menos un grafo destino', 'error');
            return;
        }

        // Confirmation
        const confirmed = await UI.confirm(
            '🔄 Sincronizar Plugin',
            `¿Seguro que quieres sincronizar "${this.selectedPluginName}" en ${targetGraphs.length} grafo(s)? Esto reemplazará TODO el contenido existente de la página.`
        );

        if (!confirmed) return;

        const syncBtn = document.getElementById('btn-execute-sync');
        if (syncBtn) UI.setButtonLoading(syncBtn, true);

        const results = [];

        for (const graphName of targetGraphs) {
            const config = Storage.getGraph(graphName);
            if (!config) {
                results.push({ graph: graphName, success: false, message: 'Sin configuración' });
                continue;
            }

            try {
                const graph = RoamAPI.initGraph(graphName, config.token);
                const isNewGraph = !plugin.graphs.includes(graphName);

                const result = await RoamAPI.syncPluginPage(graph, this.selectedPluginName, code, isNewGraph);

                results.push({ graph: graphName, success: result.success, message: result.message });

                if (result.success) {
                    Storage.addLog('success', `Plugin "${this.selectedPluginName}" sincronizado en ${graphName}`);

                    // If this was a new graph, update the plugin's graph list
                    if (isNewGraph) {
                        Storage.savePlugin({ name: this.selectedPluginName, graphs: [graphName] });
                    }
                } else {
                    Storage.addLog('error', `Plugin "${this.selectedPluginName}" falló en ${graphName}: ${result.message}`);
                }
            } catch (error) {
                results.push({ graph: graphName, success: false, message: error.message });
                Storage.addLog('error', `Error sync plugin en ${graphName}: ${error.message}`);
            }
        }

        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = '🔄 Sincronizar Plugin';
        }

        UI.showResults(results);
        this.renderLogs();

        // Clear code and deselect on success
        const successCount = results.filter(r => r.success).length;
        if (successCount > 0) {
            UI.toast(`Plugin sincronizado en ${successCount}/${targetGraphs.length} grafos`, 'success');
        }
    },

    /**
     * Delete a plugin entry from storage
     * @param {string} id - Plugin ID
     */
    async deletePlugin(id) {
        const confirmed = await UI.confirm(
            'Eliminar plugin',
            '¿Seguro que quieres eliminar este plugin del registro? No se eliminará la página de Roam.'
        );

        if (confirmed) {
            // If deleted plugin was selected, deselect
            const plugin = Storage.getPlugins().find(p => p.id === id);
            if (plugin && plugin.name === this.selectedPluginName) {
                this.selectedPluginName = null;
            }

            // Si el plugin estaba seleccionado para sync, quitarlo de la selección persistente
            if (plugin && this.selectedPlugins.has(plugin.name)) {
                this.selectedPlugins.delete(plugin.name);
                Storage.saveSelectedPlugins(Array.from(this.selectedPlugins));
            }

            Storage.deletePlugin(id);
            UI.toast('Plugin eliminado del registro', 'info');
            this.refreshPlugins();
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Exported for use as module
