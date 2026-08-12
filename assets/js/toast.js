// ============================================
// Toast Notification System for KITA-LOG
// FIXED: Container creation & vibrate permission
// ============================================

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        let container = document.querySelector('.toast-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        
        this.container = container;
    }

    show(message, type = 'success', duration = 3000) {
        if (!this.container) {
            this.init();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        if (type === 'info') icon = 'fa-info-circle';
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        this.container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, duration);
    }
    
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }
    
    error(message, duration = 4000) {
        this.show(message, 'error', duration);
    }
    
    warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    }
    
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

// Initialize global toast manager ONLY after DOM is ready
let toast = null;

document.addEventListener('DOMContentLoaded', function() {
    toast = new ToastManager();
    window.toast = toast;
});

// Also make available immediately with a fallback
if (!window.toast) {
    window.toast = {
        success: function(msg) { console.log('[Toast]', msg); alert(msg); },
        error: function(msg) { console.log('[Toast Error]', msg); alert(msg); },
        warning: function(msg) { console.log('[Toast Warning]', msg); },
        info: function(msg) { console.log('[Toast Info]', msg); }
    };
}