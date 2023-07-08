export default function () {
  let button_0;
  let txt_1;
  let div_2;
  let exp_3;
  let button_4;
  let txt_5;
  let counter = 0;
  const increment = () => (counter++, lifecycle.update(['counter']));
  const decrement = () => (counter--, lifecycle.update(['counter']));
  const lifecycle = {
    create(target) {
      button_0 = document.createElement('button')
      button_0.addEventListener('click', decrement)
      txt_1 = document.createTextNode('Decrement')
      button_0.appendChild(txt_1)
      target.appendChild(button_0)
      div_2 = document.createElement('div')
      exp_3 = document.createTextNode(counter)
      div_2.appendChild(exp_3)
      target.appendChild(div_2)
      button_4 = document.createElement('button')
      button_4.addEventListener('click', increment)
      txt_5 = document.createTextNode('Increment')
      button_4.appendChild(txt_5)
      target.appendChild(button_4)
    },
    update(changed) {
      if (changed.includes('counter')) exp_3.textContent = counter
    },
    destroy(target) {
      button_0.removeEventListener('click', decrement)
      button_0.removeChild(txt_1)
      target.removeChild(button_0)
      div_2.removeChild(exp_3)
      target.removeChild(div_2)
      button_4.removeEventListener('click', increment)
      button_4.removeChild(txt_5)
      target.removeChild(button_4)
    },
  }
  return lifecycle;
}
