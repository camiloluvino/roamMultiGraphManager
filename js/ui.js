/**
 * Roam Multi-Graph Manager - UI Module
 * Handles UI components and interactions
 */

const UI = {
    /**
     * Show a toast notification
     * @param {string} message - Notification message
     * @param {string} type - 'success' | 'error' | 'info'
     * @param {number} duration - Duration in ms
     */
    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span class="icon">${this.getIcon(type)}</span>
      <span class="message">${message}</span>
    `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Get icon for notification type
     * @param {string} type - Type of notification
     * @returns {string} Icon HTML
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };
        return icons[type] || icons.info;
    },

    /**
     * Show modal
     * @param {string} modalId - Modal element ID
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Hide modal
     * @param {string} modalId - Modal element ID
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Confirm action with modal
     * @param {string} title - Confirm title
     * @param {string} message - Confirm message
     * @returns {Promise<boolean>} User confirmation
     */
    confirm(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = modal.querySelector('.modal-title');
            const messageEl = modal.querySelector('.modal-message');
            const confirmBtn = modal.querySelector('.btn-confirm');
            const cancelBtn = modal.querySelector('.btn-cancel');

            titleEl.textContent = title;
            messageEl.textContent = message;

            const handleConfirm = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                this.hideModal('confirm-modal');
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            this.showModal('confirm-modal');
        });
    },

    /**
     * Render active graph list (sidebar)
     * @param {HTMLElement} container - Container element
     * @param {Set} selectedGraphs - Selected graph names
     * @param {Object} graphs - Graph configurations
     */
    renderActiveGraphsList(container, selectedGraphs, graphs) {
        if (selectedGraphs.size === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <p>Ningún grafo seleccionado</p>
          <p class="hint" style="font-size: 0.75rem;">Ve a Configuración para elegir</p>
        </div>
      `;
            return;
        }

        container.innerHTML = Array.from(selectedGraphs).map(name => {
            const config = graphs[name];
            if (!config) return '';
            const escapedName = this.escapeHTML(name);
            return `
      <div class="graph-item selected" data-graph="${escapedName}">
        <span class="graph-name">${escapedName}</span>
        <span class="graph-status ${config.status === 'error' ? 'error' : ''}">${this.getStatusText(config.status)}</span>
        <button class="btn btn-ghost btn-deselect" title="Quitar de selección" style="opacity: 0.6; font-size: 0.8em;">✕</button>
      </div>
    `}).join('');
    },

    /**
     * Render all configured graphs list (config tab)
     * @param {HTMLElement} container - Container element
     * @param {Object} graphs - Graph configurations
     * @param {Set} selectedGraphs - Selected graph names
     */
    renderAllGraphsList(container, graphs, selectedGraphs) {
        const graphEntries = Object.entries(graphs);

        if (graphEntries.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <p>No hay grafos configurados</p>
          <p class="hint">Agrega un grafo desde el formulario superior</p>
        </div>
      `;
            return;
        }

        // Using template literals to render
        container.innerHTML = graphEntries.map(([name, config]) => {
            const escapedName = this.escapeHTML(name);
            return `
      <div class="graph-item ${selectedGraphs.has(name) ? 'selected' : ''}" data-graph="${escapedName}">
        <input type="checkbox" class="checkbox" ${selectedGraphs.has(name) ? 'checked' : ''}>
        <span class="graph-name">${escapedName}</span>
        <span class="graph-status ${config.status === 'error' ? 'error' : ''}">${this.getStatusText(config.status)}</span>
        <button class="btn btn-ghost btn-remove" title="Eliminar configuración del grafo" style="opacity: 0.6;">🗑️</button>
      </div>
    `}).join('');
    },

    /**
     * Toggles the visual selected state of a graph item DOM element
     * @param {HTMLElement} element - The graph item container
     * @param {boolean} isSelected - Whether it should be marked as selected
     */
    toggleGraphItemSelection(element, isSelected) {
        if (isSelected) {
            element.classList.add('selected');
        } else {
            element.classList.remove('selected');
        }
    },

    /**
     * Prevents XSS by escaping HTML reserved characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Get status text
     * @param {string} status - Status code
     * @returns {string} Status text
     */
    getStatusText(status) {
        const texts = {
            'connected': '✓',
            'error': '✕',
            'pending': '...'
        };
        return texts[status] || '?';
    },

    /**
     * Render operation preview
     * @param {HTMLElement} container - Preview container
     * @param {string} operation - Operation type
     * @param {Object} data - Operation data
     * @param {string[]} targetGraphs - Target graph names
     */
    renderPreview(container, operation, data, targetGraphs) {
        if (targetGraphs.length === 0) {
            container.innerHTML = '<p class="hint">Selecciona al menos un grafo</p>';
            return;
        }

        const opText = {
            'create': 'Crear página',
            'update': 'Modificar página',
            'delete': 'Eliminar página',
            'sync': 'Sincronizar página'
        };

        const title = this.escapeHTML(data.title || data.pageTitle || 'N/A');

        container.innerHTML = `
      <h3>📋 Preview</h3>
      <p><strong>Operación:</strong> ${opText[operation] || operation}</p>
      <p><strong>Página:</strong> ${title}</p>
      ${data.content ? `<p><strong>Contenido:</strong> ${data.content.length} líneas</p>` : ''}
      <div class="preview-graphs">
        <strong>Grafos destino:</strong>
        ${targetGraphs.map(g => `<span class="preview-item"><span class="graph-name">${this.escapeHTML(g)}</span></span>`).join('')}
      </div>
    `;
    },

    /**
     * Format timestamp
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted time
     */
    renderLogs(container, logs) {
        if (logs.length === 0) {
            container.innerHTML = '<p class="hint">No hay operaciones registradas</p>';
            return;
        }

        container.innerHTML = logs.slice(0, 20).map(log => `
      <div class="log-item ${log.type}">
        <span class="timestamp">${this.formatTime(log.timestamp)}</span>
        <span class="message">${this.escapeHTML(log.message)}</span>
      </div>
    `).join('');
    },

    /**
     * Format timestamp
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted time
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    },

    /**
     * Set loading state on button
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Loading state
     */
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="spinner"></span> Procesando...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    },

    /**
     * Show results modal
     * @param {Array} results - Operation results
     */
    showResults(results) {
        const modal = document.getElementById('results-modal');
        const content = modal.querySelector('.results-content');

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        content.innerHTML = `
      <div class="results-summary">
        <span class="badge badge-success">${successCount} exitosos</span>
        <span class="badge badge-error">${errorCount} errores</span>
      </div>
      <div class="results-list">
        ${results.map(r => `
          <div class="result-item ${r.success ? 'success' : 'error'}">
            <span class="graph-name">${this.escapeHTML(r.graph)}</span>
            <span class="result-message">${this.escapeHTML(r.message)}</span>
          </div>
        `).join('')}
      </div>
    `;

        this.showModal('results-modal');
    },

    /**
     * Render dashboard activity feed
     * @param {HTMLElement} container - Dashboard content container
     * @param {Array} graphData - Array of objects { graphName, items, error }
     * @param {string} viewMode - 'accordion', 'columns', or 'list'
     */
    renderDashboardActivity(container, graphData, viewMode = 'columns') {
        if (!graphData || graphData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No se encontraron grafos seleccionados.</p>
                </div>
            `;
            return;
        }

        switch (viewMode) {
            case 'columns':
                container.innerHTML = this._renderColumnsView(graphData);
                break;
            case 'accordion':
            default:
                container.innerHTML = this._renderAccordionView(graphData);
                break;
        }
    },

    /**
     * Helper to render accordion view
     */
    _renderAccordionView(graphData) {
        const graphHTML = graphData.map(({ graphName, items, error }) => {
            if (error) {
                return `
                <div class="accordion-item graph-level">
                    <div class="accordion-header">
                        <div class="accordion-header-left">
                            <span class="accordion-header-title" style="color: var(--error-color);">Grafo: ${this.escapeHTML(graphName)}</span>
                        </div>
                        <div class="accordion-header-right">
                            <span class="badge badge-error">Error</span>
                            <span class="accordion-chevron">▼</span>
                        </div>
                    </div>
                    <div class="accordion-content">
                        <div class="empty-state" style="padding: 1rem;">
                            <p style="color: var(--error-color); font-size: 0.9em;">No se pudo cargar la información: <br/>${this.escapeHTML(error)}</p>
                        </div>
                    </div>
                </div>
                `;
            }

            if (!items || items.length === 0) {
                return `
                <div class="accordion-item graph-level">
                    <div class="accordion-header">
                        <div class="accordion-header-left">
                            <span class="accordion-header-title">Grafo: ${this.escapeHTML(graphName)}</span>
                        </div>
                        <div class="accordion-header-right">
                            <span class="badge" style="background: var(--bg-hover); color: var(--text-muted);">0 acciones</span>
                            <span class="accordion-chevron">▼</span>
                        </div>
                    </div>
                    <div class="accordion-content">
                        <div class="empty-state" style="padding: 1rem;">
                            <p style="font-size: 0.9em; color: var(--text-muted);">No hay actividad reciente que coincida con los filtros.</p>
                        </div>
                    </div>
                </div>
                `;
            }

            // 2. Para cada grafo, agrupar por Página
            const groupedByPage = items.reduce((acc, item) => {
                const pageTitle = item.type === 'create' ? item.title : item.pageTitle;
                const key = pageTitle || 'Sin Título';
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            // Generar HTML de las páginas
            const pageHTML = Object.entries(groupedByPage).map(([pageTitle, pageItems]) => {
                // Generar HTML de los bloques (eventos individuales)
                const blocksHTML = pageItems.map(item => {
                    const isCreate = item.type === 'create';
                    const timeStr = new Date(item.time).toLocaleTimeString('es', {
                        hour: '2-digit', minute: '2-digit'
                    });
                    const icon = isCreate ? '+' : '~';
                    const content = isCreate ? 'Página creada' : (item.content || 'Bloque modificado');

                    return `
                        <div class="activity-block-item">
                            <div class="block-time">${timeStr}</div>
                            <div class="block-action-icon" title="${isCreate ? 'Creación' : 'Modificación'}">${icon}</div>
                            <div class="block-content" title="${this.escapeHTML(content)}">${this.escapeHTML(content)}</div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="accordion-item page-level">
                        <div class="accordion-header">
                            <div class="accordion-header-left">
                                <span class="accordion-header-title">${this.escapeHTML(pageTitle)}</span>
                            </div>
                            <div class="accordion-header-right">
                                <span class="badge badge-pending">${pageItems.length} acc${pageItems.length !== 1 ? 'iones' : 'ión'}</span>
                                <span class="accordion-chevron">▼</span>
                            </div>
                        </div>
                        <div class="accordion-content">
                            ${blocksHTML}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="accordion-item graph-level">
                    <div class="accordion-header">
                        <div class="accordion-header-left">
                            <span class="accordion-header-title">Grafo: ${this.escapeHTML(graphName)}</span>
                        </div>
                        <div class="accordion-header-right">
                            <span class="badge badge-success">${items.length} acc${items.length !== 1 ? 'iones' : 'ión'}</span>
                            <span class="accordion-chevron">▼</span>
                        </div>
                    </div>
                    <div class="accordion-content">
                        ${pageHTML}
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="activity-accordion">${graphHTML}</div>`;
    },

    /**
     * Helper to render columns view
     */
    _renderColumnsView(graphData) {
        // Flatten the data for table view
        let allItems = [];

        graphData.forEach(({ graphName, items, error }) => {
            if (error) {
                allItems.push({ type: 'error', time: Date.now(), graph: graphName, content: error });
            } else if (items) {
                allItems = allItems.concat(items.map(i => ({ ...i, graph: graphName })));
            }
        });

        if (allItems.length === 0) {
            return `
                <div class="empty-state">
                    <p>No se encontró actividad reciente en los grafos seleccionados.</p>
                </div>
            `;
        }

        allItems.sort((a, b) => b.time - a.time);

        const listHTML = allItems.map(item => {
            if (item.type === 'error') {
                return `
                    <div class="activity-item" style="border-left: 3px solid var(--error-color);">
                        <div><span class="badge" style="background: var(--bg-tertiary);">${this.escapeHTML(item.graph)}</span></div>
                        <div class="cell-content">
                            <span class="title-text" style="color: var(--error-color);">Error en ${this.escapeHTML(item.graph)}</span>
                            <span class="snippet-text">${this.escapeHTML(item.content)}</span>
                        </div>
                        <div><span class="badge badge-error">Error</span></div>
                        <div style="color: var(--text-muted); font-size: 0.8rem;">Ahora</div>
                        <div>-</div>
                    </div>
                `;
            }

            const isCreate = item.type === 'create';

            const actionText = isCreate ? 'Creación' : 'Modificación';
            const actionIcon = isCreate ? '+' : '~';

            const elementText = isCreate ? 'Página' : 'Bloque';
            const elementIcon = isCreate ? '📄' : '🧱';

            const title = isCreate ? item.title : item.pageTitle;
            const timeStr = new Date(item.time).toLocaleString('es', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
                <div class="activity-item">
                    <div>
                        <span class="badge" style="background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color);">${this.escapeHTML(item.graph)}</span>
                    </div>
                    <div class="cell-content">
                        <span class="title-text" title="${this.escapeHTML(title || 'Sin Título')}">
                            ${this.escapeHTML(title || 'Sin Título')}
                        </span>
                    </div>
                    <div>
                        <span title="${actionText}">${actionIcon} ${actionText}</span>
                    </div>
                    <div>
                        <span class="badge ${isCreate ? 'badge-success' : 'badge-pending'}">${elementText}</span>
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.8rem;">
                        ${timeStr}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="activity-table" style="overflow-x: auto;">
                <div class="activity-list-header">
                    <div>Grafo</div>
                    <div>Elemento afectado</div>
                    <div>Acción</div>
                    <div>Tipo</div>
                    <div>Fecha</div>
                </div>
                <div class="activity-table-body">
                    ${listHTML}
                </div>
            </div>
        `;
    }
};

// Exported for use as module

