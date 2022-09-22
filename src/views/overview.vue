<script setup lang="ts">
import OutletWeightSlider from "../components/OutletWeightSlider.vue";
import Slider from "primevue/slider"
import InputText from "primevue/inputtext"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ToggleButton from 'primevue/togglebutton';
import { watch, computed, onMounted, PropType, ref, Ref, nextTick, } from 'vue'
import * as vue from 'vue'
import * as typeUtils from "../types"
import Legend from "../components/Legend.vue";
import Divider from 'primevue/divider';
import ColorSpectrum from '../components/ColorSpectrum.vue'
import * as SstColors from "../components/utils/ColorUtils"
import * as _ from "lodash"
import SentimentScatter from "../components/SentimentScatter.vue";
import Tooltip from "../components/Tooltip.vue";
import SearchBar from "../components/SearchBar.vue";
import EntityInfoView from "../components/EntityInfoView.vue"
import HexCooccurrence from "../components/HexCooccurrence.vue";
import TopicBars from "../components/TopicBars.vue"
import tutorial_intro_json from "../assets/tutorial/tutorial_intro.json"
import EntitySelection from "../components/overviewComponents/entitySelection.vue"
import * as tutorial from "../components/utils/TutorialUtils"
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'


const store = useStore()




//
// raw data
//
const server_address = "http://127.0.0.1:5000"

// overview data 
const overview_overall_scatter_data: Ref<any> = ref({})
const overview_grouped_scatter_data: Ref<any> = ref({})
const overview_grouped_scatter_metadata: Ref<any> = ref({})
const overview_overall_scatter_metadata: Ref<any> = ref({})
const grouped_scatter_view_dict = vue.computed(() => {
  if(!overview_grouped_scatter_data.value) return undefined
  let res_dict: any = {}
  Object.keys(overview_grouped_scatter_data.value).forEach(outlet => {
    const scatter_data = overview_grouped_scatter_data.value[outlet]
    const scatter_view: typeUtils.EntityScatterView = {
      title: outlet,
      data: scatter_data
    }
    res_dict[outlet] = scatter_view
  })
  return res_dict
})

const overall_scatter_view: Ref<typeUtils.EntityScatterView | undefined> = ref(undefined)
const overall_entity_dict: Ref<any> = ref({})
const overall_scatter_data_loading: Ref<boolean> = ref(true)
const grouped_scatter_data_loaded: Ref<boolean> = ref(false)
const overview_constructed: Ref<boolean> = ref(false)
const overall_co_hexview: Ref<any> = ref(null)
//
// processed data 
//


// outlet related data
/**
 * set of outlet names extracted from dataset.
 */
const enabled_outlet_set: Ref<Set<string>> = ref(new Set())


/**
 * entity list
 */
const entity_list: Ref<string[]> = ref([])

/**
 * dictionary: { [outlet]: Article[ ].length }
 */
const outlet_article_num_dict = ref({})
vue.provide("outlet_article_num_dict", outlet_article_num_dict)

//
// preprocessed global data used across components
//



/**
 * Flag for segment mode. \
 * Display segmentation on all scatters when segment mode is on.
 */
const segment_mode: Ref<boolean> = ref(false)

/**
 * threshold for filtering on count(articles).
 */
const article_num_threshold: Ref<number> = ref(20)

/**
 * Array of highlighted outlet names.
 * referenced in Temporal View of outlets.
 */
const highlight_outlet: Ref<string[]> = ref([])


/**
 * flag for tutorial mode.
 */
const tutorial_mode: Ref<boolean> = ref(false)
/**
 * tutorial step: start from 0.
 */
const tutorial_step: Ref<number> = ref(0)
vue.provide('tutorial_mode', tutorial_mode)
vue.provide('tutorial_step', tutorial_step)

/**
 * Array of displaying text in each step. \
 * Referenced by tutorial_step. \
 * Each item can be embedded html. \
 * Raw data stored in src/assets/tutorial_intro.json. 
 */
const tutorial_intro: Ref<string[]> = ref(tutorial_intro_json.map(step => _.sum(step.content)))

/**
 * Array of highlighted node titles. \
 * Used in search feature.
 */
const highlight_nodes: Ref<string[]> = ref([])

function updateThreshold(new_value) {
  setSegmentation(new_value)
}

/**
 * Array of selected articles. \
 * Used in ArticleView.
 */
// const selected_articles: Ref<typeUtils.Article[]> = ref([])
// const selected_entity: Ref<typeUtils.EntityInfo|undefined> = ref(undefined)
const selected_entity = vue.computed(() => store.state.selected_entity) 
const setEntity = (entity) => store.commit("setEntity", entity) 
const selected_cooccurr_entity: Ref<typeUtils.CooccurrEntityInfo|undefined> = ref(undefined)
const overall_selected_hexview: Ref<typeUtils.CooccurrHexView | undefined> = ref(undefined)

/**
 * dict of outlet weight. \
 * { [id: string]: number }
 */
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict) 
const resetOutletWeight = (outlet_weight_dict) => store.commit("resetOutletWeight", outlet_weight_dict) 
const setOutletWeight = (outlet, weight) => store.commit("setOutletWeight", outlet, weight) 
/**
 * segmentation threshold of sentiment value.
 */
const segment_sst: Ref<typeUtils.Sentiment2D> = vue.computed(() => store.state.segmentation)
const setSegmentation = (segmentation) => store.commit("setSegmentation", segmentation) 

vue.provide('segment_sst', {segment_sst, updateThreshold})


vue.watch(overview_constructed, (new_value, old_value) => {
  if(tutorial_mode.value) {
    tutorial.updateOverviewGrid()
  }
})


vue.watch(tutorial_mode, (new_value, old_value) => {
  if(old_value === true && new_value === false) {
    tutorial.handleSkipTutorial()
  }
})


// prepare for tutorial
vue.onMounted(async() => {
  tutorial.prepareComponentsForTutorial({tutorial_mode, tutorial_step})
  const promiseArray: any[] = []
  promiseArray.push(new Promise((resolve) => {
      fetch(`${server_address}/overview/scatter/overall/data`)
      .then(res => res.json())
      .then(json => {
        overview_overall_scatter_data.value = json
        overall_scatter_view.value = {
          title: "Overall",
          data: overview_overall_scatter_data.value 
        }
        console.log("overall scatter fetched")
        overall_scatter_view.value.data.nodes.forEach(node => {
          overall_entity_dict.value[node.text] = node
        })
        overall_scatter_data_loading.value = false
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
    fetch(`${server_address}/overview/scatter/grouped/data`)
    .then(res => res.json())
    .then(json => {
      overview_grouped_scatter_data.value = json
      console.log("grouped scatter fetched")
      resolve("success")
    })
  }))
  promiseArray.push(new Promise((resolve) => {
      fetch(`${server_address}/overview/scatter/overall/metadata`)
      .then(res => res.json())
      .then(json => {
        overview_overall_scatter_metadata.value = json
        console.log("overall scatter metadata fetched")
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
      fetch(`${server_address}/overview/scatter/grouped/metadata`)
      .then(res => res.json())
      .then(json => {
        overview_grouped_scatter_metadata.value = json
        console.log("grouped scatter metadata fetched")
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
    fetch(`${server_address}/processed_data/outlet_article_num_dict`)
    .then(res => res.json())
    .then(json => {
      outlet_article_num_dict.value = json
      console.log("outlet article num dict fetched")
      resolve("success")
    })
  }))
  promiseArray.push(new Promise((resolve) => {
    fetch(`${server_address}/processed_data/entity_list`)
    .then(res => res.json())
    .then(json => {
      entity_list.value = json
      console.log("entity_list fetched")
      resolve("success")
    })
  }))
  promiseArray.push(new Promise((resolve) => {
    fetch(`${server_address}/processed_data/outlet_set`)
    .then(res => res.json())
    .then(json => {
      enabled_outlet_set.value = json
      const tmp_weight_dict = {}
      enabled_outlet_set.value.forEach(outlet => {
        tmp_weight_dict[outlet] = 1
      })
      resetOutletWeight(tmp_weight_dict)
      console.log("outlet_set fetched")
      resolve("success")
    })
  }))
  if(selected_entity.value) {
    promiseArray.push(new Promise((resolve) => {
      fetch(`${server_address}/hexview/overall/${selected_entity.value.name}`)
      .then(res => res.json())
      .then(json => {
        const cooccurrences = json
        const hex_view: typeUtils.CooccurrHexView = {
          title: `co-${selected_entity.value.name}`,
          data: cooccurrences,
        }
        overall_selected_hexview.value = hex_view
        resolve("success")
      })
    }))

  }
  await Promise.all(promiseArray)
    .then(res => {
      overview_constructed.value = true
    })
})

// tutorial setups
vue.watch(tutorial_step, (new_value, old_value) => {
  tutorial.handleNextStep({tutorial_mode, tutorial_step}) 
})

// handlers
  // send data
async function handleEntityClicked({title, d}: {title: string, d: typeUtils.ScatterNode}) {
    const entity = d.text.split("-")[0]
    const outlet = d.text.split("-")[1]
    const overall_flag = title === "Overall"
    const path_overall_or_grouped = (overall_flag? "overall":"grouped")
    const metadata = overview_overall_scatter_metadata.value
    const store_entity: typeUtils.EntityInfo = {
      name: d.text,
      outlet: "Overall",
      num_of_mentions:d.article_ids.length,
      sst_ratio: {
        pos_artcs: d.pos_article_ids.length,
        neg_artcs: d.neg_article_ids.length,
        pos: d.pos_sst,
        neg: d.neg_sst,
        pos_max: metadata.pos_max,
        pos_min: metadata.pos_min,
        neg_max: metadata.neg_max,
        neg_min: metadata.neg_min,
      },
      articles_topic_dict: d.topicBins
    }
    setEntity(store_entity)
    selected_cooccurr_entity.value = undefined

    await fetch(`${server_address}/hexview/${path_overall_or_grouped}/${d.text}`)
      .then(res => res.json())
      .then(json => {
        const hex_view: typeUtils.CooccurrHexView = {
          title: `co-${d.text}`,
          data: json,
        }
        overall_selected_hexview.value = hex_view
        console.log("cooccurr hex fetched")
      })
    return

}

function highlightChanged(new_value) {
  highlight_outlet.value = new_value
}

function handleSearch(item) {
  highlight_nodes.value.push(item)
}

function handleUpdateOutletWeight({outlet, value}) {
  setOutletWeight(outlet, value)
  updateOverallEntityNode({outlet, value})
}

async function updateOverallEntityNode({outlet, value}) {
  overall_scatter_data_loading.value = true
  await fetch(`${server_address}/processed_data/updateOutletWeight`,{
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(outlet_weight_dict.value)
  })
    .then(res => res.json())
    .then(json => {
      console.log("update outlet weight done")
      overall_scatter_view.value!.data = json
      overall_scatter_view.value?.data.nodes.forEach(node => {
        overall_entity_dict.value[node.text] = node
      })
      console.log(overall_entity_dict.value)
      overall_scatter_data_loading.value = false
    })
}


async function fetch_topic_bins(target, callback) {
  await fetch(`${server_address}/processed_data/topic_bins/${target}`)
    .then(res => res.json())
    .then(callback)
}


async function handleHexClicked({target, co_occurr_entity}: {target: string, co_occurr_entity: string}) {
  await fetch(`${server_address}/processed_data/cooccurr_info/${target}/${co_occurr_entity}`)
    .then(res => res.json())
    .then(json => {
      console.log("cooccurr_info fetched", json)
      const overall_flag = target.split("-")[1] === undefined
      const outlet = overall_flag? "Overall": target.split("-")[1] 
      selected_cooccurr_entity.value = {
        target: json.target,
        name: json.cooccurr_entity,
        outlet: outlet,
        num_of_mentions: json.cooccurr_num,
        target_num_of_mentions: json.target_num_of_mentions,
        articles_topic_dict: json.articles_topic_dict
      }
    })
}

function handleUpdateWeightEnded() {
  overall_co_hexview.value.updateHexColor(overall_entity_dict.value)
}

function updateSegmentation(){

}



</script>


<template>
  <main>
    <div class="overview-container">
      <div class="overview-scatter-container">
           <!-- load icon -->
            <i v-if="overall_scatter_data_loading" class="pi pi-spin pi-spinner" 
            style="
            position:absolute;
            left: 45%;
            top: 30%;
            font-size: 3rem;
            z-index: 1000
            "></i> 
        <EntitySelection
            v-if="overall_scatter_view"
            :view="overall_scatter_view"
            id="overview-scatter"
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            :segmentation="segment_sst"
            :expanded="true"
            @update:segmentation="updateSegmentation"
            @node_clicked="handleEntityClicked"
            @update-weight-ended="$emit('update-weight-ended')"
        ></EntitySelection>
    </div>
    <div class="overview-hex-container"  v-if="overview_constructed">
            <!-- load icon -->
            <i v-if="!overview_constructed" class="pi pi-spin pi-spinner" 
            style="
            position:absolute;
            left: 45%;
            top: 30%;
            font-size: 3rem;
            z-index: 1000
            "></i> 
        <HexCooccurrence
            ref="overall_co_hexview"
            v-if="overall_selected_hexview"
            class="overall-co-hexview"
            :title="overall_selected_hexview.title"
            :id="`overall-co-hex`"
            :entity_cooccurrences="overall_selected_hexview.data"
            :segmentation="segment_sst"
            :overall_entity_dict="overall_entity_dict"
            v-on:hex-clicked="handleHexClicked">
        </HexCooccurrence>
    </div>
    <!-- Utilities -->
    <div class="utilities-container">
        <!-- segment & search -->
        <div  class="toolbar-container">
            <div v-if="overview_constructed" class="segment-toggler-container">
                <ToggleButton class='segment-toggler p-primary' v-model="segment_mode" onLabel="Segment" offLabel="Segment"></ToggleButton>
            </div>
            <div v-if="overview_constructed" class="search-bar">
                <SearchBar :search_terms="entity_list" @entity_searched="handleSearch"></SearchBar>
            </div>
        </div>
        <!-- filter slider -->
        <div v-if="overview_constructed" class="slider-container">
            <InputText class="threshold-input" v-model="article_num_threshold"></InputText>
            <Button class="increment-button p-button-secondary" label="+"  @click="() => article_num_threshold=Math.min(article_num_threshold+=10, overview_grouped_scatter_metadata.max_articles||100)"></Button>
            <Button class="decrease-button p-button-secondary " label="-"  @click="() => article_num_threshold=Math.max(article_num_threshold-10, 0)"></Button>
            <Slider v-model="article_num_threshold" :step="10" :min="0" :max="overview_grouped_scatter_metadata.max_articles ||100"></Slider>
            <ColorSpectrum class="color-spectrum" v-if="overview_constructed" 
            :color-scale="SstColors.article_num_color_scale"
            ></ColorSpectrum>
            <div class="indicator-container">
            <div class="min_indicator">0</div>
            <div class="max_indicator">{{overview_grouped_scatter_metadata.max_articles || 100}}</div>
            </div>
        </div>
        <!-- outlet weight slider -->
        <OutletWeightSlider
            v-if="overview_constructed"
            :outlet_weight_dict="outlet_weight_dict"
            @update_outlet_weight="handleUpdateOutletWeight">
        </OutletWeightSlider>
        <!-- Legend -->
        <Legend v-if="overview_constructed" 
        id="segment_legend"
        class="segment-legend"
        :color_dict="SstColors.key_color_dict" 
        :filter="true" 
        :interactable="false">
        </Legend>
    </div>
    <!-- Entity Info -->
    <div class="entity-info-container">
        <div class="target-cooccurr-container">
            <EntityInfoView v-if="selected_entity"
                title="Target Entity"
                :entity_info="selected_entity"
                v-model:segmentation="segment_sst" >
            </EntityInfoView>
            <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider>
            <EntityInfoView v-if="selected_cooccurr_entity"
                title="Co-occurr Entity"
                :entity_info="selected_cooccurr_entity" >
            </EntityInfoView>
        </div>
        <div class="topic-bar-container">
            <TopicBars v-if="selected_entity"
                id="cooccurr_topic_bars"
                :targetTopicBins="selected_entity?.articles_topic_dict"
                :cooccurrTopicBins="selected_cooccurr_entity?.articles_topic_dict" >
            </TopicBars>
        </div>
    </div>
    <!-- Next Stage -->
    <router-link v-if="selected_entity" :to="{ name: 'compare', params: { entity: selected_entity.name }}">Next Stage</router-link>
    <Tooltip v-if="tutorial_mode" class="tutorial_tooltip" :content="tutorial_intro[tutorial_step]"></Tooltip>
    "<span v-if="tutorial_mode" class="skip-button" 
    style='text-decoration:underline;'
    @click="tutorial_mode=false">Skip</span>", 
  </div>
</main>
</template>

<style scoped lang="scss">
* {
  --margin_left: 10px;
}
.overview-scatter-container {
    width: 800px;
    height: 600px;
}
 </style>

