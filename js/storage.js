/**
 * Roam Multi-Graph Manager - Storage Module
 * Handles local persistence of configuration and logs
 */

const Storage = {
    KEYS: {
        GRAPHS: 'roam_mg_graphs',
        LOGS: 'roam_mg_logs',
        SELECTED_GRAPHS: 'roam_mg_selected',
        REGISTROS: 'roam_mg_registros',
        CONVERSACIONES: 'roam_mg_conversaciones',
        PLUGINS: 'roam_mg_plugins'
    },

    MAX_LOGS: 100,

    /**
     * Get all configured graphs
     * @returns {Object} Graph configurations
     */
    getGraphs() {
        try {
            const data = localStorage.getItem(this.KEYS.GRAPHS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading graphs from storage', e);
            return {};
        }
    },

    /**
     * Get all graph names
     * @returns {string[]} Array of graph names
     */
    getGraphNames() {
        return Object.keys(this.getGraphs());
    },

    /**
     * Get specific graph configuration
     * @param {string} name - Graph name
     * @returns {Object|null} Graph configuration
     */
    getGraph(name) {
        const graphs = this.getGraphs();
        return graphs[name] || null;
    },

    /**
     * Save a new graph or update token
     * @param {string} name - Graph name
     * @param {string} token - API token
     */
    saveGraph(name, token) {
        const graphs = this.getGraphs();
        graphs[name] = {
            token: token,
            status: 'pending',
            lastUpdated: new Date().toISOString()
        };
        this._saveGraphs(graphs);
    },

    /**
     * Update graph connection status
     * @param {string} name - Graph name
     * @param {string} status - 'connected' | 'error' | 'pending'
     */
    updateGraphStatus(name, status) {
        const graphs = this.getGraphs();
        if (graphs[name]) {
            graphs[name].status = status;
            this._saveGraphs(graphs);
        }
    },

    /**
     * Remove a graph
     * @param {string} name - Graph name
     */
    removeGraph(name) {
        const graphs = this.getGraphs();
        if (graphs[name]) {
            delete graphs[name];
            this._saveGraphs(graphs);
        }
    },

    /**
     * Internal method to save graphs object
     * @private
     */
    _saveGraphs(graphs) {
        try {
            localStorage.setItem(this.KEYS.GRAPHS, JSON.stringify(graphs));
        } catch (e) {
            console.error('Error saving graphs to storage', e);
        }
    },

    /**
     * Get selected graphs
     * @returns {string[]} Array of selected graph names
     */
    getSelectedGraphs() {
        try {
            const data = localStorage.getItem(this.KEYS.SELECTED_GRAPHS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading selected graphs from storage', e);
            return [];
        }
    },

    /**
     * Save selected graphs
     * @param {string[]} selectedGraphs - Array of selected graph names
     */
    saveSelectedGraphs(selectedGraphs) {
        try {
            localStorage.setItem(this.KEYS.SELECTED_GRAPHS, JSON.stringify(selectedGraphs));
        } catch (e) {
            console.error('Error saving selected graphs to storage', e);
        }
    },

    /**
     * Get execution logs
     * @returns {Array} Array of log objects
     */
    getLogs() {
        try {
            const data = localStorage.getItem(this.KEYS.LOGS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading logs from storage', e);
            return [];
        }
    },

    /**
     * Add a new log entry
     * @param {string} type - 'success' | 'error' | 'info' | 'warning'
     * @param {string} message - Log message
     */
    addLog(type, message) {
        const logs = this.getLogs();

        const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            timestamp: new Date().toISOString(),
            type: type,
            message: message
        };

        logs.unshift(newLog); // Add to beginning

        // Trim to max length
        if (logs.length > this.MAX_LOGS) {
            logs.length = this.MAX_LOGS;
        }

        try {
            localStorage.setItem(this.KEYS.LOGS, JSON.stringify(logs));
        } catch (e) {
            console.error('Error saving logs to storage', e);
        }
    },

    /**
     * Clear all logs
     */
    clearLogs() {
        localStorage.removeItem(this.KEYS.LOGS);
    },

    /**
     * Get manual registers
     * @returns {Array} Array of register objects
     */
    getRegistros() {
        try {
            const data = localStorage.getItem(this.KEYS.REGISTROS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading registros from storage', e);
            return [];
        }
    },

    /**
     * Save a new manual register
     * @param {Object} data - { graph, title }
     */
    saveRegistro(data) {
        const registros = this.getRegistros();
        const newReg = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            graph: data.graph,
            title: data.title,
            addedAt: new Date().toISOString()
        };
        registros.push(newReg);
        try {
            localStorage.setItem(this.KEYS.REGISTROS, JSON.stringify(registros));
        } catch (e) {
            console.error('Error saving registros to storage', e);
        }
    },

    /**
     * Delete a manual register
     * @param {string} id - Register ID
     */
    deleteRegistro(id) {
        let registros = this.getRegistros();
        registros = registros.filter(r => r.id !== id);
        try {
            localStorage.setItem(this.KEYS.REGISTROS, JSON.stringify(registros));
        } catch (e) {
            console.error('Error saving registros after delete', e);
        }
    },

    /**
     * Get manual conversaciones
     * @returns {Array} Array of conversational register objects
     */
    getConversaciones() {
        try {
            const data = localStorage.getItem(this.KEYS.CONVERSACIONES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading conversaciones from storage', e);
            return [];
        }
    },

    /**
     * Save a new manual conversacion
     * @param {Object} data - { graph, title }
     */
    saveConversacion(data) {
        const conversaciones = this.getConversaciones();
        const newReg = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            graph: data.graph,
            title: data.title,
            addedAt: new Date().toISOString()
        };
        conversaciones.push(newReg);
        try {
            localStorage.setItem(this.KEYS.CONVERSACIONES, JSON.stringify(conversaciones));
        } catch (e) {
            console.error('Error saving conversaciones to storage', e);
        }
    },

    /**
     * Delete a manual conversacion
     * @param {string} id - Conversacion ID
     */
    deleteConversacion(id) {
        let conversaciones = this.getConversaciones();
        conversaciones = conversaciones.filter(r => r.id !== id);
        try {
            localStorage.setItem(this.KEYS.CONVERSACIONES, JSON.stringify(conversaciones));
        } catch (e) {
            console.error('Error saving conversaciones after delete', e);
        }
    },

    /**
     * Get all registered plugins
     * Each plugin: { id, name (page title), graphs: [graphName, ...], addedAt }
     * @returns {Array} Array of plugin objects
     */
    getPlugins() {
        try {
            const data = localStorage.getItem(this.KEYS.PLUGINS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading plugins from storage', e);
            return [];
        }
    },

    /**
     * Save a new plugin entry (unique by name)
     * @param {Object} data - { name, graphs: [graphName, ...] }
     */
    savePlugin(data) {
        const plugins = this.getPlugins();
        // Check if already exists by name
        const existing = plugins.find(p => p.name === data.name);
        if (existing) {
            // Merge graphs (add new ones without duplicates)
            const graphSet = new Set([...existing.graphs, ...data.graphs]);
            existing.graphs = Array.from(graphSet);
            existing.updatedAt = new Date().toISOString();
        } else {
            plugins.push({
                id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                name: data.name,
                graphs: data.graphs || [],
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        try {
            localStorage.setItem(this.KEYS.PLUGINS, JSON.stringify(plugins));
        } catch (e) {
            console.error('Error saving plugins to storage', e);
        }
    },

    /**
     * Update graphs list for a plugin
     * @param {string} name - Plugin page title
     * @param {string[]} graphs - Updated graphs array
     */
    updatePluginGraphs(name, graphs) {
        const plugins = this.getPlugins();
        const plugin = plugins.find(p => p.name === name);
        if (plugin) {
            plugin.graphs = graphs;
            plugin.updatedAt = new Date().toISOString();
            try {
                localStorage.setItem(this.KEYS.PLUGINS, JSON.stringify(plugins));
            } catch (e) {
                console.error('Error updating plugin graphs', e);
            }
        }
    },

    /**
     * Delete a plugin entry
     * @param {string} id - Plugin ID
     */
    deletePlugin(id) {
        let plugins = this.getPlugins();
        plugins = plugins.filter(p => p.id !== id);
        try {
            localStorage.setItem(this.KEYS.PLUGINS, JSON.stringify(plugins));
        } catch (e) {
            console.error('Error saving plugins after delete', e);
        }
    }
};

// Exported for use as module
