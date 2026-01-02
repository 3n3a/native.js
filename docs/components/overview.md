# Components

Native.js components are built on the Web Components API (Custom Elements v1).

## Defining a Component

```typescript
class MyComponent extends NativeJsComponent {
  static tagName = 'n-my-component';
  static templateId = 'tpl-my-component';
  
  onInit(urlPatternResult: URLPatternResult, state: object) {
    // Called after the component is rendered
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
| `onInit(urlPatternResult, state)` | Called after render |
| `connectedCallback()` | Native: element added to DOM |
| `disconnectedCallback()` | Native: element removed from DOM |

## Querying Children

```typescript
// Single element
const btn = this.getChild('#my-button');

// Multiple elements
const items = this.getChildren('.list-item');
```

## Shadow DOM

Shadow DOM is disabled by default. Components render directly to the light DOM.

