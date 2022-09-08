
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import mitt from 'mitt';


import "primevue/resources/themes/saga-blue/theme.css"
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"
import axios from 'axios'
 
// import articleData from "./preprocess/data/processed_articles_rel_hugFace.json"
// import entity_mentions from "./preprocess/data/candidate_entities.json"
// import entity_cooccurrences from "./preprocess/data/candidate_cooccurrences.json"

const app = createApp(App);
const emitter = mitt();
app.config.globalProperties.emitter = emitter;
app.config.globalProperties.axios = axios

app.use(router);
app.use(PrimeVue, {ripple:true})
app.component('Button', Button);
// app.provide('articles', articleData)
// app.provide('entity_mentions', entity_mentions.ranked_entity_list)
// app.provide('entity_cooccurrences', entity_cooccurrences)
app.mount("#app");
