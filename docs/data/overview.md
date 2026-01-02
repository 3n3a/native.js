# Data Fetching & Submission

Native.js provides a `NativeJsDataService` for fetching and submitting data, integrated with component state.

## Data Service (`this.data`)

Every component has access to a data service via `this.data`:

```typescript
class MyComponent extends NativeJsComponent {
  async onInit() {
    // Fetch data
    const response = await this.data.fetch('/api/users');
    
    // Submit data
    const result = await this.data.submit('/api/form', { name: 'John' });
  }
}
```

## Fetching Data

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

### Fetch Response

```typescript
interface NativeJsDataResponse<T> {
  ok: boolean;        // true if request succeeded
  status: number;     // HTTP status code
  data: T | null;     // Response data (null on error)
  error: string | null; // Error message (null on success)
}
```

## Submitting Data

Submit data to an endpoint. Results are NOT stored in state.

```typescript
const response = await this.data.submit('/api/form', {
  name: 'John',
  email: 'john@example.com'
});

if (response.ok) {
  console.log('Submitted:', response.data);
} else {
  console.error('Failed:', response.error);
}
```

### Submit Options

```typescript
await this.data.submit('/api/resource', data, {
  method: 'PUT',      // POST, PUT, PATCH, DELETE (default: POST)
  headers: { 'X-Custom': 'value' },
  timeout: 5000       // Request timeout in ms
});
```

## Standalone Service

Use `NativeJsDataService` outside components:

```typescript
import { createNativeJsDataService } from 'native.js';

const dataService = createNativeJsDataService({
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
});

const response = await dataService.fetch('/users');
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

