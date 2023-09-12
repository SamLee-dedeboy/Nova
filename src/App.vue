<script lang="ts" setup >
import { RouterLink, RouterView } from "vue-router";
import Nav from "./components/Nav.vue";
import DynamicDialog from 'primevue/dynamicdialog';
import * as vue from "vue"
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const route_name = vue.computed(() => route.name)
</script>

<template>
  <Nav :route_name="route_name"/>
  <DynamicDialog/>
  <!-- <stageSelect class='page-steps'/> -->
  <RouterView />
</template>

<style>
@import "@/assets/base.css";
/* @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400&family=Roboto:wght@300;400&display=swap'); */
#app {
  font-weight: normal;
}

.app-container {
  /* display: flex;
  justify-content: center;
  align-items: center; */
  height: 100vh;
}
body {
  overflow: hidden;
  background-color: #f8f9fa;
}
header {
  line-height: 1.5;
  max-height: 100vh;
}
main {
  /* min-height: 100vh; */
}
p {
  margin: 0;
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
  z-index: 3;
  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
  font-family: Georgia;
}

.tooltip .top-tooltiptext {
  width: 120px;
  margin-left: -60px;
  bottom: 100%;
  left: 50%;
}

.tooltip .right-tooltiptext {
  left: 125%;
  /* width: max-content; */
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

.introjs-tooltiptext {
  font-family: Trebuchet MS !important;
}
</style>
