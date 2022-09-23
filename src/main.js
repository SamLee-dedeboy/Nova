
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import mitt from 'mitt';
import { createStore } from "vuex"
import { EntityInfo } from "./types"

const store = createStore({
  state () {
    return {
      selected_entity: undefined,
      selected_cooccurr_entity: undefined,
      outlet_weight_dict: {"CNN": 1, "Washington Post": 1, "FoxNews": 1, "New York Times": 1, "Breitbart": 1, "ABC News": 1},
      segmentation: {pos: 0.5, neg: 0.5},
      clicked_hexview: undefined,
    }
  },
  mutations: {
    setEntity (state, entity) {
      state.selected_entity = entity
    },
    setCooccurrEntity (state, cooccurr_entity) {
      state.selected_cooccurr_entity = cooccurr_entity
    },
    resetOutletWeight(state, weight_dict) {
      state.outlet_weight_dict = weight_dict
    },
    setOutletWeight(state, outlet, weight) {
      state.outlet_weight_dict[outlet] = weight
    },
    setSegmentation(state, segmentation) {
      state.segmentation = segmentation
    },
    setClickedHexView(state, hexview) {
      state.clicked_hexview = hexview
    }

  }
})

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
app.use(store)
app.component('Button', Button);
app.provide('server_address', "http://127.0.0.1:5000")


// app.provide('articles', articleData)
// app.provide('entity_mentions', entity_mentions.ranked_entity_list)
// app.provide('entity_cooccurrences', entity_cooccurrences)
app.mount("#app");
