class ElementWrapper {
  constructor(tagName) {
    this.root = document.createElement(tagName)
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(vchild) {
    vchild.mountTo(this.root)
  }
  mountTo(parent) {
    parent.appendChild(this.root)
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

export class Component {
  constructor() {
    this.prop = Object.create(null);
    this.children = [];
  }
  setAttribute(name, value) {
    this.prop[name] = value;
  }
  appendChild(vchild) {
    this.children.push(vchild)
  }
  render() {
    return ToyReact.CreateElement('div', this.prop, ...this.children);
  }
  mountTo(parent) {
    let vdom = this.render();
    vdom.mountTo(parent);
  }
}
export let ToyReact = {
  CreateElement(type, attributes, ...children) {
    let element 
    if (typeof type === 'string') {
      element = new ElementWrapper(type);
    } else {
      element = new type()
    }

    for(let name in attributes) {
      element.setAttribute(name, attributes[name]);
    }

    let insertChildren = (children) => {
      for(let child of children) {
        if (typeof child === 'string') {
          child = new TextWrapper(child);
        } else if(typeof child === 'object' && child instanceof Array) {
          insertChildren(child);
          continue; 
        } else if (
          !(child instanceof Component) &&
          !(child instanceof ElementWrapper) &&
          !(child instanceof TextWrapper)
        ) {
          child = String(child);
        }

        if(element.appendChild) {
          element.appendChild(child);
        }
      }
    }

    insertChildren(children);
    return element;
  },
  render(vdom, parent) {
    vdom.mountTo(parent);
  },
  Component,
}

export default ToyReact;