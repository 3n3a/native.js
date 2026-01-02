# Data Fetching & Submission

Native.js provides a `NativeJsDataService` for fetching and submitting data, integrated with component state.

## Data Service (`this.data`)

Every component has access to a data service via `this.data`:

```typescript
class MyComponent extends NativeJsComponent {
  async onInit() {
    // GET request
    const users = await this.data.fetch('/api/users');
    
    // POST request
    const created = await this.data.post('/api/users', { name: 'John' });
    
    // PUT request
    const updated = await this.data.put('/api/users/1', { name: 'Jane' });
    
    // DELETE request
    const deleted = await this.data.delete('/api/users/1');
  }
}
```

## Fetching Data (GET)

### Auto-Fetch (via attributes)

Automatically fetch data when a component mounts:

```html
<n-user-list n-fetch="/api/users" n-fetch-key="users"></n-user-list>
```

The component receives loading states and the data:
- `this.state.get('usersLoading')` - true while fetching
- `this.state.get('usersError')` - error message if failed
- `this.state.get('users')` - the fetched data

Override `onDataFetched` to handle the result:

```typescript
onDataFetched(stateKey: string, data: unknown, error: string | null) {
  // Called after auto-fetch completes
  this.updateDisplay();
}
```

### Manual Fetch

```typescript
// Fetch and store in state
const response = await this.data.fetch('/api/users', { stateKey: 'users' });

// Fetch without storing
const response = await this.data.fetch('/api/data');
if (response.ok) {
  console.log(response.data);
}
```

### Fetch Options

```typescript
await this.data.fetch('/api/resource', {
  stateKey: 'data',         // Store result in state under this key
  headers: { 'X-Custom': 'value' },
  timeout: 5000,            // Request timeout in ms
  credentials: 'include'    // Cookie handling: 'omit', 'same-origin', 'include'
});
```

## Response Format

All data methods return a unified response:

```typescript
interface NativeJsDataResponse<T> {
  ok: boolean;        // true if request succeeded (2xx status)
  status: number;     // HTTP status code
  data: T | null;     // Response data (null on error)
  error: string | null; // Error message from response or HTTP status
}
```

## Submitting Data (POST/PUT/PATCH)

### POST Request

```typescript
const response = await this.data.post('/api/users', {
  name: 'John',
  email: 'john@example.com'
});

if (response.ok) {
  console.log('Created:', response.data);
} else {
  console.error('Failed:', response.error);
}
```

### PUT Request

```typescript
const response = await this.data.put('/api/users/1', {
  name: 'Updated Name'
});
```

### PATCH Request

```typescript
const response = await this.data.patch('/api/users/1', {
  email: 'new@example.com'
});
```

### Generic Submit

Use `submit()` when you need to specify the method:

```typescript
await this.data.submit('/api/resource', data, {
  method: 'PUT',            // POST, PUT, PATCH, DELETE (default: POST)
  headers: { 'X-Custom': 'value' },
  timeout: 5000,
  credentials: 'include'
});
```

## Deleting Data (DELETE)

```typescript
const response = await this.data.delete('/api/users/1');

if (response.ok) {
  console.log('Deleted successfully');
}
```

DELETE requests don't require a body.

## Credentials / Cookies

By default, credentials mode is `'same-origin'`. To send cookies cross-origin:

```typescript
// Component method
await this.data.fetch('/api/auth', { credentials: 'include' });

// Standalone service with default credentials
const dataService = createNativeJsDataService({
  baseUrl: 'https://api.example.com',
  credentials: 'include'
});
```

## Standalone Service

Use `NativeJsDataService` outside components:

```typescript
import { createNativeJsDataService } from 'native.js';

const dataService = createNativeJsDataService({
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  credentials: 'include'
});

const response = await dataService.fetch('/users');
await dataService.post('/users', { name: 'John' });
await dataService.delete('/users/1');
```

## Multiple Data Sources

Fetch from multiple sources and store under different state keys:

```typescript
async onInit() {
  // Fetch users and posts in parallel
  await Promise.all([
    this.data.fetch('/api/users', { stateKey: 'users' }),
    this.data.fetch('/api/posts', { stateKey: 'posts' })
  ]);
  
  // Access both
  const users = this.state.get('users');
  const posts = this.state.get('posts');
}
```
