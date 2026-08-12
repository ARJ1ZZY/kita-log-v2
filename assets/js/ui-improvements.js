// ============================================
// UI Improvements for KITA-LOG
// FIXED: Vibrate permission check
// ============================================

// Safe haptic feedback (only works after user interaction)
function safeVibrate(duration = 15) {
    // Check if vibrate is available AND we're in a secure context
    if (window.navigator && window.navigator.vibrate) {
        try {
            // Only vibrate if user has interacted with the page
            // This prevents the console warning
            if (document.hasFocus() && document.body.contains(document.activeElement)) {
                window.navigator.vibrate(duration);
            }
        } catch(e) {
            // Silent fail
        }
    }
}

// ===== 1. Pull-to-Refresh =====
function initPullToRefresh(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let startY = 0;
    let isRefreshing = false;
    
    element.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
        if (isRefreshing) return;
        
        const pullDistance = e.touches[0].clientY - startY;
        const isTransactionPage = window.location.pathname.includes('transactions.php');
        
        if (pullDistance > 80 && window.scrollY === 0 && isTransactionPage) {
            isRefreshing = true;
            
            if (window.toast) {
                window.toast.info('Refreshing...', 1000);
            }
            
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    }, { passive: true });
}

// ===== 2. Scroll Position Memory =====
function initScrollMemory() {
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('scrollPos', window.scrollY);
    });
    
    window.addEventListener('load', () => {
        const savedPos = sessionStorage.getItem('scrollPos');
        if (savedPos) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedPos));
            }, 100);
        }
    });
}

// ===== 3. Ripple Effect (with safe vibrate) =====
function initRippleEffect() {
    document.querySelectorAll('.app-btn, .btn-primary, .fab, .quick-btn, .nav-item').forEach((btn) => {
        btn.addEventListener('click', function(e) {
            // Safe haptic feedback
            safeVibrate(10);
            
            // Ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(102, 153, 204, 0.3)';
            ripple.style.pointerEvents = 'none';
            ripple.style.animation = 'ripple 0.5s linear';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => { ripple.remove(); }, 500);
        });
    });
}

// ===== 4. Loading Skeletons =====
class LoadingSkeleton {
    static show(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card';
            skeleton.innerHTML = `
                <div class="skeleton-line" style="width: 70%"></div>
                <div class="skeleton-line short" style="width: 40%"></div>
            `;
            skeletons.push(skeleton);
            container.appendChild(skeleton);
        }
        return skeletons;
    }
    
    static hide(skeletons) {
        if (skeletons && skeletons.length) {
            skeletons.forEach(s => s.remove());
        }
    }
}

// ===== Initialize everything when DOM is ready =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize scroll memory
    initScrollMemory();
    
    // Initialize ripple effect
    initRippleEffect();
    
    // Initialize pull-to-refresh on transaction list
    initPullToRefresh('transactionsList');
    
    console.log('UI Improvements loaded successfully');
});

// Add ripple animation to CSS if not already present
if (!document.querySelector('#ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
        @keyframes ripple {
            0% { transform: scale(0); opacity: 0.5; }
            100% { transform: scale(4); opacity: 0; }
        }
        
        .skeleton-card {
            background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%);
            background-size: 200% 100%;
            animation: skeletonLoading 1.5s infinite;
            border-radius: var(--radius-lg);
            height: 80px;
            margin-bottom: 12px;
        }
        
        .skeleton-line {
            height: 12px;
            background: var(--border-color);
            border-radius: var(--radius-full);
            margin-bottom: 8px;
        }
        
        .skeleton-line.short {
            width: 60%;
        }
        
        @keyframes skeletonLoading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        .toast-container {
            position: fixed;
            bottom: 100px;
            left: 16px;
            right: 16px;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        }
        
        .toast-notification {
            background: var(--bg-card);
            border-left: 4px solid var(--success);
            border-radius: 12px;
            padding: 14px 16px;
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            backdrop-filter: blur(10px);
        }
        
        .toast-notification.toast-success { border-left-color: var(--success); }
        .toast-notification.toast-error { border-left-color: var(--danger); }
        .toast-notification.toast-warning { border-left-color: var(--warning); }
        .toast-notification.toast-info { border-left-color: var(--primary); }
        
        .toast-icon { font-size: 1.2rem; }
        .toast-success .toast-icon { color: var(--success); }
        .toast-error .toast-icon { color: var(--danger); }
        
        .toast-message {
            flex: 1;
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text-primary);
        }
    `;
    document.head.appendChild(style);
}