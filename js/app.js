/**
 * Roam Multi-Graph Manager - Main Application
 * Coordinates all modules and handles main logic
 */

const App = {
    selectedGraphs: new Set(),
    currentOperation: 'create',

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.loadGraphs();
        this.renderLogs();
        this.setActiveTab('create');
    },

    /**
     * Bind UI event listeners
     */
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.setActiveTab(tab.dataset.tab));
        });

        // Add graph form
        document.getElementById('add-graph-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGraph();
        });

        // Graph list interactions
        document.getElementById('graph-list').addEventListener('click', (e) => {
            const graphItem = e.target.closest('.graph-item');
            if (!graphItem) return;

            if (e.target.classList.contains('btn-remove')) {
                this.removeGraph(graphItem.dataset.graph);
            } else {
                // Determine if it was the checkbox or the container clicked
                const isCheckbox = e.target.classList.contains('checkbox');
                const checkbox = graphItem.querySelector('.checkbox');

                // If container clicked, toggle the checkbox checked state
                if (!isCheckbox) {
                    checkbox.checked = !checkbox.checked;
                }

                // Update graph UI selection without destructive rerender
                UI.toggleGraphItemSelection(graphItem, checkbox.checked);

                // Update internal state
                this.toggleGraphSelection(graphItem.dataset.graph, checkbox.checked);
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
     * Load saved graphs
     */
    loadGraphs() {
        const graphs = Storage.getGraphs();
        this.renderGraphList(graphs);
    },

    /**
     * Render graph list
     * @param {Object} graphs - Graph configurations
     */
    renderGraphList(graphs) {
        const container = document.getElementById('graph-list');
        UI.renderGraphList(container, graphs, this.selectedGraphs);
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
        // ONLY update the preview, DO NOT reload all graphs destroying the DOM list
        this.updatePreview();
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
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Export for use
window.App = App;
