
export default function () {
  let button_0;
  let txt_1;
  let div_2;
  let div_3;
  let exp_4;
  let txt_5;
  let exp_6;
  let txt_7;
  let exp_8;
  let div_9;
  let div_10;
  let exp_11;
  let button_12;
  let txt_13;
  let counter = {
    a: {
      b: { c: 0 },
      d: 0
    }
  };
  const increment = () => (counter.a.b.c++, lifecycle.update(['counter']));
  const decrement = () => (counter.a.d--, lifecycle.update(['counter']));
  const lifecycle = {
    create(target) {
      button_0 = document.createElement('button')
      button_0.addEventListener('click', decrement)
      txt_1 = document.createTextNode('Decrement')
      button_0.appendChild(txt_1)
      target.appendChild(button_0)
      div_2 = document.createElement('div')
      div_3 = document.createElement('div')
      exp_4 = document.createTextNode(counter.a.b.c)
      div_3.appendChild(exp_4)
      txt_5 = document.createTextNode(' / ')
      div_3.appendChild(txt_5)
      exp_6 = document.createTextNode(counter.a.d)
      div_3.appendChild(exp_6)
      txt_7 = document.createTextNode(' = ')
      div_3.appendChild(txt_7)
      exp_8 = document.createTextNode(counter.a.b.c / counter.a.d)
      div_3.appendChild(exp_8)
      div_2.appendChild(div_3)
      target.appendChild(div_2)
      div_9 = document.createElement('div')
      div_10 = document.createElement('div')
      exp_11 = document.createTextNode(counter)
      div_10.appendChild(exp_11)
      div_9.appendChild(div_10)
      target.appendChild(div_9)
      button_12 = document.createElement('button')
      button_12.addEventListener('click', increment)
      txt_13 = document.createTextNode('Increment')
      button_12.appendChild(txt_13)
      target.appendChild(button_12)
    },
    update(changed) {
      if (changed.includes('counter')) exp_4.textContent = JSON.stringify(counter.a.b.c)
      if (changed.includes('counter')) exp_6.textContent = JSON.stringify(counter.a.d)
      if (changed.includes('counter') || changed.includes('counter')) exp_8.textContent = JSON.stringify(counter.a.b.c / counter.a.d)
      if (changed.includes('counter')) exp_11.textContent = JSON.stringify(counter)
    },
    destroy(target) {
      button_0.removeEventListener('click', decrement)
      button_0.removeChild(txt_1)
      target.removeChild(button_0)
      div_3.removeChild(exp_4)
      div_3.removeChild(txt_5)
      div_3.removeChild(exp_6)
      div_3.removeChild(txt_7)
      div_3.removeChild(exp_8)
      div_2.removeChild(div_3)
      target.removeChild(div_2)
      div_10.removeChild(exp_11)
      div_9.removeChild(div_10)
      target.removeChild(div_9)
      button_12.removeEventListener('click', increment)
      button_12.removeChild(txt_13)
      target.removeChild(button_12)
    },
  }
  return lifecycle;
}
