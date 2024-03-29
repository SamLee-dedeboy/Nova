
import {createPinia} from "pinia";
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import mitt from 'mitt';
import { MotionPlugin } from "@vueuse/motion";

import "primevue/resources/themes/saga-blue/theme.css"
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"
import "intro.js/introjs.css"
import DialogService from 'primevue/dialogservice';
 

const pinia = createPinia();
const app = createApp(App);
const emitter = mitt();
app.config.globalProperties.emitter = emitter;

app.use(router);
app.use(pinia);
app.use(PrimeVue, {ripple:true})
app.use(MotionPlugin)
app.use(DialogService);
app.component('Button', Button);
// app.provide('server_address', "http://127.0.0.1:5000")
// app.provide('server_address', "http://0.0.0.0:5050")
app.provide('server_address', "http://infovis.cs.ucdavis.edu/nova/api")

app.mount("#app");
