class ElementWrapper {
  constructor(tagName) {
    this.root = document.createElement(tagName)
  }
  setAttribute(name, value) {
    if (name.match(/on([\s\S]+)$/)) {
      let type = RegExp.$1.toLocaleLowerCase();
      this.root.addEventListener(type, value);
      return;
    }

    if (name === 'className') {
      name = 'class';
    }

    this.root.setAttribute(name, value);
  }
  appendChild(vchild) {
    let range = document.createRange();

    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild);
      range.setEndAfter(this.root.lastChild);
    } else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0)
    }

    vchild.mountTo(range);
  }
  mountTo(range) {
    this.range = range;
    this.update();
  }
  update() {
    let placeholder = document.createComment('placeholder');
    let range = document.createRange();
    range.setStart(this.range.endContainer, this.range.endOffset);
    range.setEnd(this.range.endContainer, this.range.endOffset);
    range.insertNode(placeholder);

    this.range.deleteContents();
    this.range.insertNode(this.root);

    // placeholder.parentNode.removeChild(placeholder);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root)
  }
}

export class Component {
  constructor(props) {
    this.props = Object.create(null);
    this.children = [];
  }
  setState(state) {
    let merge = (oldVal, newVal) => {
      for(let p in newVal) {
        if (typeof newVal[p] === 'object') {
          if (typeof oldVal[p] !== 'object') {
            oldVal[p] = {}
          }
          merge(oldVal[p], newVal[p])
        } else {
          oldVal[p] = newVal[p]
        }
      }
    }
    if (!this.state && state)
      this.state = {}; 
    
    merge(this.state, state);
    this.update()
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(vchild) {
    this.children.push(vchild)
  }
  render() {
    return ToyReact.CreateElement('div', this.props, ...this.children);
  }
  mountTo(range) {
    this.range = range;
    this.update();
  }
  update() {
    let vdom = this.render();
    vdom.mountTo(this.range);
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
          child = new TextWrapper(child);
        }

        if(element.appendChild) {
          element.appendChild(child);
        }
      }
    }

    insertChildren(children);
    return element;
  },
  render(vdom, element) {
    let range = document.createRange();

    if (element.children.length) {
      range.setStartAfter(element.lastChild);
      range.setEndAfter(element.lastChild);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0)
    }

    vdom.mountTo(range);
  },
  Component,
}

export default ToyReact;