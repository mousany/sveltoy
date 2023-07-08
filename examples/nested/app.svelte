<script>
  let counter = 0;
  let double = 2;
  const increment = () => counter++;
  const decrement = () => double--;
</script>

<button on:click={decrement}>Decrement</button>
<div>{counter} x {double} = {counter * double}</div>
<button on:click={increment} class="foo">Increment</button>
