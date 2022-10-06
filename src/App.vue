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

.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
body {
  overflow: hidden;
}
header {
  line-height: 1.5;
  max-height: 100vh;
}
main {
  min-height: 100vh;
}

.component-header {
  margin: 1% 1% 1% 0%;
  border-bottom: solid 1px #b7b7b7;
  font-family: 'Lato';
  font-weight: bold;
}
.tooltip .tooltiptext {
  visibility: hidden;
  background-color: white;
  /* text-align: center; */
  padding: 5px 5px;
  border-radius: 6px;
  border: solid 1px black;
  /* Position the tooltip text */
  position: absolute;
  z-index: 2;
  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip .top-tooltiptext {
  width: 120px;
  margin-left: -60px;
  bottom: 100%;
  left: 50%;
}

.tooltip .right-tooltiptext {
  left: 125%;
  width: max-content;
}

/* .tooltip .top-tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
  z-index: 100;
} */

/* .tooltip .right-tooltiptext::after {
  content: " ";
  position: absolute;
  top: 15%;
  right: 100%; 
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent black transparent transparent;
} */

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}

a {
  font-family: "Lato";
}
/* 
@media (min-width: 1024px) {

  #app {
    padding: 0 2rem;
  }

} */
</style>
