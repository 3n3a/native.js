export function renderTemplate(templateId: string, target: HTMLElement, replaceChildren: boolean = false) {
    const templateEl: HTMLTemplateElement|null = document.querySelector('#' + templateId);
    if (!templateEl) {
        throw new Error('template not found')
    }

    const clonedVersion = document.importNode(templateEl.content, true);
    renderFragment([clonedVersion], target, replaceChildren);
}

export function renderFragment(elements: Node[], target: HTMLElement, replaceChildren: boolean = false) {
    let children = [];

    if (elements.length > 1000) {
        const fragment = new DocumentFragment();
        fragment.append(...elements);
        children.push(fragment);
    } else {
        children = elements;
    }
    
    if (replaceChildren) {
        target.replaceChildren(...children);
    } else {
        target.append(...children);
    }
}