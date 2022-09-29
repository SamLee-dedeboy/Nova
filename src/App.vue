<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <header>
  </header> 

  <RouterView />
</template>

<style>
@import "@/assets/base.css";
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400&family=Roboto:wght@300;400&display=swap');
#app {
  font-weight: normal;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}
main {
  min-height: 100vh;
}
/* 
@media (min-width: 1024px) {

  #app {
    padding: 0 2rem;
  }

} */
</style>
