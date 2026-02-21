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
     * Render graph list
     * @param {HTMLElement} container - Container element
     * @param {Object} graphs - Graph configurations
     * @param {Set} selectedGraphs - Selected graph names
     */
    renderGraphList(container, graphs, selectedGraphs) {
        const graphEntries = Object.entries(graphs);

        if (graphEntries.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📊</div>
          <p>No hay grafos configurados</p>
          <p class="hint">Agrega un grafo para comenzar</p>
        </div>
      `;
            return;
        }

        // Using template literals but we will escape the dynamic user-input string `name` to prevent XSS
        container.innerHTML = graphEntries.map(([name, config]) => {
            const escapedName = this.escapeHTML(name);
            return `
      <div class="graph-item ${selectedGraphs.has(name) ? 'selected' : ''}" data-graph="${escapedName}">
        <input type="checkbox" class="checkbox" ${selectedGraphs.has(name) ? 'checked' : ''}>
        <span class="graph-name">${escapedName}</span>
        <span class="graph-status ${config.status === 'error' ? 'error' : ''}">${this.getStatusText(config.status)}</span>
        <button class="btn btn-ghost btn-remove" title="Eliminar grafo">✕</button>
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
    }
};

// Export for use in other modules
window.UI = UI;
