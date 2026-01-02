# Modal Component

The `<n-modal>` component provides a customizable modal/dialog.

## Registration

```typescript
import { createNativeJsComponentRegistry, registerDefaultComponents } from 'native.js';

const registry = createNativeJsComponentRegistry();
registerDefaultComponents(registry);
```

## Usage

```html
<n-modal id="confirm-modal" n-title="Confirm Action">
    <p>Are you sure you want to proceed?</p>
    <div n-slot="footer">
        <button n-modal-cancel>Cancel</button>
        <button n-modal-confirm>Confirm</button>
    </div>
</n-modal>
```

### Opening and Closing

```javascript
const modal = document.querySelector('#confirm-modal');

// Open
modal.open();

// Close
modal.close();

// Toggle
modal.toggle();
```

## Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `n-title` | Modal title text | - |
| `n-closable` | Close on overlay click / Escape key | `true` |
| `n-close-btn` | Show close button in header | `true` |

## Slots

| Slot | Description |
|------|-------------|
| default | Modal body content |
| `n-slot="footer"` | Footer content (buttons) |

## Special Button Attributes

| Attribute | Description |
|-----------|-------------|
| `n-modal-confirm` | Button dispatches `n-modal-confirm` event |
| `n-modal-cancel` | Button dispatches `n-modal-cancel` and closes modal |

## Events

| Event | Description |
|-------|-------------|
| `n-modal-open` | Modal opened |
| `n-modal-close` | Modal closed |
| `n-modal-confirm` | Confirm button clicked |
| `n-modal-cancel` | Cancel button clicked |

## Methods

| Method | Description |
|--------|-------------|
| `open()` | Open the modal |
| `close()` | Close the modal |
| `toggle()` | Toggle open/closed |
| `setTitle(title)` | Update modal title |
| `setBody(content)` | Update body content (string or HTMLElement) |

## Styling

Use CSS variables to customize:

```css
n-modal {
    --n-modal-bg: white;
    --n-modal-radius: 8px;
    --n-modal-max-width: 500px;
    --n-modal-padding: 16px;
    --n-modal-border: #e0e0e0;
}
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.n-modal-overlay` | Backdrop overlay |
| `.n-modal-dialog` | Modal container |
| `.n-modal-header` | Header section |
| `.n-modal-title` | Title element |
| `.n-modal-close` | Close button |
| `.n-modal-body` | Body content |
| `.n-modal-footer` | Footer section |

## Example: Delete Confirmation

```html
<n-modal id="delete-modal" n-title="Delete Item?">
    <p>This action cannot be undone.</p>
    <div n-slot="footer">
        <button class="btn-secondary" n-modal-cancel>Cancel</button>
        <button class="btn-danger" n-modal-confirm>Delete</button>
    </div>
</n-modal>

<script>
const modal = document.querySelector('#delete-modal');

modal.addEventListener('n-modal-confirm', async () => {
    await deleteItem();
    modal.close();
});

// Show modal
document.querySelector('.delete-btn').addEventListener('click', () => {
    modal.open();
});
</script>
```

