
export default function () {
  let button_0;
  let txt_1;
  let div_2;
  let div_3;
  let exp_4;
  let txt_5;
  let exp_6;
  let div_7;
  let div_8;
  let exp_9;
  let txt_10;
  let exp_11;
  let div_12;
  let div_13;
  let exp_14;
  let txt_15;
  let exp_16;
  let button_17;
  let txt_18;
  let triple;
  let value;
  let counter = { value: 0 };
  const increment = () => (counter.value++, lifecycle.update(['counter']));
  const decrement = () => (counter.value--, lifecycle.update(['counter']));
  let double = 0;
  let quad = 0;
  const lifecycle = {
    create: function (target) {
      button_0 = document.createElement('button')
      button_0.addEventListener('click', decrement)
      txt_1 = document.createTextNode('Decrement')
      button_0.appendChild(txt_1)
      target.appendChild(button_0)
      div_2 = document.createElement('div')
      div_3 = document.createElement('div')
      exp_4 = document.createTextNode(value)
      div_3.appendChild(exp_4)
      txt_5 = document.createTextNode(' * 2 = ')
      div_3.appendChild(txt_5)
      exp_6 = document.createTextNode(double)
      div_3.appendChild(exp_6)
      div_2.appendChild(div_3)
      target.appendChild(div_2)
      div_7 = document.createElement('div')
      div_8 = document.createElement('div')
      exp_9 = document.createTextNode(value)
      div_8.appendChild(exp_9)
      txt_10 = document.createTextNode(' * 3 = ')
      div_8.appendChild(txt_10)
      exp_11 = document.createTextNode(triple)
      div_8.appendChild(exp_11)
      div_7.appendChild(div_8)
      target.appendChild(div_7)
      div_12 = document.createElement('div')
      div_13 = document.createElement('div')
      exp_14 = document.createTextNode(value)
      div_13.appendChild(exp_14)
      txt_15 = document.createTextNode(' * 4 = ')
      div_13.appendChild(txt_15)
      exp_16 = document.createTextNode(quad)
      div_13.appendChild(exp_16)
      div_12.appendChild(div_13)
      target.appendChild(div_12)
      button_17 = document.createElement('button')
      button_17.addEventListener('click', increment)
      txt_18 = document.createTextNode('Increment')
      button_17.appendChild(txt_18)
      target.appendChild(button_17)
      triple = counter.value * 3;; lifecycle.update(['triple']);
      ({ value } = counter);; lifecycle.update(['value']);
      double = counter.value * 2, quad = value * 4;; lifecycle.update([
        'double',
        ,
        'quad'
      ]);
      {
        let double = 2;
        console.log(`The count is ${counter.value}`);
        document.title = `double is ${double}`;
      }; lifecycle.update([]);
    },
    update: function (changed) {
      if (changed.includes('value')) exp_4.textContent = JSON.stringify(value)
      if (changed.includes('double')) exp_6.textContent = JSON.stringify(double)
      if (changed.includes('value')) exp_9.textContent = JSON.stringify(value)
      if (changed.includes('triple')) exp_11.textContent = JSON.stringify(triple)
      if (changed.includes('value')) exp_14.textContent = JSON.stringify(value)
      if (changed.includes('quad')) exp_16.textContent = JSON.stringify(quad)
      if (changed.includes('counter')) { triple = counter.value * 3;; lifecycle.update(['triple']); }
      if (changed.includes('counter')) { ({ value } = counter);; lifecycle.update(['value']); }
      if (changed.includes('counter') || changed.includes('value')) {
        double = counter.value * 2, quad = value * 4;; lifecycle.update([
          'double',
          ,
          'quad'
        ]);
      }
      if (changed.includes('counter')) {
        {
          let double = 2;
          console.log(`The count is ${counter.value}`);
          document.title = `double is ${double}`;
        }; lifecycle.update([]);
      }
    },
    destroy: function (target) {
      button_0.removeEventListener('click', decrement)
      button_0.removeChild(txt_1)
      target.removeChild(button_0)
      div_3.removeChild(exp_4)
      div_3.removeChild(txt_5)
      div_3.removeChild(exp_6)
      div_2.removeChild(div_3)
      target.removeChild(div_2)
      div_8.removeChild(exp_9)
      div_8.removeChild(txt_10)
      div_8.removeChild(exp_11)
      div_7.removeChild(div_8)
      target.removeChild(div_7)
      div_13.removeChild(exp_14)
      div_13.removeChild(txt_15)
      div_13.removeChild(exp_16)
      div_12.removeChild(div_13)
      target.removeChild(div_12)
      button_17.removeEventListener('click', increment)
      button_17.removeChild(txt_18)
      target.removeChild(button_17)
    },
  }
  return lifecycle;
}
