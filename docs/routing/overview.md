# Routing

Native.js includes a built-in router using the URLPattern API.

## Defining Routes

```typescript
const routes = [
  { pathname: '/', element: HomePage },
  { pathname: '/users/:id', element: UserPage },
  { pathname: '/posts/*', element: PostsPage }
];

const app = createNativeJs(container, routes);
app.run();
```

## Route Parameters

Access route parameters via `urlPatternResult`:

```typescript
class UserPage extends NativeJsComponent {
  static tagName = 'n-user';
  static templateId = 'tpl-user';
  
  onInit(urlPatternResult: URLPatternResult, state: object) {
    const userId = urlPatternResult.pathname.groups.id;
  }
}
```

## Navigation

Use the `n-href` attribute for SPA navigation:

```html
<a n-href="/about">About</a>
<a n-href="/users/123">User Profile</a>
```

## Programmatic Navigation

Navigation triggers the `n-url-change` custom event internally.

