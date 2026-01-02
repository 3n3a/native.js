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

  onInit(urlPatternResult: URLPatternResult, state: object) {
    // Component initialized
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

