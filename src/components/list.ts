import { NativeJsComponent } from "../n";
import { escapeHtml } from "../utils";

/**
 * A list component for rendering dynamic lists of items.
 * 
 * Attributes:
 * - n-empty-text: Text to show when list is empty (default: 'No items')
 * 
 * Events:
 * - n-list-updated: Dispatched when list items change
 * - n-item-click: Dispatched when an item is clicked (detail: { item, index })
 * 
 * Usage:
 * <n-list id="my-list" n-empty-text="No users found">
 *   <template n-item>
 *     <div class="user-item">
 *       <span class="name">{{name}}</span>
 *       <span class="email">{{email}}</span>
 *     </div>
 *   </template>
 * </n-list>
 * 
 * Programmatic usage:
 * const list = document.querySelector('#my-list');
 * list.setItems([{ name: 'John', email: 'john@example.com' }]);
 * list.addItem({ name: 'Jane', email: 'jane@example.com' });
 */
export class NativeJsList extends NativeJsComponent {
    static override tagName = 'n-list';
    static override templateId = '';

    private items: unknown[] = [];
    private itemTemplate: HTMLTemplateElement | null = null;
    private container: HTMLElement | null = null;
    private emptyElement: HTMLElement | null = null;

    override connectedCallback() {
        super.connectedCallback();
        this.setupList();
    }

    private setupList(): void {
        // Find item template
        this.itemTemplate = this.querySelector('template[n-item]');
        
        // Create container for items
        this.container = document.createElement('div');
        this.container.className = 'n-list-container';

        // Create empty state element
        this.emptyElement = document.createElement('div');
        this.emptyElement.className = 'n-list-empty';
        this.emptyElement.textContent = this.getAttribute('n-empty-text') || 'No items';
        this.emptyElement.style.cssText = 'text-align: center; padding: 16px; opacity: 0.6;';

        // Clear and rebuild structure
        const template = this.itemTemplate;
        this.innerHTML = '';
        if (template) {
            this.appendChild(template);
        }
        this.appendChild(this.container);
        this.appendChild(this.emptyElement);

        this.render();
    }

    /**
     * Render the list items
     */
    private render(): void {
        if (!this.container || !this.emptyElement) return;

        this.container.innerHTML = '';

        if (this.items.length === 0) {
            this.emptyElement.style.display = 'block';
            return;
        }

        this.emptyElement.style.display = 'none';

        this.items.forEach((item, index) => {
            const element = this.createItemElement(item, index);
            if (element) {
                this.container!.appendChild(element);
            }
        });
    }

    /**
     * Create an element for a single item
     */
    private createItemElement(item: unknown, index: number): HTMLElement | null {
        if (!this.itemTemplate) {
            // No template, create basic element
            const div = document.createElement('div');
            div.className = 'n-list-item';
            div.textContent = String(item);
            div.dataset.index = String(index);
            this.attachItemEvents(div, item, index);
            return div;
        }

        // Clone template
        const clone = this.itemTemplate.content.cloneNode(true) as DocumentFragment;
        const element = clone.firstElementChild as HTMLElement;
        
        if (!element) return null;

        // Set data attributes
        element.dataset.index = String(index);
        element.classList.add('n-list-item');

        // Replace template variables
        this.replaceTemplateVariables(element, item as Record<string, unknown>);
        
        // Attach events
        this.attachItemEvents(element, item, index);

        return element;
    }

    /**
     * Replace {{variable}} patterns in element content and attributes
     */
    private replaceTemplateVariables(element: HTMLElement, data: Record<string, unknown>): void {
        // Replace in text content
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const textNodes: Text[] = [];
        let node: Text | null;
        while ((node = walker.nextNode() as Text | null)) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            if (textNode.textContent) {
                textNode.textContent = this.interpolate(textNode.textContent, data);
            }
        });

        // Replace in attributes
        const allElements = [element, ...Array.from(element.querySelectorAll('*'))];
        allElements.forEach(el => {
            Array.from((el as HTMLElement).attributes).forEach(attr => {
                if (attr.value.includes('{{')) {
                    attr.value = this.interpolate(attr.value, data);
                }
            });
        });
    }

    /**
     * Interpolate {{key}} patterns with data values (HTML-escaped)
     * Use {{{key}}} for unescaped raw HTML
     */
    private interpolate(template: string, data: Record<string, unknown>): string {
        // First handle raw/unescaped {{{key}}}
        let result = template.replace(/\{\{\{(\w+(?:\.\w+)*)\}\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value !== undefined ? String(value) : match;
        });
        
        // Then handle escaped {{key}}
        result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value !== undefined ? escapeHtml(String(value)) : match;
        });
        
        return result;
    }
    
    /**
     * Get a nested value from an object using dot notation
     */
    private getNestedValue(data: Record<string, unknown>, key: string): unknown {
        const keys = key.split('.');
        let value: unknown = data;
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = (value as Record<string, unknown>)[k];
            } else {
                return undefined;
            }
        }
        return value;
    }

    /**
     * Attach click events to item element
     */
    private attachItemEvents(element: HTMLElement, item: unknown, index: number): void {
        element.addEventListener('click', (e) => {
            this.dispatchEvent(new CustomEvent('n-item-click', {
                bubbles: true,
                detail: { item, index, element, originalEvent: e }
            }));
        });
    }

    /**
     * Set all items (replaces existing)
     */
    setItems(items: unknown[]): void {
        this.items = [...items];
        this.render();
        this.dispatchEvent(new CustomEvent('n-list-updated', {
            bubbles: true,
            detail: { items: this.items }
        }));
    }

    /**
     * Add an item to the list
     */
    addItem(item: unknown, position: 'start' | 'end' = 'end'): void {
        if (position === 'start') {
            this.items.unshift(item);
        } else {
            this.items.push(item);
        }
        this.render();
        this.dispatchEvent(new CustomEvent('n-list-updated', {
            bubbles: true,
            detail: { items: this.items }
        }));
    }

    /**
     * Remove an item by index
     */
    removeItem(index: number): void {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.render();
            this.dispatchEvent(new CustomEvent('n-list-updated', {
                bubbles: true,
                detail: { items: this.items }
            }));
        }
    }

    /**
     * Remove an item by predicate
     */
    removeItemWhere(predicate: (item: unknown, index: number) => boolean): void {
        const index = this.items.findIndex(predicate);
        if (index !== -1) {
            this.removeItem(index);
        }
    }

    /**
     * Update an item at index
     */
    updateItem(index: number, item: unknown): void {
        if (index >= 0 && index < this.items.length) {
            this.items[index] = item;
            this.render();
            this.dispatchEvent(new CustomEvent('n-list-updated', {
                bubbles: true,
                detail: { items: this.items }
            }));
        }
    }

    /**
     * Clear all items
     */
    clear(): void {
        this.items = [];
        this.render();
        this.dispatchEvent(new CustomEvent('n-list-updated', {
            bubbles: true,
            detail: { items: this.items }
        }));
    }

    /**
     * Get all items
     */
    getItems(): unknown[] {
        return [...this.items];
    }

    /**
     * Get item by index
     */
    getItem(index: number): unknown | undefined {
        return this.items[index];
    }

    /**
     * Get items count
     */
    get length(): number {
        return this.items.length;
    }
}

