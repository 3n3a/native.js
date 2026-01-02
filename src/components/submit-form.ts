import { NativeJsComponent } from "../n";
import { NativeJsDataService, type NativeJsHttpMethod } from "../service";

/**
 * A form component that submits data to an endpoint.
 * Useful for contact forms, registration, data entry.
 * 
 * Attributes:
 * - n-action: URL to submit to (required)
 * - n-method: HTTP method (default: POST)
 * - n-reset: Reset form after successful submit (default: true)
 * - n-success-message: Message to show on success
 * - n-error-message: Message to show on error
 * 
 * Events:
 * - n-submit-start: Dispatched when submit begins
 * - n-submit-success: Dispatched with response data on success
 * - n-submit-error: Dispatched with error on failure
 * 
 * Usage:
 * <n-submit-form n-action="/api/contact" n-success-message="Thank you!">
 *   <input type="text" name="name" placeholder="Name" required>
 *   <input type="email" name="email" placeholder="Email" required>
 *   <textarea name="message" placeholder="Message"></textarea>
 *   <button type="submit">Send</button>
 * </n-submit-form>
 */
export class NativeJsSubmitForm extends NativeJsComponent {
    static override tagName = 'n-submit-form';
    static override templateId = '';

    private dataService: NativeJsDataService | null = null;
    private messageContainer: HTMLElement | null = null;

    override connectedCallback() {
        super.connectedCallback();
        this.dataService = new NativeJsDataService();
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

        // Create message container
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'n-form-message';
        this.messageContainer.style.display = 'none';
        form.appendChild(this.messageContainer);

        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    private showMessage(message: string, isError: boolean): void {
        if (!this.messageContainer) return;
        
        this.messageContainer.textContent = message;
        this.messageContainer.style.display = 'block';
        this.messageContainer.className = isError 
            ? 'n-form-message n-form-error' 
            : 'n-form-message n-form-success';
    }

    private hideMessage(): void {
        if (!this.messageContainer) return;
        this.messageContainer.style.display = 'none';
    }

    private setFormLoading(form: HTMLFormElement, loading: boolean): void {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLButtonElement | HTMLInputElement | null;
        
        if (submitBtn) {
            submitBtn.disabled = loading;
            if (loading) {
                submitBtn.dataset.originalText = submitBtn.textContent || '';
                submitBtn.textContent = 'Submitting...';
            } else if (submitBtn.dataset.originalText) {
                submitBtn.textContent = submitBtn.dataset.originalText;
            }
        }

        // Disable all inputs during submit
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach((input) => {
            (input as HTMLInputElement).disabled = loading;
        });
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();
        
        const form = e.target as HTMLFormElement;
        const action = this.getAttribute('n-action');
        
        if (!action) {
            console.error('n-submit-form: n-action attribute is required');
            return;
        }

        const method = (this.getAttribute('n-method') || 'POST').toUpperCase() as NativeJsHttpMethod;
        const shouldReset = this.getAttribute('n-reset') !== 'false';

        // Collect form data as object
        const formData = new FormData(form);
        const data: Record<string, unknown> = {};
        
        formData.forEach((value, key) => {
            // Handle multiple values with same name (e.g., checkboxes)
            if (data[key] !== undefined) {
                if (Array.isArray(data[key])) {
                    (data[key] as unknown[]).push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        });

        this.hideMessage();
        this.setFormLoading(form, true);

        // Dispatch start event
        this.dispatchEvent(new CustomEvent('n-submit-start', { 
            bubbles: true,
            detail: { data }
        }));

        try {
            const response = await this.dataService!.submit(action, data, { method });
            
            this.setFormLoading(form, false);

            if (response.ok) {
                const successMessage = this.getAttribute('n-success-message') || 'Submitted successfully!';
                this.showMessage(successMessage, false);

                if (shouldReset) {
                    form.reset();
                }

                this.dispatchEvent(new CustomEvent('n-submit-success', {
                    bubbles: true,
                    detail: { data: response.data }
                }));
            } else {
                const errorMessage = this.getAttribute('n-error-message') || response.error || 'Submission failed';
                this.showMessage(errorMessage, true);

                this.dispatchEvent(new CustomEvent('n-submit-error', {
                    bubbles: true,
                    detail: { error: response.error }
                }));
            }
        } catch (error) {
            this.setFormLoading(form, false);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            const errorMessage = this.getAttribute('n-error-message') || errorMsg;
            this.showMessage(errorMessage, true);

            this.dispatchEvent(new CustomEvent('n-submit-error', {
                bubbles: true,
                detail: { error: errorMsg }
            }));
        }
    }
}

