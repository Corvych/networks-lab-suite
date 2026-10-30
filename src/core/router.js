// Lightweight hash router
class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.params = {};
    
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  add(pattern, handler) {
    this.routes.push({ pattern, handler });
    return this;
  }

  navigate(hash) {
    if (!hash.startsWith('#')) hash = '#' + hash;
    window.location.hash = hash;
  }

  handleRoute() {
    const rawHash = window.location.hash.slice(1) || '/';
    const path = rawHash.split('?')[0];

    for (const route of this.routes) {
      const match = this.matchRoute(route.pattern, path);
      if (match) {
        this.currentRoute = route;
        this.params = match.params;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        route.handler(this.params);
        return;
      }
    }

    // Default fallback to root
    const fallback = this.routes.find(r => r.pattern === '/');
    if (fallback) {
      this.currentRoute = fallback;
      this.params = {};
      fallback.handler({});
    }
  }

  matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1);
        params[paramName] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return { params };
  }

  start() {
    this.handleRoute();
  }
}

export const router = new Router();
