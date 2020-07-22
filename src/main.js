import ToyReact, { Component } from './ToyReact';

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

let myComponent = 
<MyComponent class="className" id="idName">
  <div id="text">123</div>
</MyComponent>;
debugger
ToyReact.render(
  myComponent,
  document.body
)