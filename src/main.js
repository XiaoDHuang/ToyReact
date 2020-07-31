import ToyReact, { Component } from './ToyReact';

import './Square';

class MyComponent extends Component{
  render() {
      return <div id="wrapper">
        <span class="text">hello</span>
        <div class="children">{this.children}</div>
      </div>
  }
  mountTo(parent) {
      let vdom = this.render();
      vdom.mountTo(parent);
  }
}

class Test extends Component {}

let myComponent = 
<MyComponent class="className" id="idName">
  <Test id="text">123</Test>
</MyComponent>;

ToyReact.render(
  myComponent,
  document.body
)