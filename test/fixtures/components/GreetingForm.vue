<template>
  <label for="name">{{ label }}</label>
  <input id="name" v-model="name">
  <p class="greeting">Hello {{ name }}</p>
</template>

<script>
export default {
  name: 'GreetingForm',
  props: { label: { type: String, default: 'Name' } },
  data() {
    return { name: 'CIB' }
  },
}
</script>
