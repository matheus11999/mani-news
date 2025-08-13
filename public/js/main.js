// Main JavaScript for Mani News PWA
class ManiNews {
  constructor() {
    this.isOnline = navigator.onLine;
    this.deferredPrompt = null;
    this.swRegistration = null;
    
    this.init();
  }
  
  init() {
    this.registerServiceWorker();
    this.handleInstallPrompt();
    this.handleOfflineStatus();
    this.handleNotifications();
    this.setupLazyLoading();
    this.setupInfiniteScroll();
    this.setupSearch();
    this.setupTheme();
    this.setupSharing();
  }
  
  // Service Worker Registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = registration;
        
        console.log('SW registered:', registration);
        
        // Listen for SW updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
        
        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', event => {
          console.log('Message from SW:', event.data);
          
          if (event.data.type === 'NEWS_UPDATED') {
            this.showNewContentNotification();
          }
        });
        
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    }
  }
  
  // PWA Install Prompt
  handleInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });
    
    // Handle install button click
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.installApp();
      });
    }
    
    // Handle dismiss button click
    const dismissBtn = document.getElementById('dismissBtn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.hideInstallBanner();
      });
    }
    
    // Track app installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.hideInstallBanner();
      this.trackEvent('pwa_installed');
    });
  }
  
  showInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner && !localStorage.getItem('installBannerDismissed')) {
      banner.classList.remove('hidden');
    }
  }
  
  hideInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) {
      banner.classList.add('hidden');
      localStorage.setItem('installBannerDismissed', 'true');
    }
  }
  
  async installApp() {
    if (!this.deferredPrompt) return;
    
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log('Install prompt outcome:', outcome);
    this.trackEvent('pwa_install_prompt', { outcome });
    
    this.deferredPrompt = null;
  }
  
  // Offline/Online Status
  handleOfflineStatus() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showToast('Conexão restaurada!', 'success');
      this.syncOfflineActions();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showToast('Você está offline. Algumas funcionalidades podem estar limitadas.', 'warning');
    });
  }
  
  // Push Notifications
  async handleNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted' && this.swRegistration) {
        this.subscribeToPushNotifications();
      }
    }
  }
  
  async subscribeToPushNotifications() {
    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY_HERE')
      });
      
      // Send subscription to server
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
      
      console.log('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }
  
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  // Lazy Loading
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('loading-skeleton');
            observer.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  // Infinite Scroll
  setupInfiniteScroll() {
    let loading = false;
    let page = 1;
    
    const loadMore = async () => {
      if (loading) return;
      loading = true;
      
      try {
        const response = await fetch(`/api/posts?page=${page + 1}`);
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
          this.appendPosts(data.posts);
          page++;
        }
      } catch (error) {
        console.error('Failed to load more posts:', error);
      } finally {
        loading = false;
      }
    };
    
    const scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    
    const sentinel = document.querySelector('#scroll-sentinel');
    if (sentinel) {
      scrollObserver.observe(sentinel);
    }
  }
  
  appendPosts(posts) {
    const container = document.querySelector('#posts-container');
    if (!container) return;
    
    posts.forEach(post => {
      const postElement = this.createPostElement(post);
      container.appendChild(postElement);
    });
    
    // Re-setup lazy loading for new images
    this.setupLazyLoading();
  }
  
  createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'news-card';
    article.innerHTML = `
      <div class="relative">
        <img data-src="${post.featuredImage || '/images/placeholder.jpg'}" 
             alt="${post.title}" 
             class="w-full h-48 object-cover loading-skeleton">
        <div class="absolute top-3 left-3">
          <span class="category-badge" style="background-color: ${post.category.color}; color: white;">
            ${post.category.name}
          </span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-2">
          <a href="${post.url}" class="hover:text-primary-600 transition-colors">
            ${post.title}
          </a>
        </h3>
        <p class="text-gray-600 text-sm mb-3">
          ${post.excerpt}
        </p>
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>${post.author.name}</span>
          <time>${post.shortDate}</time>
        </div>
      </div>
    `;
    return article;
  }
  
  // Search Enhancement
  setupSearch() {
    const searchInputs = document.querySelectorAll('input[name="q"]');
    
    searchInputs.forEach(input => {
      let debounceTimer;
      
      input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.handleSearchSuggestions(e.target.value);
        }, 300);
      });
    });
  }
  
  async handleSearchSuggestions(query) {
    if (query.length < 2) return;
    
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      const suggestions = await response.json();
      
      this.showSearchSuggestions(suggestions);
    } catch (error) {
      console.error('Search suggestions failed:', error);
    }
  }
  
  showSearchSuggestions(suggestions) {
    // Implementation for showing search suggestions dropdown
    console.log('Search suggestions:', suggestions);
  }
  
  // Theme Management
  setupTheme() {
    const themeToggle = document.getElementById('darkModeToggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      });
    }
  }
  
  // Social Sharing
  setupSharing() {
    if (navigator.share) {
      document.querySelectorAll('[data-share]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          
          try {
            await navigator.share({
              title: document.title,
              text: document.querySelector('meta[name="description"]')?.content || '',
              url: window.location.href
            });
          } catch (error) {
            console.log('Sharing failed:', error);
          }
        });
      });
    }
  }
  
  // Utilities
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border-l-4 p-4 rounded shadow-lg z-50 ${
      type === 'success' ? 'border-green-500' : 
      type === 'warning' ? 'border-yellow-500' : 
      type === 'error' ? 'border-red-500' : 'border-blue-500'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center">
        <div class="flex-1">
          <p class="text-sm text-gray-800">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }
  
  showUpdateNotification() {
    this.showToast('Nova versão disponível! Atualize a página para obter as últimas funcionalidades.', 'info');
  }
  
  showNewContentNotification() {
    this.showToast('Novo conteúdo disponível!', 'success');
  }
  
  async syncOfflineActions() {
    // Sync any offline actions when connection is restored
    if ('serviceWorker' in navigator && this.swRegistration) {
      try {
        await this.swRegistration.sync.register('news-sync');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
  
  trackEvent(eventName, properties = {}) {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    console.log('Event tracked:', eventName, properties);
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new ManiNews();
});

// Global utilities
window.ManiNews = {
  // Reading progress indicator
  initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'fixed top-0 left-0 h-1 bg-primary-600 z-50 transition-all duration-300';
    progressBar.style.width = '0%';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    });
  },
  
  // Font size adjustment
  adjustFontSize(size) {
    const article = document.querySelector('.prose');
    if (article) {
      article.style.fontSize = size;
      localStorage.setItem('fontSize', size);
    }
  },
  
  // Print article
  printArticle() {
    window.print();
  }
};

// Initialize reading progress on article pages
if (document.querySelector('.prose')) {
  window.ManiNews.initReadingProgress();
}

// Load saved font size
const savedFontSize = localStorage.getItem('fontSize');
if (savedFontSize) {
  window.ManiNews.adjustFontSize(savedFontSize);
}