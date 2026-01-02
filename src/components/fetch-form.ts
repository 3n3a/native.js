import { NativeJsComponent } from "../n";
import { NativeJsDataService } from "../service";

/**
 * A form component that fetches data based on form inputs.
 * Useful for search forms, filters, and query forms.
 * 
 * Attributes:
 * - n-action: URL to fetch from (required)
 * - n-method: HTTP method (default: GET)
 * - n-target: ID of element to dispatch result event to
 * - n-state-key: Key to store result in state (default: 'data')
 * 
 * Events:
 * - n-fetch-start: Dispatched when fetch begins
 * - n-fetch-success: Dispatched with data on success
 * - n-fetch-error: Dispatched with error on failure
 * 
 * Usage:
 * <n-fetch-form n-action="/api/search" n-state-key="results">
 *   <input type="text" name="q" placeholder="Search...">
 *   <button type="submit">Search</button>
 * </n-fetch-form>
 */
export class NativeJsFetchForm extends NativeJsComponent {
    static override tagName = 'n-fetch-form';
    static override templateId = '';

    private dataService: NativeJsDataService | null = null;

    override connectedCallback() {
        super.connectedCallback();
        this.dataService = new NativeJsDataService({ state: this.state });
        this.setupForm();
    }

    private setupForm(): void {
        // Find or create form element
        let form = this.querySelector('form');
        
        if (!form) {
            // Wrap children in a form
            form = document.createElement('form');
            while (this.firstChild) {
                form.appendChild(this.firstChild);
            }
            this.appendChild(form);
        }

        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();
        
        const form = e.target as HTMLFormElement;
        const action = this.getAttribute('n-action');
        
        if (!action) {
            console.error('n-fetch-form: n-action attribute is required');
            return;
        }

        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        formData.forEach((value, key) => {
            if (typeof value === 'string') {
                params.append(key, value);
            }
        });

        const url = params.toString() ? `${action}?${params.toString()}` : action;
        const stateKey = this.getAttribute('n-state-key') || 'data';

        // Dispatch start event
        this.dispatchEvent(new CustomEvent('n-fetch-start', { bubbles: true }));
        
        // Set loading state
        this.state.set(`${stateKey}Loading`, true);
        this.state.set(`${stateKey}Error`, null);

        try {
            const response = await this.dataService!.fetch(url, { stateKey });
            
            this.state.set(`${stateKey}Loading`, false);

            if (response.ok) {
                this.dispatchEvent(new CustomEvent('n-fetch-success', { 
                    bubbles: true,
                    detail: { data: response.data, stateKey }
                }));

                // Dispatch to target if specified
                const targetId = this.getAttribute('n-target');
                if (targetId) {
                    const target = document.getElementById(targetId);
                    target?.dispatchEvent(new CustomEvent('n-data-received', {
                        detail: { data: response.data, stateKey }
                    }));
                }
            } else {
                this.state.set(`${stateKey}Error`, response.error);
                this.dispatchEvent(new CustomEvent('n-fetch-error', {
                    bubbles: true,
                    detail: { error: response.error }
                }));
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.state.set(`${stateKey}Loading`, false);
            this.state.set(`${stateKey}Error`, errorMsg);
            this.dispatchEvent(new CustomEvent('n-fetch-error', {
                bubbles: true,
                detail: { error: errorMsg }
            }));
        }
    }
}

