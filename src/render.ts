/**
 * Render nodes to a target element
 */
export function renderFragment(elements: Node[], target: HTMLElement, replaceChildren: boolean = false) {
    let children: Node[];

    // Use DocumentFragment for large numbers of elements
    if (elements.length > 1000) {
        const fragment = new DocumentFragment();
        fragment.append(...elements);
        children = [fragment];
    } else {
        children = elements;
    }
    
    if (replaceChildren) {
        target.replaceChildren(...children);
    } else {
        target.append(...children);
    }
}

/**
 * Render a template to a target element
 */
export function renderTemplate(templateId: string, target: HTMLElement, replaceChildren: boolean = false) {
    const templateEl: HTMLTemplateElement | null = document.querySelector('#' + templateId);
    
    if (!templateEl) {
        throw new Error(`Template with id "${templateId}" not found`);
    }

    const clonedContent = document.importNode(templateEl.content, true);
    renderFragment([clonedContent], target, replaceChildren);
}
