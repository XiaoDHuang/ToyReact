const childrenSyml = Symbol('#children');
class ElementWrapper {
  constructor(tagName) {
    this.type = tagName;
    this.props = Object.create(null);
    this[childrenSyml]= [];
  }
  get vdom() {
    return this;
  }
  get children() {
    return this[childrenSyml].map(child => child);
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  setElementAttribute(element, name, value) {
    if (name.match(/on([\s\S]+)$/)) {
      let type = RegExp.$1.toLocaleLowerCase();
      element.addEventListener(type, value);
      return;
    }

    if (name === 'className') {
      name = 'class';
    }

    element.setAttribute(name, value);
  }
  appendChild(vchild) {
    this[childrenSyml].push(vchild);
  }
  mountTo(range) {
    this.range = range; 
    this.update(range);
  }
  update() {
    let element = document.createElement(this.type)
    this.root = element;

    for(let name in this.props) {
      this.setElementAttribute(element, name, this.props[name])
    }

    for(let vchild of this[childrenSyml]) {
      let childRange = document.createRange();
      if (element.children.length) {
        childRange.setStartAfter(element.lastChild);
        childRange.setEndAfter(element.lastChild);
      } else {
        childRange.setStart(element, 0);
        childRange.setEnd(element, 0)
      }

      vchild.mountTo(childRange);
    }
    
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
    this.type = '#text';
    this.props = Object.create(null);
    this[childrenSyml] = [];
    this.root = document.createTextNode(content);
  }
  get children() {
    return this[childrenSyml].map(child => child);
  }
  get vdom() {
    return this;
  }
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root)
  }
}

export class Component {
  constructor(props) {
    this.props = Object.create(null);
    this[childrenSyml] = [];
  }
  get vdom() {
    if (this.oldVdom) {
      return this.oldVdom;
    } else {
      return this.render().vdom;
    }
  } 
  get type() {
    return this.constructor.name;
  }
  get children() {
    return this[childrenSyml].map(child => child);
  }
  setState(state) {
    let merge = (oldVal, newVal) => {
      for(let p in newVal) {
        if (typeof newVal[p] === 'object' && newVal[p] !== null) {
          if (newVal[p] instanceof Array) {
            oldVal[p] = [];
          } else {
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
    this[childrenSyml].push(vchild)
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

    let isSameNode= (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false;
      }
      if (Object.keys(oldNode.props).length !== Object.keys(newNode.props).length) {
        return false;
      }
      for(let name in oldNode.props) {
        if (
          typeof oldNode.props[name] === 'function' &&
          typeof newNode.props[name] === 'function' &&
          oldNode.props[name].toString() === newNode.props[name].toString()
        ) 
        {
          continue;
        }

        if (oldNode.props[name] != newNode.props[name]) {
          return false;
        }
      }

      if (oldNode.children.length !== newNode.children.length) {
        return false;
      }

      return true;
    }

    let isSameTree = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        return false;
      } 

      if (oldNode.children.length !== newNode.children.length) {
        return false;
      }

      for(let i = 0; i < oldNode.children.length; i ++) {
        if (!isSameTree(oldNode.children[i], newNode.children[i])) {
          return false;
        }
      }

      return true;
    }

    let replace = (oldNode, newNode) => {
      if (isSameTree(oldNode, newNode)) {
        return;
      }

      if (!isSameNode(oldNode, newNode)) {
        newNode.mountTo(oldNode.range);
      } else {
        for(let i = 0; i < oldNode.children.length; i ++) {
          replace(oldNode.children[i].vdom, newNode.children[i].vdom);
        } 
      }
    }

    if (this.oldVdom) {
      replace(this.oldVdom, vdom)
    } else {
      vdom.mountTo(this.range);
      this.oldVdom = vdom;
    }
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
          if (child === null || child === void 0) {
            child = '';
          }

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