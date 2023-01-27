
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import mitt from 'mitt';
// import { createStore } from "vuex"
// import { EntityInfo } from "./types"

import {createPinia} from "pinia";
import "primevue/resources/themes/saga-blue/theme.css"
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"
import axios from 'axios'
 

const pinia = createPinia();
const app = createApp(App);
const emitter = mitt();
app.config.globalProperties.emitter = emitter;
app.config.globalProperties.axios = axios

app.use(router);
app.use(PrimeVue, {ripple:true})
app.use(pinia)
app.component('Button', Button);
app.provide('server_address', "http://127.0.0.1:5000")
app.provide('left_most_outlet', "New York Times")
app.provide('right_most_outlet', "Breitbart")



app.mount("#app");
