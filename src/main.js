
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import mitt from 'mitt';
import { MotionPlugin } from "@vueuse/motion";
// import { createStore } from "vuex"
// import { EntityInfo } from "./types"

import {createPinia} from "pinia";
import "primevue/resources/themes/saga-blue/theme.css"
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"
import "intro.js/introjs.css"
import axios from 'axios'
 

const pinia = createPinia();
const app = createApp(App);
const emitter = mitt();
app.config.globalProperties.emitter = emitter;
app.config.globalProperties.axios = axios

app.use(router);
app.use(PrimeVue, {ripple:true})
app.use(pinia)
app.use(MotionPlugin)
app.component('Button', Button);
app.provide('server_address', "http://127.0.0.1:5000")
app.provide('left_most_outlet', "New York Times")
app.provide('right_most_outlet', "Breitbart")
const outlet_leaning_scale = [
    { outlet: "New York Times", leaning: 0 }, 
    { outlet: "Washington Post", leaning: 0.25 }, 
    { outlet: "CNN", leaning: 0.5 }, 
    { outlet: "ABC News", leaning: 0.5 }, 
    { outlet: "FoxNews", leaning: 0.75 }, 
    { outlet: "Breitbart", leaning: 1 }, 
]
const outlet_leaning_scale_dict = {
    "New York Times": 0, 
    "CNN": 0,
    "Washington Post": 0.25, 
    "ABC News": 0.25,
    "Breitbart": 1,
    "FoxNews": 1,
}

app.provide('outlet_leaning_scale', outlet_leaning_scale)
app.provide('outlet_leaning_scale_dict', outlet_leaning_scale_dict)
const random_outlet_pool = [
    ["New York Times", "CNN"],
    ["Washington Post", "ABC News"],
    ["FoxNews", "Breitbart"]
]

const random_pool_index = [0, 1, 2].map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value)
const random_outlet_index = [Math.floor(Math.random()*2), Math.floor(Math.random()*2)]
const randomized_outlet_list = [random_outlet_pool[random_pool_index[0]][random_outlet_index[0]], random_outlet_pool[random_pool_index[1]][random_outlet_index[1]]]
app.provide('random_outlet', randomized_outlet_list)



app.mount("#app");
