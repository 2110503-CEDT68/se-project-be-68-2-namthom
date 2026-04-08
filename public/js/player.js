// Video Player JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Add entrance animation
    const videoWrapper = document.querySelector('.video-wrapper');
    videoWrapper.style.opacity = '0';
    videoWrapper.style.transform = 'translateY(50px)';
    
    setTimeout(() => {
        videoWrapper.style.transition = 'all 0.8s ease';
        videoWrapper.style.opacity = '1';
        videoWrapper.style.transform = 'translateY(0)';
    }, 100);

    // Animate fact cards on scroll
    setupScrollAnimations();
    
    // Randomly animate stars
    createTwinklingStars();
});

// Toggle Full Screen
function toggleFullScreen() {
    const iframe = document.getElementById('main-video');
    
    if (!document.fullscreenElement) {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
            iframe.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Reload Video
function reloadVideo() {
    const iframe = document.getElementById('main-video');
    const currentSrc = iframe.src;
    
    // Add a reload animation
    iframe.style.opacity = '0';
    iframe.style.transition = 'opacity 0.3s';
    
    setTimeout(() => {
        iframe.src = currentSrc;
        iframe.onload = () => {
            iframe.style.opacity = '1';
        };
    }, 300);
    
    showToast('Video reloaded!', 'success');
}

// Scroll Animations for Fact Cards
function setupScrollAnimations() {
    const factCards = document.querySelectorAll('.fact-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });
    
    factCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

// Create Twinkling Stars Background
function createTwinklingStars() {
    const container = document.createElement('div');
    container.className = 'dynamic-stars';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
    `;
    
    // Create 50 random stars
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = Math.random() * 2 + 2;
        
        star.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: white;
            border-radius: 50%;
            left: ${x}%;
            top: ${y}%;
            opacity: ${Math.random() * 0.5 + 0.2};
            animation: twinkleStar ${duration}s ease-in-out ${delay}s infinite;
        `;
        
        container.appendChild(star);
    }
    
    document.body.appendChild(container);
    
    // Add keyframe for twinkling
    const style = document.createElement('style');
    style.textContent = `
        @keyframes twinkleStar {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 10px white; }
        }
    `;
    document.head.appendChild(style);
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: rgba(15, 23, 42, 0.95);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border-left: 4px solid ${type === 'success' ? '#06b6d4' : '#ef4444'};
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 3000;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" 
           style="color: ${type === 'success' ? '#06b6d4' : '#ef4444'};"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(150%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // F for fullscreen
    if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
    }
    // R for reload
    if (e.key === 'r' || e.key === 'R') {
        reloadVideo();
    }
    // ESC to go back
    if (e.key === 'Escape') {
        window.location.href = 'index.html';
    }
});

// Easter Egg - Konami Code
let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiPattern.join(',')) {
        showToast('🚀 Launch sequence initiated! Enjoy your massage in space!', 'success');
        document.body.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    }
});

// Add shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

// Console Easter Egg
console.log('%c☁️ Cloud Spa', 'font-size: 30px; font-weight: bold; color: #06b6d4;');
console.log('%cRelaxation Beyond the Clouds 🚀', 'font-size: 14px; color: #f472b6;');
console.log('%cPress F for Fullscreen | R to Reload | ESC to Go Back', 'font-size: 12px; color: #94a3b8;');
