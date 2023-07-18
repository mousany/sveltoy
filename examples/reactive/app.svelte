<script>
  let counter = {
    value: 0,
  };
  const increment = () => counter.value++;
  const decrement = () => counter.value--;

  let double = 0;
  let quad = 0;

  $: (double = counter.value * 2), (quad = value * 4);
  $: {
    let double = 2;
    console.log(`The count is ${counter.value}`);
    document.title = `double is ${double}`;
  }
  $: triple = counter.value * 3;

  $: ({ value } = counter);
</script>

<button on:click={decrement}>Decrement</button>
<div>{value} * 2 = {double}</div>
<div>{value} * 3 = {triple}</div>
<div>{value} * 4 = {quad}</div>
<button on:click={increment}>Increment</button>
