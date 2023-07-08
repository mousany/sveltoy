
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
  let button_9;
  let txt_10;
  let counter = 0;
  let double = 2;
  const increment = () => (counter++, lifecycle.update(['counter']));
  const decrement = () => (double--, lifecycle.update(['double']));
  const lifecycle = {
    create(target) {
      button_0 = document.createElement('button')
      button_0.addEventListener('click', decrement)
      txt_1 = document.createTextNode('Decrement')
      button_0.appendChild(txt_1)
      target.appendChild(button_0)
      div_2 = document.createElement('div')
      div_3 = document.createElement('div')
      exp_4 = document.createTextNode(counter)
      div_3.appendChild(exp_4)
      txt_5 = document.createTextNode(' x ')
      div_3.appendChild(txt_5)
      exp_6 = document.createTextNode(double)
      div_3.appendChild(exp_6)
      txt_7 = document.createTextNode(' = ')
      div_3.appendChild(txt_7)
      exp_8 = document.createTextNode(counter * double)
      div_3.appendChild(exp_8)
      div_2.appendChild(div_3)
      target.appendChild(div_2)
      button_9 = document.createElement('button')
      button_9.addEventListener('click', increment)
      button_9.setAttribute('class', 'foo')
      txt_10 = document.createTextNode('Increment')
      button_9.appendChild(txt_10)
      target.appendChild(button_9)
    },
    update(changed) {
      if (changed.includes('counter')) exp_4.textContent = counter
      if (changed.includes('double')) exp_6.textContent = double
      if (changed.includes('counter') || changed.includes('double')) exp_8.textContent = counter * double
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
      button_9.removeEventListener('click', increment)
      button_9.removeChild(txt_10)
      target.removeChild(button_9)
    },
  }
  return lifecycle;
}
