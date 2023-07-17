<script>
  let counter = {
    a: {
      b: {
        c: 0,
      },
      d: 0,
    },
  };
  const increment = () => counter.a.b.c++;
  const decrement = () => counter.a.d--;
</script>

<button on:click={decrement}>Decrement</button>
<div>{counter.a.b.c} / {counter.a.d} = {counter.a.b.c / counter.a.d}</div>
<div>{counter}</div>
<button on:click={increment}>Increment</button>
