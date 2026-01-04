# Native.js

A lightweight frontend framework built entirely on native browser APIs with zero dependencies.

## Features

- **Web Components**: Built on Custom Elements v1 API
- **Zero Dependencies**: No external libraries required
- **TypeScript First**: Full type safety
- **Lightweight**: Minimal bundle size

## Quick Start

```html
<script type="module">
import { createNativeJs, NativeJsComponent } from './native.js';

class MyApp extends NativeJsComponent {
  static tagName = 'n-app';
  static templateId = 'tpl-app';
}

const app = createNativeJs(document.querySelector('#app'), [
  { pathname: '/', element: MyApp }
]);

app.run();
</script>
```

## Documentation

- [Getting Started](./getting-started.md)
- [Components](./components/overview.md)
- [Form Components](./components/forms.md)
- [State Management](./state/overview.md)
- [Data Fetching](./data/overview.md)
- [Dependency Injection](./di/overview.md)
- [Routing](./routing/overview.md)

