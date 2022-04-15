
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import mitt from 'mitt';


import "primevue/resources/themes/bootstrap4-light-blue/theme.css"
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"

const app = createApp(App);
const emitter = mitt();
app.config.globalProperties.emitter = emitter;

app.use(router);
app.use(PrimeVue, {ripple:true})
app.component('Button', Button);


app.mount("#app");
