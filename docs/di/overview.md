# Dependency Injection

Native.js includes a lightweight DI container for managing services and their dependencies.

## Core Concepts

### Container

The DI container manages service registration, resolution, and lifecycle.

```javascript
import { createNativeJs, NativeJsService } from 'native.js';

const app = createNativeJs(host, routes, { basePath: '' });

// Register services
app.singleton('auth', AuthService);
app.singleton('api', ApiService);

app.run();
```

### Service Lifecycles

- **Singleton**: One shared instance (default)
- **Transient**: New instance each resolution

```javascript
app.singleton('auth', AuthService);     // Shared instance
app.transient('logger', LoggerService); // New instance each time
```

### Registration Methods

```javascript
// Class-based (receives container in constructor)
app.singleton('auth', AuthService);

// Factory function
app.singleton('api', (container) => {
    const auth = container.resolve('auth');
    return new ApiService(auth);
});

// Pre-existing instance
app.instance('config', { apiUrl: '/api', debug: true });
```

## Creating Services

Extend `NativeJsService` for services that need dependencies:

```javascript
import { NativeJsService } from 'native.js';

class ApiService extends NativeJsService {
    constructor(container) {
        super(container);
        // Resolve dependencies
        this.auth = this.resolve('auth');
    }
    
    async fetchProtected(url) {
        const headers = {
            'Authorization': `Bearer ${this.auth.token}`
        };
        return fetch(url, { headers });
    }
}
```

## Injecting into Components

Components can declare dependencies via `static dependencies`:

```javascript
class DashboardPage extends NativeJsComponent {
    static tagName = 'n-dashboard';
    static templateId = 'dashboard';
    
    // Declare dependencies - auto-injected as properties
    static dependencies = ['auth', 'api'];
    
    onInit() {
        // this.auth and this.api are now available
        if (this.auth.isAuthenticated) {
            this.loadData();
        }
    }
    
    async loadData() {
        const data = await this.api.fetchProtected('/dashboard');
        // ...
    }
}
```

### Manual Resolution

```javascript
class MyComponent extends NativeJsComponent {
    onInit() {
        // Resolve manually
        const auth = this.inject('auth');
        
        // Or with fallback
        const logger = this.tryInject('logger'); // undefined if not registered
    }
}
```

## Global Access

Outside components, use these functions:

```javascript
import { getContainer, inject, tryGetContainer } from 'native.js';

// Get container
const container = getContainer();

// Resolve service
const auth = inject('auth');

// Check if container exists
const container = tryGetContainer(); // undefined before app.run()
```

## Container API

```javascript
const container = app.container;

// Check registration
container.has('auth');           // true/false

// Get all registered tokens
container.getTokens();           // ['auth', 'api', ...]

// Create child container (inherits parent registrations)
const child = container.createChild();

// Clear services
container.clear('auth');         // Remove specific
container.clearAll();            // Remove all
```

## Best Practices

1. **Register dependencies first**: If `ApiService` depends on `AuthService`, register `AuthService` first
2. **Use singleton for stateful services**: Auth, caching, etc.
3. **Use transient for stateless utilities**: Formatters, validators
4. **Avoid circular dependencies**: The container will throw an error if detected

