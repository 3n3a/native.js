# Form Components

Native.js provides pre-built form components for common patterns.

## Registration

```typescript
import { createNativeJsComponentRegistry, registerDefaultComponents } from 'native.js';

const registry = createNativeJsComponentRegistry();
registerDefaultComponents(registry);
```

## Fetch Form (`<n-fetch-form>`)

A form that fetches data based on inputs. Use for search, filters, queries.

### Usage

```html
<n-fetch-form n-action="/api/search" n-state-key="results">
    <input type="search" name="q" placeholder="Search...">
    <button type="submit">Search</button>
</n-fetch-form>
```

### Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `n-action` | URL to fetch from (required) | - |
| `n-state-key` | Key to store results in state | `data` |
| `n-target` | ID of element to receive `n-data-received` event | - |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `n-fetch-start` | - | Fetch started |
| `n-fetch-success` | `{ data, stateKey }` | Fetch succeeded |
| `n-fetch-error` | `{ error }` | Fetch failed |

### Receiving Results

Listen on target element:

```javascript
document.getElementById('results').addEventListener('n-data-received', (e) => {
    console.log(e.detail.data);
});
```

## Submit Form (`<n-submit-form>`)

A form that submits data. Use for contact forms, registration, data entry.

### Usage

```html
<n-submit-form 
    n-action="/api/contact" 
    n-success-message="Message sent!">
    <input type="text" name="name" required>
    <input type="email" name="email" required>
    <textarea name="message"></textarea>
    <button type="submit">Send</button>
</n-submit-form>
```

### Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `n-action` | URL to submit to (required) | - |
| `n-method` | HTTP method (POST, PUT, PATCH, DELETE) | `POST` |
| `n-reset` | Reset form after success | `true` |
| `n-success-message` | Message on success | `Submitted successfully!` |
| `n-error-message` | Message on error | Error from response |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `n-submit-start` | `{ data }` | Submit started |
| `n-submit-success` | `{ data }` | Submit succeeded |
| `n-submit-error` | `{ error }` | Submit failed |

### Styling

The components add CSS classes for styling:

```css
.n-form-message { /* message container */ }
.n-form-success { /* success state */ }
.n-form-error { /* error state */ }
```

