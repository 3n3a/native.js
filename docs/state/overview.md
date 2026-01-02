# State Management

Native.js provides two state management options with a unified API.

## Options

### Option 1: Attribute State (`n-state`)

For small, inline state stored directly in the element attribute.

```html
<n-counter n-state='{"count": 0}'></n-counter>
```

### Option 2: Storage State (`n-state-key`)

For persistent state backed by sessionStorage or localStorage.

```html
<!-- Session storage (default) -->
<n-counter n-state-key="my-counter"></n-counter>

<!-- Local storage (persists across sessions) -->
<n-counter n-state-key="my-counter" n-state-storage="local"></n-counter>
```

## Unified State API

Both options use the same API via `this.state`:

```typescript
class MyComponent extends NativeJsComponent {
  static tagName = 'n-my-component';
  static templateId = 'tpl-my-component';

  onInit() {
    // Get a value
    const count = this.state.get<number>('count');

    // Set a value
    this.state.set('count', 10);

    // Get all state
    const allState = this.state.getAll();

    // Set multiple values
    this.state.setAll({ count: 0, name: 'test' });

    // Replace entire state
    this.state.replace({ newKey: 'value' });

    // Check if key exists
    if (this.state.has('count')) { }

    // Remove a key
    this.state.remove('count');

    // Clear all state
    this.state.clear();

    // Get state mode ('attribute' or 'storage')
    const mode = this.state.getMode();

    // Get storage key (if using storage mode)
    const key = this.state.getStorageKey();
  }
}
```

## When to Use Each Option

| Option | Use Case |
|--------|----------|
| `n-state` | Small, non-sensitive state that doesn't need persistence |
| `n-state-key` + session | State that should persist during the browser session |
| `n-state-key` + local | State that should persist across browser sessions |

