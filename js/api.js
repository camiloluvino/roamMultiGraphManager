/**
 * Roam Multi-Graph Manager - API Module
 * Wrapper for Roam Research API operations
 */

const RoamAPI = {
    /**
     * Initialize graph configuration object
     * @param {string} name - Graph name
     * @param {string} token - API token
     * @returns {Object} Graph connection config
     */
    initGraph(name, token) {
        return {
            name,
            token,
            baseUrl: `https://api.roamresearch.com/api/graph/${name}`
        };
    },

    /**
     * Execute a request to Roam API
     * @param {Object} graph - Graph config from initGraph
     * @param {string} endpoint - API endpoint (action)
     * @param {Object} payload - Request body
     * @returns {Promise<any>} API response data
     */
    async _request(graph, endpoint, payload) {
        try {
            const response = await fetch(`${graph.baseUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${graph.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const text = await response.text();

            if (!response.ok) {
                let errorMsg = `HTTP Error ${response.status}`;
                try {
                    const errorObj = JSON.parse(text);
                    if (errorObj.message) errorMsg = errorObj.message;
                } catch {
                    if (text) errorMsg = text;
                }
                throw new Error(errorMsg);
            }

            try {
                return JSON.parse(text);
            } catch {
                return text; // Some endpoints might return OK with no JSON
            }
        } catch (error) {
            throw new Error(`Error de conexión con ${graph.name}: ${error.message}`);
        }
    },

    /**
     * Test connection to a graph
     * @param {Object} graph - Graph config
     * @returns {Promise<boolean>} True if connected
     */
    async testConnection(graph) {
        try {
            // Un query pull simple para probar el token (ej. buscar el título de la página Home)
            const payload = {
                action: 'q',
                query: `[:find ?uid . :where [?e :node/title "roam/js"] [?e :block/uid ?uid]]`
            };
            await this._request(graph, 'read', payload);
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    },

    /**
     * Execute a Datomic Query
     * @param {Object} graph - Graph config
     * @param {string} query - Datalog query
     * @returns {Promise<any>} Query results
     */
    async q(graph, query) {
        return this._request(graph, 'read', { action: 'q', query });
    },

    /**
     * Execute a Pull query (get entity details)
     * @param {Object} graph - Graph config
     * @param {string} selector - Pull selector standard
     * @param {string} eid - Entity ID or lookup ref
     * @returns {Promise<Object>} Entity tree
     */
    async pull(graph, selector, eid) {
        return this._request(graph, 'read', { action: 'pull', selector, eid });
    },

    /**
     * Check if a page exists by exact title
     * @param {Object} graph - Graph config
     * @param {string} title - Page title
     * @returns {Promise<boolean>} True if exists
     */
    async pageExists(graph, title) {
        const query = `[:find ?uid . :where [?e :node/title "${title}"] [?e :block/uid ?uid]]`;
        const result = await this.q(graph, query);
        // q returns null when using '.', or [] when not using '.', if not found.
        return result !== null && result !== undefined && (!Array.isArray(result) || result.length > 0);
    },

    /**
     * Get a page uid by exact title
     * @param {Object} graph - Graph config
     * @param {string} title - Page title
     * @returns {Promise<Object|null>} Page object with uid or null
     */
    async getPageByTitle(graph, title) {
        const query = `[:find ?uid . :where [?e :node/title "${title}"] [?e :block/uid ?uid]]`;
        const uid = await this.q(graph, query);

        if (uid && (!Array.isArray(uid) || uid.length > 0)) {
            // Convert to string in case it's in an array format depending on roam return style
            const cleanUid = Array.isArray(uid) ? uid[0][0] : uid;
            return { ':block/uid': cleanUid, ':node/title': title };
        }
        return null;
    },

    /**
     * Generates a random Roam-like UID (9 chars, alphanumeric)
     * @returns {string} uid
     */
    generateUid() {
        return Math.random().toString(36).substring(2, 11);
    },

    /**
     * Create a new page with initial block content
     * @param {Object} graph - Graph config
     * @param {string} title - Page title
     * @param {string[]} contents - Array of strings, each is a block
     * @returns {Promise<any>} Response
     */
    async createPageWithContent(graph, title, contents = []) {
        const pageUid = this.generateUid();
        const txData = [];

        // 1. Create page
        txData.push({
            action: 'create-page',
            page: {
                title: title,
                uid: pageUid
            }
        });

        // 2. Add blocks if provided
        contents.forEach((text, index) => {
            const blockUid = this.generateUid();
            txData.push({
                action: 'create-block',
                location: {
                    'parent-uid': pageUid,
                    order: index
                },
                block: {
                    string: text,
                    uid: blockUid
                }
            });
        });

        return this._request(graph, 'write', { txData });
    },

    /**
     * Update an existing page title
     * @param {Object} graph - Graph config
     * @param {string} uid - Page UID
     * @param {string} newTitle - New title
     * @returns {Promise<any>} Response
     */
    async updatePage(graph, uid, newTitle) {
        const txData = [{
            action: 'update-page',
            page: {
                uid: uid,
                title: newTitle
            }
        }];
        return this._request(graph, 'write', { txData });
    },

    /**
     * Delete an existing page
     * @param {Object} graph - Graph config
     * @param {string} uid - Page UID
     * @returns {Promise<any>} Response
     */
    async deletePage(graph, uid) {
        const txData = [{
            action: 'delete-page',
            page: {
                uid: uid
            }
        }];
        return this._request(graph, 'write', { txData });
    }
};

// Export for use in other modules
window.RoamAPI = RoamAPI;
