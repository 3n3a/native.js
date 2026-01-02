# Getting Started

## Installation

Include the Native.js bundle in your HTML:

```html
<script type="module" src="path/to/native.js"></script>
```

## Creating Your First Component

```typescript
import { NativeJsComponent } from './native.js';

class HomePage extends NativeJsComponent {
  static tagName = 'n-home';
  static templateId = 'tpl-home';

  onInit(urlPatternResult: URLPatternResult | null, state: object) {
    // Component connected to DOM
  }
}
```

## Setting Up Routes

```typescript
import { createNativeJs } from './native.js';

const app = createNativeJs(document.querySelector('#app'), [
  { pathname: '/', element: HomePage },
  { pathname: '/about', element: AboutPage }
]);

app.run();
```

## Template Definition

```html
<template id="tpl-home">
  <h1>Welcome</h1>
  <a n-href="/about">Go to About</a>
</template>
```

## Nested Components

Components can be nested inside other component templates:

```html
<template id="tpl-home">
  <h1>Welcome</h1>
  <n-footer></n-footer>
</template>
```

Register non-routed components:

```typescript
import { createNativeJsComponentRegistry } from './native.js';

const registry = createNativeJsComponentRegistry();
registry.registerComponentClass(FooterComponent);
```
