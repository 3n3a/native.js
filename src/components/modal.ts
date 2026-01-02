import { NativeJsComponent } from "../n";

/**
 * A modal/dialog component with built-in show/hide functionality.
 * 
 * Attributes:
 * - n-title: Modal title text
 * - n-closable: Whether clicking overlay closes modal (default: true)
 * - n-close-btn: Whether to show close button (default: true)
 * 
 * Events:
 * - n-modal-open: Dispatched when modal opens
 * - n-modal-close: Dispatched when modal closes
 * - n-modal-confirm: Dispatched when confirm button is clicked
 * - n-modal-cancel: Dispatched when cancel button is clicked
 * 
 * Slots:
 * - default: Modal body content
 * - [n-slot="footer"]: Footer content (buttons)
 * 
 * Usage:
 * <n-modal id="my-modal" n-title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <div n-slot="footer">
 *     <button n-modal-cancel>Cancel</button>
 *     <button n-modal-confirm>Confirm</button>
 *   </div>
 * </n-modal>
 * 
 * Open with: document.querySelector('#my-modal').open()
 * Close with: document.querySelector('#my-modal').close()
 */
export class NativeJsModal extends NativeJsComponent {
    static override tagName = 'n-modal';
    static override templateId = '';

    private overlay: HTMLElement | null = null;
    private dialog: HTMLElement | null = null;
    private isOpen: boolean = false;
    private originalContent: Node[] = [];

    override connectedCallback() {
        super.connectedCallback();
        this.setupModal();
    }

    private setupModal(): void {
        // Store original content
        this.originalContent = Array.from(this.childNodes).map(node => node.cloneNode(true));

        // Create modal structure
        this.innerHTML = '';
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'n-modal-overlay';
        this.overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        `;

        // Create dialog
        this.dialog = document.createElement('div');
        this.dialog.className = 'n-modal-dialog';
        this.dialog.style.cssText = `
            background: var(--n-modal-bg, white);
            border-radius: var(--n-modal-radius, 8px);
            max-width: var(--n-modal-max-width, 500px);
            width: 90%;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        // Create header
        const header = document.createElement('div');
        header.className = 'n-modal-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--n-modal-padding, 16px);
            border-bottom: 1px solid var(--n-modal-border, #e0e0e0);
        `;

        const title = this.getAttribute('n-title');
        if (title) {
            const titleEl = document.createElement('h3');
            titleEl.className = 'n-modal-title';
            titleEl.textContent = title;
            titleEl.style.cssText = 'margin: 0; font-size: 1.25rem;';
            header.appendChild(titleEl);
        }

        // Close button
        if (this.getAttribute('n-close-btn') !== 'false') {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'n-modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                opacity: 0.5;
            `;
            closeBtn.addEventListener('click', () => this.close());
            header.appendChild(closeBtn);
        }

        // Create body
        const body = document.createElement('div');
        body.className = 'n-modal-body';
        body.style.cssText = 'padding: var(--n-modal-padding, 16px);';

        // Create footer
        const footer = document.createElement('div');
        footer.className = 'n-modal-footer';
        footer.style.cssText = `
            padding: var(--n-modal-padding, 16px);
            border-top: 1px solid var(--n-modal-border, #e0e0e0);
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        `;

        // Distribute original content
        let hasFooterContent = false;
        this.originalContent.forEach(node => {
            if (node instanceof HTMLElement && node.hasAttribute('n-slot')) {
                if (node.getAttribute('n-slot') === 'footer') {
                    // Move footer slot children to footer
                    while (node.firstChild) {
                        footer.appendChild(node.firstChild);
                    }
                    hasFooterContent = true;
                }
            } else {
                body.appendChild(node.cloneNode(true));
            }
        });

        // Assemble dialog
        if (title || this.getAttribute('n-close-btn') !== 'false') {
            this.dialog.appendChild(header);
        }
        this.dialog.appendChild(body);
        if (hasFooterContent) {
            this.dialog.appendChild(footer);
        }

        this.overlay.appendChild(this.dialog);
        this.appendChild(this.overlay);

        // Setup event handlers
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // Close on overlay click
        if (this.getAttribute('n-closable') !== 'false') {
            this.overlay?.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        // Handle confirm/cancel buttons
        this.dialog?.querySelectorAll('[n-modal-confirm]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('n-modal-confirm', { bubbles: true }));
            });
        });

        this.dialog?.querySelectorAll('[n-modal-cancel]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('n-modal-cancel', { bubbles: true }));
                this.close();
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen && this.getAttribute('n-closable') !== 'false') {
                this.close();
            }
        });
    }

    /**
     * Open the modal
     */
    open(): void {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            this.dispatchEvent(new CustomEvent('n-modal-open', { bubbles: true }));
        }
    }

    /**
     * Close the modal
     */
    close(): void {
        if (this.overlay) {
            this.overlay.style.display = 'none';
            this.isOpen = false;
            document.body.style.overflow = '';
            this.dispatchEvent(new CustomEvent('n-modal-close', { bubbles: true }));
        }
    }

    /**
     * Toggle the modal
     */
    toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Update the modal title
     */
    setTitle(title: string): void {
        const titleEl = this.dialog?.querySelector('.n-modal-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Update the modal body content
     */
    setBody(content: string | HTMLElement): void {
        const body = this.dialog?.querySelector('.n-modal-body');
        if (body) {
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else {
                body.innerHTML = '';
                body.appendChild(content);
            }
        }
    }
}

