# List Component

The `<n-list>` component renders dynamic lists with templating support.

## Registration

```typescript
import { createNativeJsComponentRegistry, registerDefaultComponents } from 'native.js';

const registry = createNativeJsComponentRegistry();
registerDefaultComponents(registry);
```

## Usage

```html
<n-list id="users-list" n-empty-text="No users found">
    <template n-item>
        <div class="user-item" data-id="{{id}}">
            <span class="name">{{name}}</span>
            <span class="email">{{email}}</span>
        </div>
    </template>
</n-list>
```

### Setting Items

```javascript
const list = document.querySelector('#users-list');

list.setItems([
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
]);
```

## Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `n-empty-text` | Text shown when list is empty | `No items` |

## Template Variables

Use `{{variableName}}` syntax in the template:

```html
<template n-item>
    <div class="item">
        <h3>{{title}}</h3>
        <p>{{description}}</p>
        <span>{{nested.property}}</span>
    </div>
</template>
```

- Supports dot notation for nested properties
- Works in text content and attributes
- Unmatched variables remain as-is

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `n-item-click` | `{ item, index, element, originalEvent }` | Item clicked |
| `n-list-updated` | `{ items }` | Items changed |

## Methods

| Method | Description |
|--------|-------------|
| `setItems(items)` | Replace all items |
| `addItem(item, position?)` | Add item (`'start'` or `'end'`) |
| `removeItem(index)` | Remove item by index |
| `removeItemWhere(predicate)` | Remove item matching predicate |
| `updateItem(index, item)` | Update item at index |
| `clear()` | Remove all items |
| `getItems()` | Get all items |
| `getItem(index)` | Get item by index |
| `length` | Get items count |

## Styling

| Class | Description |
|-------|-------------|
| `.n-list-container` | Items container |
| `.n-list-empty` | Empty state element |
| `.n-list-item` | Added to each rendered item |

```css
.n-list-empty {
    text-align: center;
    padding: 2rem;
    color: #999;
}

.n-list-item {
    border-bottom: 1px solid #eee;
}
```

## Example: Todo List

```html
<n-list id="todos" n-empty-text="No todos yet!">
    <template n-item>
        <div class="todo-item" data-id="{{id}}">
            <input type="checkbox" class="todo-check">
            <span class="todo-text">{{text}}</span>
            <button class="delete-btn" data-id="{{id}}">Delete</button>
        </div>
    </template>
</n-list>

<script>
const list = document.querySelector('#todos');

// Handle item clicks
list.addEventListener('n-item-click', (e) => {
    const { item, originalEvent } = e.detail;
    
    if (originalEvent.target.classList.contains('delete-btn')) {
        list.removeItemWhere(t => t.id === item.id);
    }
});

// Load items
list.setItems([
    { id: 1, text: 'Buy groceries' },
    { id: 2, text: 'Walk the dog' }
]);

// Add new item
list.addItem({ id: 3, text: 'New task' });
</script>
```

## Example: With Data Fetching

```javascript
class UsersPage extends NativeJsComponent {
    async onInit() {
        const list = this.getChild('#users-list');
        
        const result = await this.data.fetch('/api/users');
        if (result.ok) {
            list.setItems(result.data.users);
        }
        
        list.addEventListener('n-item-click', (e) => {
            window.location.href = `/user/${e.detail.item.id}`;
        });
    }
}
```

