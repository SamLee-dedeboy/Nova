<script setup lang="ts">
/**
 * primevue comopnents
 */
import Slider from "primevue/slider"
import InputText from "primevue/inputtext"
import SelectButton from 'primevue/selectbutton';
import ToggleButton from 'primevue/togglebutton';
import Divider from 'primevue/divider';
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"

/**
 * libraries
 */
import { watch, computed, onMounted, PropType, ref, Ref, nextTick, } from 'vue'
import * as vue from 'vue'
import * as _ from "lodash"
import { useStore } from 'vuex'

/**
 * types & utils
 */
import * as typeUtils from "../types"
import * as SstColors from "../components/utils/ColorUtils"
import tutorial_intro_json from "../assets/tutorial/tutorial_intro.json"
import * as tutorial from "../components/utils/TutorialUtils"

/**
 * vue components
 */
import OutletWeightSlider from "../components/OutletWeightSlider.vue";
import Legend from "../components/Legend.vue";
import Tooltip from "../components/Tooltip.vue";
import SearchBar from "../components/SearchBar.vue";
import EntityInfoView from "../components/EntityInfoView.vue"
import HexCooccurrence from "../components/HexCooccurrence.vue";
import TopicBars from "../components/TopicBars.vue"
import EntitySelection from "../components/entitySelection.vue"
import ThresholdController from "../components/ThresholdController.vue";
import HorizontalTopicBars from "../components/HorizontalTopicBars.vue";


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
  if (!overview_grouped_scatter_data.value) return undefined
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
const segment_mode: Ref<boolean> = ref(true)
const segment_options = [
  {status: 'On', value: true},
  {status: 'Off', value: false}
]

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

/**
 * layout constants in percentage
 */
const left_section_panel_size = 30
const right_section_panel_size = vue.computed(() => 100 - left_section_panel_size)

const entity_scatter_panel_size = 50 
const utilities_panel_size = vue.computed(() => 100 - entity_scatter_panel_size)

const entity_info_panel_size = 2.8
const hex_view_panel_size = vue.computed(() => 100 - entity_info_panel_size)


/**
 * Array of selected articles. \
 * Used in ArticleView.
 */
// const selected_articles: Ref<typeUtils.Article[]> = ref([])
// const selected_entity: Ref<typeUtils.EntityInfo|undefined> = ref(undefined)
const selected_entity = vue.computed(() => store.state.selected_entity)
const setEntity = (entity) => store.commit("setEntity", entity)
const selected_cooccurr_entity = vue.computed(() => store.state.selected_cooccurr_entity)
const setCooccurrEntity = (cooccurr_entity) => store.commit("setCooccurrEntity", cooccurr_entity) 
const overall_selected_hexview: Ref<typeUtils.CooccurrHexView | undefined> = ref(undefined)
const constraint_dict = vue.computed(() => store.state.constraints)

/**
 * dict of outlet weight. \
 * { [id: string]: number }
 */
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)
const resetOutletWeight = (outlet_weight_dict) => store.commit("resetOutletWeight", outlet_weight_dict)
const setOutletWeight = ({ outlet, weight }) => store.commit("setOutletWeight", { outlet, weight })
/**
 * segmentation threshold of sentiment value.
 */
const segmentation = vue.computed(() => store.state.segmentation)
const setSegmentation = (segmentation) => store.commit("setSegmentation", segmentation)



vue.watch(overview_constructed, (new_value, old_value) => {
  if (tutorial_mode.value) {
    tutorial.updateOverviewGrid()
  }
})


vue.watch(tutorial_mode, (new_value, old_value) => {
  if (old_value === true && new_value === false) {
    tutorial.handleSkipTutorial()
  }
})


// prepare for tutorial
vue.onMounted(async () => {
  tutorial.prepareComponentsForTutorial({ tutorial_mode, tutorial_step })
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
  if (selected_entity.value) {
    promiseArray.push(new Promise((resolve) => {
      fetch(`${server_address}/hexview/overall/${selected_entity.value.name}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(outlet_weight_dict.value)
      })
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
    handleEntityClicked(selected_entity.value.name)

  }
  await Promise.all(promiseArray)
    .then(res => {
      overview_constructed.value = true
    })
})

// tutorial setups
vue.watch(tutorial_step, (new_value, old_value) => {
  tutorial.handleNextStep({ tutorial_mode, tutorial_step })
})

// handlers
// send data
async function handleEntityClicked(entity: string) {
  const metadata = overview_overall_scatter_metadata.value
  setCooccurrEntity(undefined)
  const promiseArray: any[] = []
  promiseArray.push(new Promise((resolve) => {
    fetch(`${server_address}/overview/scatter/overall/node/${entity}`)
      .then(res => res.json())
      .then(json => {
        const store_entity: typeUtils.EntityInfo = {
          name: entity,
          outlet: "Overall",
          num_of_mentions: json.article_ids.length,
          sst_ratio: {
            pos_artcs: json.pos_article_ids.length,
            neg_artcs: json.neg_article_ids.length,
            pos: json.pos_sst,
            neg: json.neg_sst,
            pos_max: metadata.pos_max,
            pos_min: metadata.pos_min,
            neg_max: metadata.neg_max,
            neg_min: metadata.neg_min,
          },
          articles_topic_dict: json.topicBins
        }
        setEntity(store_entity)
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
      fetch(`${server_address}/hexview/overall/${entity}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(outlet_weight_dict.value)
      })
        .then(res => res.json())
        .then(json => {
          const cooccurrences = json
          const hex_view: typeUtils.CooccurrHexView = {
            title: `co-${entity}`,
            data: cooccurrences,
          }
          overall_selected_hexview.value = hex_view
          console.log("cooccurr hex fetched")
          resolve("success")
        })
  }))
  await Promise.all(promiseArray)
    .then(res => {
      // do nothing
    })
}

function highlightChanged(new_value) {
  highlight_outlet.value = new_value
}

function handleSearch(item) {
  highlight_nodes.value.push(item)
}

function handleUpdateOutletWeight({ outlet, value }) {
  console.log(outlet_weight_dict.value)
  setOutletWeight({ outlet: outlet, weight: value })
  updateOverallEntityNode({ outlet, value })
  updateHexViewData()
}

async function updateOverallEntityNode({ outlet, value }) {
  overall_scatter_data_loading.value = true
  await fetch(`${server_address}/processed_data/updateOutletWeight`, {
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
      // console.log(overall_entity_dict.value)
      overall_scatter_data_loading.value = false
    })
}

async function updateHexViewData() {
    await fetch(`${server_address}/hexview/overall/${selected_entity.value.name}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(outlet_weight_dict.value)
    })
      .then(res => res.json())
      .then(json => {
        const cooccurrences = json
        const hex_view: typeUtils.CooccurrHexView = {
          title: `co-${selected_entity.value.name}`,
          data: cooccurrences,
        }
        overall_selected_hexview.value = hex_view
      })
}

async function fetch_topic_bins(target, callback) {
  await fetch(`${server_address}/processed_data/topic_bins/${target}`)
    .then(res => res.json())
    .then(callback)
}


async function handleHexClicked({ target, co_occurr_entity }: { target: string, co_occurr_entity: string }) {
  await fetch(`${server_address}/processed_data/cooccurr_info/overall/${target}/${co_occurr_entity}`)
    .then(res => res.json())
    .then(json => {
      console.log("cooccurr_info fetched", json)
      const overall_flag = target.split("-")[1] === undefined
      const outlet = overall_flag ? "Overall" : target.split("-")[1]
      const co_occurr_entity = {
        target: json.target,
        name: json.cooccurr_entity,
        outlet: outlet,
        num_of_mentions: json.cooccurr_num,
        target_num_of_mentions: json.target_num_of_mentions,
        articles_topic_dict: json.articles_topic_dict
      }
      setCooccurrEntity(co_occurr_entity)
    })
}

function handleUpdateWeightEnded() {
  overall_co_hexview.value.updateHexColor(overall_entity_dict.value)
}

function updateSegmentation({ pos, neg }) {
  setSegmentation({ pos, neg })
}



</script>


<template>
  <main>
    <Splitter class="overview-container">
      <SplitterPanel class="left-section-panel" :size="left_section_panel_size">
        <Splitter layout="vertical">
          <SplitterPanel class="entity-scatter-panel" :size="entity_scatter_panel_size">
            <h2 class="component-header scatter-header"> 
              Topic Scatterplot 
              <i class='pi pi-info-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 200px;">
                   Each circle is a topic with 2-d sentiment score (pos, neg). <br/>
                   The scores are determined by how many positive and negatives articles they have.
                </span>
              </i>
            </h2>

            <div class="overview-scatter-container">
              <!-- load icon -->
              <i v-if="overall_scatter_data_loading" class="pi pi-spin pi-spinner" style="
                position:absolute;
                left: 45%;
                top: 30%;
                font-size: 3rem;
                z-index: 1000
                "></i>
              <EntitySelection v-if="overall_scatter_view" :view="overall_scatter_view" id="overview-scatter"
                :article_num_threshold="article_num_threshold" :segment_mode="segment_mode" :segmentation="segmentation"
                @update:segmentation="updateSegmentation" @node_clicked="handleEntityClicked"
                @update-weight-ended="$emit('update-weight-ended')"></EntitySelection>
            </div>
          </SplitterPanel>
          <SplitterPanel class="utilities-panel" :size="utilities_panel_size">
            <!-- Utilities -->
            <div class="utilities-container">
              <div id="segment-utility-container" class="segment-utils">
                <h2 class="component-header util-header"> 
                  Segment 
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px;">
                      The sentiments have four categories as listed. <br/>
                      A mixed sentiment means the topic has lots of positive and negative articles at the same time. 
                    </span>
                  </i>
                </h2>
                <!-- segment & search -->
                <div class="toolbar-container">
                  <div v-if="overview_constructed" class="segment-toggler-container">
                    <SelectButton v-model="segment_mode" optionValue="value" optionLabel="status" :options="segment_options"/>
                    <!-- <ToggleButton class='segment-toggler p-primary' v-model="segment_mode" onLabel="Segment"
                      offLabel="Segment"></ToggleButton> -->
                  </div>
                </div>
                  <!-- Legend -->
                <div class="legend-utils">
                  <Legend v-if="overview_constructed" id="segment_legend" class="segment-legend"
                  :color_dict="SstColors.key_color_dict"></Legend>
                </div>
              </div>

              <div id="entity-utility-container" class="entity-utils">
                <h2 class="component-header util-header"> 
                  Topics Controller
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px">
                      The color spectrum slider helps filter out unimportant topics by number or articles. <br/>
                      The six-sliders group lets you control the weights of each media outlet.
                    </span>
                  </i>
                </h2>
                <!-- Entity Search -->
                <!-- <div id="entity-search" v-if="overview_constructed" class="search-bar">
                    <SearchBar :search_terms="entity_list" @entity_searched="handleSearch"/>
                </div> -->
                <!-- filter slider -->
                <div v-if="overview_constructed" class="slider-container">
                  <ThresholdController v-model:article_num_threshold="article_num_threshold"
                    :max_articles="overview_overall_scatter_metadata.max_articles"
                    :min_articles="overview_overall_scatter_metadata.min_articles"></ThresholdController>
                </div>
                <!-- outlet weight slider -->
                <OutletWeightSlider v-if="overview_constructed" :outlet_weight_dict="outlet_weight_dict"
                  @update_outlet_weight="handleUpdateOutletWeight">
                </OutletWeightSlider>
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
      <SplitterPanel class="right-section-panel" :size="right_section_panel_size">
        <Splitter layout="vertical">
          <SplitterPanel class="overview-hex-panel" :size="hex_view_panel_size">
            <div class="reminder-click-entity" v-if="!selected_entity && overview_constructed"> Click any circle in Topic Scatterplot </div>
            <!-- Hex view -->
            <h2 class="component-header hexview-header" v-if="selected_entity">
              Topic Co-occurrences
              <i class='pi pi-info-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 400px">
                  Shows most-frequently co-occurring topics with the main topic ({{ selected_entity.name }}). <br/>
                  Each co-occurring topic is categorized by the region segmentation in the Topic Scatterplot. 
                </span>
              </i>
            </h2>
            <div class="overview-hex-container" v-if="overview_constructed">
              <!-- load icon -->
              <i v-if="!overview_constructed" class="pi pi-spin pi-spinner" style="
                    position:absolute;
                    left: 45%;
                    top: 30%;
                    font-size: 3rem;
                    z-index: 1000
                    "></i>
              <HexCooccurrence ref="overall_co_hexview" v-if="overall_selected_hexview" class="overall-co-hexview"
                :title="overall_selected_hexview.title" :id="`overall-co-hex`"
                :entity_cooccurrences="overall_selected_hexview.data" :segmentation="segmentation"
                :overall_entity_dict="overall_entity_dict" v-on:hex-clicked="handleHexClicked">
              </HexCooccurrence>
            </div>
          </SplitterPanel>
          <SplitterPanel class="entity-info-panel" :size="entity_info_panel_size">
            <!-- Entity Info -->
            <div class="entity-info-container">
              <div class="target-cooccurr-container" v-if="selected_entity">
                <h2 class="component-header cooccurr-info-header">
                  Topic Info
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 250px">
                      Statistical detail about the main and co-occurred topic.
                    </span>
                  </i>
                </h2>
                <div class="cooccurr-info-content">
                  <div class="num_of_articles">
                    Number of articles about 
                    <span style="font-weight:bolder"> {{selected_entity.name}} </span>
                    <span v-if="selected_cooccurr_entity"> 
                      and 
                      <span style="font-weight:bolder">
                        {{selected_cooccurr_entity.name}}
                      </span> 
                    </span>
                    is {{ selected_cooccurr_entity? selected_cooccurr_entity.num_of_mentions : selected_entity.num_of_mentions }}
                  </div>
                  <Divider layout="vertical"></Divider>
                  <ul class="entity-info-section">
                    <li> Main topic: {{ selected_entity.name }} </li>
                    <li v-if='selected_cooccurr_entity'> Co-occur topic: {{ selected_cooccurr_entity.name }} </li>
                  </ul>
                </div>
                <!-- <EntityInfoView v-if="selected_entity?.outlet === 'Overall'" title="Target Entity"
                  :entity_info="selected_entity">
                </EntityInfoView>
                <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider>
                <EntityInfoView v-if="selected_cooccurr_entity" title="Co-occurr Entity"
                  :entity_info="selected_cooccurr_entity">
                </EntityInfoView> -->
              </div>
              <div class="topic-bar-container" v-if="selected_entity?.outlet === 'Overall'">
                <!-- <TopicBars v-if="selected_entity?.outlet === 'Overall'" id="cooccurr_topic_bars"
                  :targetTopicBins="selected_entity?.articles_topic_dict"
                  :cooccurrTopicBins="selected_cooccurr_entity?.articles_topic_dict">
                </TopicBars> -->
                <h2 class="component-header topic-bar-header">
                  Policy Bars
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px">
                      The articles about {{ selected_entity.name }} 
                      <span v-if="selected_cooccurr_entity">
                      and {{ selected_cooccurr_entity.name }}
                      </span>
                      categorized by related policies. <br/>
                    </span>
                  </i>
                  <br/>
                  <Legend id="policy_legend" class="policy-bar-legend" 
                  :color_dict="SstColors.topic_color_dict"
                  ></Legend>
                  <span style="font-size: small; width:max-content;"> 
                    <!-- Some explanation here a lot of explanation here more explanation here -->
                  </span>
                </h2>
                <HorizontalTopicBars  id="cooccurr_topic_bars"
                  :targetTopicBins="selected_entity?.articles_topic_dict"
                  :cooccurrTopicBins="selected_cooccurr_entity?.articles_topic_dict">
                </HorizontalTopicBars>
              </div>
              <!-- Next Stage -->
              <div class="navigate-container">
                <router-link v-if="selected_entity?.outlet === 'Overall'"
                  :to="{ name: 'compare', params: { entity: selected_entity.name }}">Next Stage</router-link>
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>
    <!-- Tooltip for tutorial -->
    <Tooltip v-if="tutorial_mode" class="tutorial_tooltip" :content="tutorial_intro[tutorial_step]"></Tooltip>
    <span v-if="tutorial_mode" class="skip-button" style='text-decoration:underline;'
      @click="tutorial_mode=false">Skip</span>
  </main>
</template>

<style scoped lang="scss">
* {
  --margin_left: 10px;
}

main {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 99vw;
  height: 98vh;
}

// ---------------------
// css for split-panel layout
// ---------------------
.overview-scatter-container,
.overview-hex-container,
.overall-co-hexview {
  width: 100%;
  height: 95%;
}

:deep(.p-splitter) {
  width: inherit;
  height: inherit;
}

:deep(.p-splitter-panel) {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

// divider style 
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}

//
// general layouts
//


// ---------------------
// entity scatter section
// ---------------------

.left-section-panel,
.entity-scatter-panel {
  // This attribute is for node info to show 
  overflow: visible;
}



// ---------------------
// utitlies section
// ---------------------
:deep(.p-slider .p-slider-handle) {
  height: 0.8rem;
  width: 0.8rem;
}
:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
  margin-top: -0.4rem;
  margin-left: -0.4rem;
}

.legend-utils {
    margin-top: 5%;
}

.entity-utils{
  margin: 0.4%;
  padding: 2%;
  height: 100%;
  width: 62%;
  background: #f7f7f7;
}
.segment-utils{
  margin: 1%;
    padding: 2%;
    width: 33%;
    height: 100%;
    background: #f7f7f7;
}

.segment-toggler-container {
    width: 100%;
}

.scatter-header {
  background: #f7f7f7;
  margin:2%;
  padding:1%;
}

.toolbar-container {
  display: flex;
    height: max-content;
    width: 100%;
    margin-top: 5%;
    text-align: center;
}

.slider-container {
  width: 200px;
  height: max-content;
}

.utilities-container {
  display: flex;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 50px auto;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}
.utilities-panel {
  overflow: visible;
}

// ---------------------
// hexview section
// ---------------------
.reminder-click-entity {
  margin: 1.3% 1% 1% 1%;
  font-family: Lato;
  font-size: x-large;
}
.hexview-header {
  background: #f7f7f7;
  margin:1%;
  padding:0.45%;
}


// ---------------------
// entity info section
// ---------------------

.entity-info-panel {
  overflow: visible;
}

.entity-info-section {
  padding-left: 2%;
}

.entity-info-container {
  display: flex;
  // height: 100%;
  justify-content: space-evenly;
}

.topic-bar-container {
  // height:217px;
  // width:100%;
  flex: 2 1 0;
  display: flex;
  background: #f7f7f7;
  margin: 0.2%;
}

.cooccurr-info-content {
  display: flex;
  height: 100%;
  width:100%;
  overflow-wrap: break-word;
}

.target-cooccurr-container {
  margin: 0.2%;
  padding: 0.75%;
  flex: 1 1 0;
  max-width: 35%;
  // height: inherit;
  // width: 35%;
  background: #f7f7f7;
}

.num_of_articles, .entity-info-section {
  width: 45%
}

.topic-bar-header {
  border-bottom: unset;
  border-right: solid 1px #b7b7b7;
  margin:1%;
  padding:1%;
  max-width: 27%;
}

.navigate-container {
  background: #f7f7f7;
}


</style>

