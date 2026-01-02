# Components

Native.js components are built on the Web Components API (Custom Elements v1).

## Defining a Component

```typescript
class MyComponent extends NativeJsComponent {
  static tagName = 'n-my-component';
  static templateId = 'tpl-my-component';
  
  onInit(urlPatternResult: URLPatternResult | null, state: object) {
    // Called each time the component is inserted into the DOM
  }
}
```

## Required Static Properties

| Property | Description |
|----------|-------------|
| `tagName` | Custom element name (must start with `n-`) |
| `templateId` | ID of the `<template>` element to render |

## Lifecycle

| Method | Description |
|--------|-------------|
| `onInit(urlPatternResult, state)` | Called after component is connected to DOM |
| `connectedCallback()` | Native: element added to DOM (renders template, calls onInit) |
| `disconnectedCallback()` | Native: element removed from DOM |

## Using Components

### Via Routes

Components are automatically instantiated when their route matches:

```typescript
const routes = [
  { pathname: '/', element: HomePage },
  { pathname: '/users/:id', element: UserPage }
];
```

### Nested in Templates

Components can be used directly in other component templates:

```html
<template id="tpl-home">
  <h1>Home</h1>
  <n-footer></n-footer>
</template>
```

Non-routed components must be registered manually:

```typescript
const registry = createNativeJsComponentRegistry();
registry.registerComponentClass(FooterComponent);
```

## Querying Children

```typescript
// Single element
const btn = this.getChild('#my-button');

// Multiple elements
const items = this.getChildren('.list-item');
```

## State

Components have built-in state management. See [State Management](../state/overview.md).

```typescript
onInit() {
  const count = this.state.get<number>('count');
  this.state.set('count', count + 1);
}
```

## Data Fetching

Components have built-in data service. See [Data Fetching](../data/overview.md).

```typescript
async onInit() {
  // Fetch and store in state
  await this.data.fetch('/api/users', { stateKey: 'users' });
  
  // Submit data (not stored)
  await this.data.submit('/api/form', { name: 'John' });
}
```

## Shadow DOM

Shadow DOM is disabled by default. Components render directly to the light DOM.
