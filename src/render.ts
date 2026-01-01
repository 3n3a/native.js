import { createNativeJsElement, type NativeJsElementRegistry } from "./n";

export function renderTemplate(registry: NativeJsElementRegistry, templateId: string, target: HTMLElement, replaceChildren: boolean = false) {
    const templateEl: HTMLTemplateElement|null = document.querySelector('#' + templateId);
    if (!templateEl) {
        throw new Error('template not found')
    }

    const clonedVersion = document.importNode(templateEl.content, true);

    // if (hasNativeJsElements(clonedVersion)) {
    //     initNativeJsElements(registry, clonedVersion);
    // }

    renderFragment([clonedVersion], target, replaceChildren);
}

// export function hasNativeJsElements(node: DocumentFragment): boolean {
//     return node.querySelectorAll('[n-element]').length > 0;
// }

// export function initNativeJsElements(registry: NativeJsElementRegistry, node: DocumentFragment) {
//     const nativeJsElements = Array.from(node.querySelectorAll('[n-element]'));
//     for (const nativeJsElement of nativeJsElements) {
//         const name = nativeJsElement.getAttribute('n-element');
//         if (!name) {
//             throw new Error('native js element does not have a name')
//         }
//         createNativeJsElement(registry, {
//             name: name,
//             htmlElement: nativeJsElement as HTMLElement,
//             templateId: "",
//             host: undefined
//         })
//     }
// }

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