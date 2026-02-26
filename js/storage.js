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
        PLUGINS: 'roam_mg_plugins',
        SELECTED_PLUGINS: 'roam_mg_selected_plugins'
    },

    MAX_LOGS: 100,

    // In-memory cache to avoid repeated JSON.parse on reads
    _memCache: {},

    /**
     * Read from localStorage with in-memory cache (avoids repeated JSON.parse)
     * @param {string} key - localStorage key
     * @param {*} fallback - Default value if key not found
     * @returns {*} Parsed value
     */
    _cachedRead(key, fallback) {
        if (this._memCache[key] !== undefined) {
            return this._memCache[key];
        }
        try {
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : fallback;
            this._memCache[key] = parsed;
            return parsed;
        } catch (e) {
            console.error(`Storage read error for ${key}:`, e);
            return fallback;
        }
    },

    /**
     * Write to localStorage and update in-memory cache
     * @param {string} key - localStorage key
     * @param {*} value - Value to store
     */
    _cachedWrite(key, value) {
        this._memCache[key] = value;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Storage write error for ${key}:`, e);
        }
    },

    /**
     * Get all configured graphs
     * @returns {Object} Graph configurations
     */
    getGraphs() {
        return this._cachedRead(this.KEYS.GRAPHS, {});
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
        this._cachedWrite(this.KEYS.GRAPHS, graphs);
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
     * Get selected plugins
     * @returns {string[]} Array of selected plugin names
     */
    getSelectedPlugins() {
        try {
            const data = localStorage.getItem(this.KEYS.SELECTED_PLUGINS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading selected plugins from storage', e);
            return [];
        }
    },

    /**
     * Save selected plugins
     * @param {string[]} selectedPlugins - Array of selected plugin names
     */
    saveSelectedPlugins(selectedPlugins) {
        try {
            localStorage.setItem(this.KEYS.SELECTED_PLUGINS, JSON.stringify(selectedPlugins));
        } catch (e) {
            console.error('Error saving selected plugins to storage', e);
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
        return this._cachedRead(this.KEYS.REGISTROS, []);
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
        this._cachedWrite(this.KEYS.REGISTROS, registros);
    },

    /**
     * Save multiple new manual registers
     * @param {Array} dataArray - Array of { graph, title }
     */
    saveRegistrosBulk(dataArray) {
        if (!dataArray || dataArray.length === 0) return;
        const registros = this.getRegistros();
        const now = new Date().toISOString();

        const newRegs = dataArray.map(data => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            graph: data.graph,
            title: data.title,
            addedAt: now
        }));

        registros.push(...newRegs);
        this._cachedWrite(this.KEYS.REGISTROS, registros);
    },

    /**
     * Delete a manual register
     * @param {string} id - Register ID
     */
    deleteRegistro(id) {
        let registros = this.getRegistros();
        registros = registros.filter(r => r.id !== id);
        this._cachedWrite(this.KEYS.REGISTROS, registros);
    },

    /**
     * Get manual conversaciones
     * @returns {Array} Array of conversational register objects
     */
    getConversaciones() {
        return this._cachedRead(this.KEYS.CONVERSACIONES, []);
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
        this._cachedWrite(this.KEYS.CONVERSACIONES, conversaciones);
    },

    /**
     * Save multiple new manual conversaciones
     * @param {Array} dataArray - Array of { graph, title }
     */
    saveConversacionesBulk(dataArray) {
        if (!dataArray || dataArray.length === 0) return;
        const conversaciones = this.getConversaciones();
        const now = new Date().toISOString();

        const newRegs = dataArray.map(data => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            graph: data.graph,
            title: data.title,
            addedAt: now
        }));

        conversaciones.push(...newRegs);
        this._cachedWrite(this.KEYS.CONVERSACIONES, conversaciones);
    },

    /**
     * Delete a manual conversacion
     * @param {string} id - Conversacion ID
     */
    deleteConversacion(id) {
        let conversaciones = this.getConversaciones();
        conversaciones = conversaciones.filter(r => r.id !== id);
        this._cachedWrite(this.KEYS.CONVERSACIONES, conversaciones);
    },

    /**
     * Get all registered plugins
     * Each plugin: { id, name (page title), graphs: [graphName, ...], addedAt }
     * @returns {Array} Array of plugin objects
     */
    getPlugins() {
        return this._cachedRead(this.KEYS.PLUGINS, []);
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
        this._cachedWrite(this.KEYS.PLUGINS, plugins);
    },

    /**
     * Save/update multiple plugins (bulk)
     * @param {Array} pluginDataArray - Array of { name, graphs: [graphName, ...] }
     */
    savePluginsBulk(pluginDataArray) {
        if (!pluginDataArray || pluginDataArray.length === 0) return;

        const plugins = this.getPlugins();
        let changed = false;
        const now = new Date().toISOString();

        for (const data of pluginDataArray) {
            const existing = plugins.find(p => p.name === data.name);
            if (existing) {
                // Merge graphs
                const graphSet = new Set([...existing.graphs, ...(data.graphs || [])]);
                if (existing.graphs.length !== graphSet.size) {
                    existing.graphs = Array.from(graphSet);
                    existing.updatedAt = now;
                    changed = true;
                }
            } else {
                plugins.push({
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                    name: data.name,
                    graphs: data.graphs || [],
                    addedAt: now,
                    updatedAt: now
                });
                changed = true;
            }
        }

        if (changed) {
            this._cachedWrite(this.KEYS.PLUGINS, plugins);
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
            this._cachedWrite(this.KEYS.PLUGINS, plugins);
        }
    },

    /**
     * Delete a plugin entry
     * @param {string} id - Plugin ID
     */
    deletePlugin(id) {
        let plugins = this.getPlugins();
        plugins = plugins.filter(p => p.id !== id);
        this._cachedWrite(this.KEYS.PLUGINS, plugins);
    }
};

// Exported for use as module
