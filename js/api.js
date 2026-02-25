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
            let response;

            if (endpoint === 'write') {
                // Route write operations through local proxy to avoid browser payload limits
                console.log(`[API] Usando proxy local para write en ${graph.name}`);
                response = await fetch('/api/proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: `${graph.baseUrl}/${endpoint}`,
                        token: graph.token,
                        payload: payload
                    })
                });
            } else {
                // Direct request for read operations (q, pull)
                response = await fetch(`${graph.baseUrl}/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'X-Authorization': `Bearer ${graph.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }

            const text = await response.text();

            if (!response.ok) {
                let errorMsg = `HTTP Error ${response.status}`;
                try {
                    const errorObj = JSON.parse(text);
                    if (errorObj.message) errorMsg = errorObj.message;
                    if (errorObj.error) errorMsg = errorObj.error;
                } catch {
                    if (text) errorMsg = text;
                }
                throw new Error(errorMsg);
            }

            try {
                const data = JSON.parse(text);
                // La API REST de Roam envuelve los resultados de 'q' y 'pull' en un objeto { result: [...] }
                return (data && data.result !== undefined) ? data.result : data;
            } catch {
                return text; // Some endpoints might return OK with no JSON
            }
        } catch (error) {
            let msg = error.message;
            if (msg.includes('Failed to fetch')) {
                msg += ' (Token de API inválido o nombre de grafo incorrecto)';
            }
            throw new Error(`Error de conexión con ${graph.name}: ${msg}`);
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
                query: `[:find ?uid . :where [?e :node/title "roam/js"] [?e :block/uid ?uid]]`
            };
            await this._request(graph, 'q', payload);
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
        return this._request(graph, 'q', { query });
    },

    /**
     * Execute a Pull query (get entity details)
     * @param {Object} graph - Graph config
     * @param {string} selector - Pull selector standard
     * @param {string} eid - Entity ID or lookup ref
     * @returns {Promise<Object>} Entity tree
     */
    async pull(graph, selector, eid) {
        return this._request(graph, 'pull', { selector, eid });
    },

    /**
     * Check if a page exists by exact title
     * @param {Object} graph - Graph config
     * @param {string} title - Page title
     * @returns {Promise<boolean>} True if exists
     */
    async pageExists(graph, title) {
        const safeTitle = title.replace(/"/g, '\\"');
        const query = `[:find ?uid . :where [?e :node/title "${safeTitle}"] [?e :block/uid ?uid]]`;
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
        const safeTitle = title.replace(/"/g, '\\"');
        const query = `[:find ?uid . :where [?e :node/title "${safeTitle}"] [?e :block/uid ?uid]]`;
        const uid = await this.q(graph, query);

        if (uid && (!Array.isArray(uid) || uid.length > 0)) {
            // Convert to string in case it's in an array format depending on roam return style
            const cleanUid = Array.isArray(uid) ? uid[0][0] : uid;
            return { ':block/uid': cleanUid, ':node/title': title };
        }
        return null;
    },

    /**
     * Get pages ending with a specific suffix
     * @param {Object} graph - Graph config
     * @param {string} suffix - Suffix to match 
     * @returns {Promise<string[]>} Array of page titles
     */
    async getPagesBySuffix(graph, suffix) {
        // Find all page titles, then filter in JS to avoid Datalog Regex differences
        const query = `[:find ?title :where [?e :node/title ?title]]`;
        const result = await this.q(graph, query);

        if (!result || !Array.isArray(result)) return [];
        return result.map(row => row[0] || '').filter(title => typeof title === 'string' && title.endsWith(suffix));
    },

    /**
     * Generates a random Roam-like UID (9 chars, alphanumeric)
     * @returns {string} uid
     */
    generateUid() {
        return Math.random().toString(36).substring(2, 11);
    },

    /**
     * Get the last modification time of a page
     * @param {Object} graph - Graph config
     * @param {string} title - Page title
     * @returns {Promise<number|null>} Timestamp or null
     */
    async getPageEditTime(graph, title) {
        const safeTitle = title.replace(/"/g, '\\"');
        // Quering max edit time from blocks inside the page
        const queryBlocks = `[:find (max ?time) . :where [?p :node/title "${safeTitle}"] [?b :block/page ?p] [?b :edit/time ?time]]`;
        let maxTime = await this.q(graph, queryBlocks);

        // If not found or empty page, try to get page node's own edit time
        if (!maxTime || (Array.isArray(maxTime) && maxTime.length === 0)) {
            const queryPage = `[:find (max ?time) . :where [?p :node/title "${safeTitle}"] [?p :edit/time ?time]]`;
            maxTime = await this.q(graph, queryPage);
        }

        // Clean up array format if returned
        if (Array.isArray(maxTime)) {
            return maxTime.length > 0 ? maxTime[0] : null;
        }
        return maxTime || null;
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

        return this._request(graph, 'write', {
            action: 'batch-actions',
            actions: txData
        });
    },

    /**
     * Update an existing page title
     * @param {Object} graph - Graph config
     * @param {string} uid - Page UID
     * @param {string} newTitle - New title
     * @returns {Promise<any>} Response
     */
    async updatePage(graph, uid, newTitle) {
        return this._request(graph, 'write', {
            action: 'update-page',
            page: {
                uid: uid,
                title: newTitle
            }
        });
    },

    /**
     * Delete an existing page
     * @param {Object} graph - Graph config
     * @param {string} uid - Page UID
     * @returns {Promise<any>} Response
     */
    async deletePage(graph, uid) {
        return this._request(graph, 'write', {
            action: 'delete-page',
            page: {
                uid: uid
            }
        });
    },

    /**
     * Get pages whose title starts with a given prefix
     * @param {Object} graph - Graph config
     * @param {string} prefix - Prefix to match (e.g. "roam/js/")
     * @returns {Promise<string[]>} Array of page titles
     */
    async getPagesByPrefix(graph, prefix) {
        const query = `[:find ?title :where [?e :node/title ?title]]`;
        const result = await this.q(graph, query);
        if (!result || !Array.isArray(result)) return [];
        return result.map(row => row[0] || '').filter(title => typeof title === 'string' && title.startsWith(prefix));
    },

    /**
     * Get direct children blocks of a page by its UID
     * @param {Object} graph - Graph config
     * @param {string} pageUid - Page UID
     * @returns {Promise<Array>} Array of { uid, string, order } objects
     */
    async getPageChildren(graph, pageUid) {
        const result = await this.pull(graph, '[{:block/children [:block/uid :block/string :block/order {:block/children ...}]}]', `[:block/uid "${pageUid}"]`);
        if (!result || !result[':block/children']) return [];
        return result[':block/children'].map(child => ({
            uid: child[':block/uid'],
            string: child[':block/string'] || '',
            order: child[':block/order'] || 0,
            children: child[':block/children'] || []
        }));
    },

    /**
     * Delete a block by UID
     * @param {Object} graph - Graph config
     * @param {string} uid - Block UID
     * @returns {Promise<any>} Response
     */
    async deleteBlock(graph, uid) {
        return this._request(graph, 'write', {
            action: 'delete-block',
            block: { uid }
        });
    },

    /**
     * Sync a roam/js plugin page: delete all existing children and create new structure
     * Structure: parent block "{{[[roam/js]]}}" → child block with code fence
     * @param {Object} graph - Graph config
     * @param {string} title - Page title (e.g. "roam/js/myPlugin")
     * @param {string} code - The JavaScript code to write
     * @param {boolean} createIfMissing - Create page if it doesn't exist
     * @returns {Promise<Object>} Result with status
     */
    async syncPluginPage(graph, title, code, createIfMissing = false) {
        console.log(`[syncPlugin] Inicio sync "${title}" en ${graph.name}, createIfMissing=${createIfMissing}`);

        // 1. Find page
        console.log(`[syncPlugin] Paso 1: Buscando página "${title}"...`);
        const page = await this.getPageByTitle(graph, title);
        console.log(`[syncPlugin] Paso 1 OK: página ${page ? 'encontrada (uid=' + page[':block/uid'] + ')' : 'NO encontrada'}`);

        if (!page && !createIfMissing) {
            return { success: false, message: 'Página no encontrada (createIfMissing=false)' };
        }

        let pageUid;

        if (!page) {
            // Create the page first
            console.log(`[syncPlugin] Paso 2: Creando página nueva...`);
            pageUid = this.generateUid();
            await this._request(graph, 'write', {
                action: 'batch-actions',
                actions: [{
                    action: 'create-page',
                    page: { title, uid: pageUid }
                }]
            });
            console.log(`[syncPlugin] Paso 2 OK: página creada con uid=${pageUid}`);
        } else {
            pageUid = page[':block/uid'];

            // 2. Get existing children and delete them all
            console.log(`[syncPlugin] Paso 2: Obteniendo hijos de la página...`);
            const children = await this.getPageChildren(graph, pageUid);
            console.log(`[syncPlugin] Paso 2 OK: ${children.length} hijos encontrados`);
            if (children.length > 0) {
                console.log(`[syncPlugin] Paso 2b: Eliminando ${children.length} hijos...`);
                const deleteActions = children.map(child => ({
                    action: 'delete-block',
                    block: { uid: child.uid }
                }));
                await this._request(graph, 'write', {
                    action: 'batch-actions',
                    actions: deleteActions
                });
                console.log(`[syncPlugin] Paso 2b OK: hijos eliminados`);
            }
        }

        // 3. Create new structure: parent block + code child
        console.log(`[syncPlugin] Paso 3: Creando estructura nueva...`);
        const parentBlockUid = this.generateUid();
        const childBlockUid = this.generateUid();
        const codeContent = '```javascript\n' + code + '\n```';

        await this._request(graph, 'write', {
            action: 'batch-actions',
            actions: [
                {
                    action: 'create-block',
                    location: { 'parent-uid': pageUid, order: 0 },
                    block: { string: '{{[[roam/js]]}}', uid: parentBlockUid }
                },
                {
                    action: 'create-block',
                    location: { 'parent-uid': parentBlockUid, order: 0 },
                    block: { string: codeContent, uid: childBlockUid }
                }
            ]
        });
        console.log(`[syncPlugin] Paso 3 OK: estructura creada`);

        return { success: true, message: page ? 'Plugin sincronizado' : 'Plugin creado y sincronizado' };
    },

    /**
     * Get recently created pages
     * @param {Object} graph - Graph config
     * @param {number} limit - Max results
     * @param {number} since - Unix timestamp min
     * @param {number} until - Unix timestamp max
     * @returns {Promise<Array>} List of pages with creation time
     */
    async getRecentPages(graph, limit = 10, since = 0, until = Infinity) {
        let constraints = '';
        if (since > 0) constraints += `[(>= ?time ${since})] `;
        if (until !== Infinity) constraints += `[(< ?time ${until})] `;

        // For performance, cap unbounded queries to last 30 days
        if (since === 0 && until === Infinity) {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            constraints += `[(>= ?time ${thirtyDaysAgo})] `;
        }

        // Find pages, their title, uid, and creation time
        const query = `[:find ?title ?uid ?time
                       :where 
                       [?p :node/title ?title]
                       [?p :block/uid ?uid]
                       [?p :create/time ?time]
                       ${constraints}]`;
        const result = await this.q(graph, query);

        if (!result || !Array.isArray(result)) return [];

        // Map, sort descending by time, and slice
        return result
            .map(([title, uid, time]) => ({ type: 'create', title, uid, time, graph: graph.name }))
            .sort((a, b) => b.time - a.time)
            .slice(0, limit);
    },

    /**
     * Get recently edited blocks with their page titles
     * @param {Object} graph - Graph config
     * @param {number} limit - Max results
     * @param {number} since - Unix timestamp min
     * @param {number} until - Unix timestamp max
     * @returns {Promise<Array>} List of edits with page context
     */
    async getRecentEdits(graph, limit = 15, since = 0, until = Infinity) {
        let constraints = '';
        if (since > 0) constraints += `[(>= ?time ${since})] `;
        if (until !== Infinity) constraints += `[(< ?time ${until})] `;

        // For performance, cap unbounded queries to last 30 days
        if (since === 0 && until === Infinity) {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            constraints += `[(>= ?time ${thirtyDaysAgo})] `;
        }

        // Query only pages and their edit times to make it lighter
        const query = `[:find ?title ?uid ?time
                       :where 
                       [?p :node/title ?title]
                       [?p :block/uid ?uid]
                       [?p :edit/time ?time]
                       ${constraints}]`;

        const result = await this.q(graph, query);

        if (!result || !Array.isArray(result)) return [];

        // Map, sort descending by time, and slice
        return result
            .map(([title, uid, time]) => ({
                type: 'edit',
                pageTitle: title,
                pageUid: uid,
                time,
                content: 'Página modificada',
                graph: graph.name
            }))
            .sort((a, b) => b.time - a.time)
            .slice(0, limit);
    }
};

// Exported for use as module
