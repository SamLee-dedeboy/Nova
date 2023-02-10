<script setup lang="ts">
/**
 * primevue comopnents
 */
import Slider from "primevue/slider"
import InputText from "primevue/inputtext"
import SelectButton from 'primevue/selectbutton';
import ToggleButton from 'primevue/togglebutton';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"

/**
 * libraries
 */
import { watch, computed, onMounted, PropType, ref, Ref, nextTick, } from 'vue'
import * as vue from 'vue'
import * as _ from "lodash"
import { useUserDataStore } from '../store/userStore'

/**
 * types & utils
 */
import * as typeUtils from "../types"
import * as SstColors from "../components/utils/ColorUtils"

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
import EntityTable from "../components/entityTable.vue";

const store = useUserDataStore()



//
// refs
//
const overview_scatter = ref(null)

//
// raw data
//
const server_address = "http://127.0.0.1:5000"

// overview data 
// const overview_overall_scatter_data: Ref<any> = ref({})
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
const hex_constructed: Ref<boolean> = ref(true)
const overall_co_hexview: Ref<any> = ref(null)
const highlight_hex_entity: Ref<string> = ref("")
const showTutorial: Ref<boolean> = ref(true)
//
// processed data 
//


// outlet related data
/**
 * set of outlet names extracted from dataset.
 */
const enabled_outlet_set: Ref<Set<string>> = ref(new Set())
const outlet_leaning: Ref<Any> = ref({})


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
  { status: 'On', value: true },
  { status: 'Off', value: false }
]

/**
 * threshold for filtering on count(articles).
 */
const article_num_threshold: Ref<number> = ref(20)
// const article_num_threshold_global: Ref<number> = vue.computed(() => store.article_num_threshold_global)
const setArticleNumThreshold = (threshold) => store.setArticleNumThreshold(threshold)
vue.watch(article_num_threshold, () => {
  setArticleNumThreshold(article_num_threshold.value)
})

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
 * Array of highlighted node titles. \
 * Used in search feature.
 */
const highlight_nodes: Ref<string[]> = ref([])

/**
 * layout constants in percentage
 */
const left_section_panel_size = 63
const right_section_panel_size = vue.computed(() => 100 - left_section_panel_size)

const entity_scatter_panel_size = 100
const utilities_panel_size = vue.computed(() => 100 - entity_scatter_panel_size)

const table_panel_size = 20
const scatter_panel_size = vue.computed(() => 100 - table_panel_size)

const entity_info_panel_size = 31
const hex_view_panel_size = vue.computed(() => 100 - entity_info_panel_size)


/**
 * Array of selected articles. 
 * Used in ArticleView.
 */
// const selected_articles: Ref<typeUtils.Article[]> = ref([])
// const selected_entity: Ref<typeUtils.EntityInfo|undefined> = ref(undefined)
const selected_entity = vue.computed(() => store.selected_entity)
const setEntity = (entity) => store.setEntity(entity)
const selected_entity_name: Ref<String> = ref("")
vue.watch(selected_entity_name, (new_value, old_value) => {
  handleEntityClicked(selected_entity_name.value)
})
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity)
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const overall_selected_hexview: Ref<typeUtils.CooccurrHexView | undefined> = ref(undefined)
const constraint_dict = vue.computed(() => store.constraints)

const overall_entity_data = vue.computed(() => overall_scatter_view.value?.data?.nodes)

// const left_most_outlet = vue.inject("left_most_outlet")
// const right_most_outlet = vue.inject("right_most_outlet")
const random_outlet = vue.inject("random_outlet")

/**
 * segmentation threshold of sentiment value.
 */
const segmentation = vue.computed(() => store.segmentation)
const setSegmentation = (segmentation) => store.setSegmentation(segmentation)

// prepare for tutorial
vue.onMounted(async () => {
  const promiseArray: any[] = []
  promiseArray.push(new Promise((resolve) => {
    fetch(`${server_address}/overview/scatter/overall/data`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({article_num_threshold: article_num_threshold.value})
    })
      .then(res => res.json())
      .then(json => {
        // overview_overall_scatter_data.value = json
        overall_scatter_view.value = {
          title: "Overall",
          data: json
        }
        overview_overall_scatter_metadata.value = {
          max_articles: json.max_articles,
          min_articles: json.min_articles
        }
        console.log({json})
        console.log("overall data fetched")

        // create dict of nodes for hex view
        overall_scatter_view.value.data.nodes.forEach(node => {
          overall_entity_dict.value[node.text] = node
        })

        // turn flags
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
  // promiseArray.push(new Promise((resolve) => {
  //   fetch(`${server_address}/overview/scatter/overall/metadata`)
  //     .then(res => res.json())
  //     .then(json => {
  //       overview_overall_scatter_metadata.value = json
  //       console.log("overall scatter metadata fetched")
  //       resolve("success")
  //     })
  // }))
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
        // update outlet leaning dict
        enabled_outlet_set.value.forEach(outlet => {
            outlet_leaning.value[outlet] = 1
        });
        console.log("outlet_set fetched", outlet_leaning.value)
        resolve("success")
      })
  }))
  if (selected_entity.value) {
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
          console.log("overall hexview fetched")
          resolve("success")
        })
    }))
    handleEntityClicked(selected_entity.value.name)

  }
  await Promise.all(promiseArray)
    .then(res => {
      overview_constructed.value = true
      console.log("all fetched")
    })
})


// handlers
async function handleEntityClicked(entity: string) {
  console.log("Enity Selection", entity)
  const metadata = overview_overall_scatter_metadata.value

  legendInput.value = {}
  legendInput.value[entity] = "white";
  legendInput.value["Co-Occuring Topic"] = "#4baaf5";

  // clear co-occur entity selection in hex
  setCooccurrEntity(undefined)
  const promiseArray: any[] = []
  promiseArray.push(new Promise((resolve) => {
    fetch(`${server_address}/overview/scatter/overall/node/${entity}`)
      .then(res => res.json())
      .then(json => {
        // console.log({json})
        const store_entity  = {
          name: entity,
          outlet: "Overall",
          article_ids: json.article_ids 
        }
        setEntity(store_entity)
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
    hex_constructed.value = false
    fetch(`${server_address}/hexview/overall/${entity}`)
      .then(res => res.json())
      .then(json => {
        const cooccurrences = json
        const hex_view: typeUtils.CooccurrHexView = {
          title: `co-${entity}`,
          data: cooccurrences,
        }
        overall_selected_hexview.value = hex_view
        hex_constructed.value = true
        console.log("cooccurr hex fetched", cooccurrences)
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

async function fetch_topic_bins(target, callback) {
  await fetch(`${server_address}/processed_data/topic_bins/${target}`)
    .then(res => res.json())
    .then(callback)
}

let legendInput = ref({});
legendInput.value["main"] = "white";
legendInput.value["co-occur"] = "#4baaf5";

async function handleHexClicked({ target, co_occurr_entity }: { target: string, co_occurr_entity: string }) {

  highlight_hex_entity.value = co_occurr_entity
  let mainTopic = target;
  let coOccurTopic = target + " & " + co_occurr_entity;

  legendInput.value = {}

  legendInput.value[mainTopic] = "white";
  legendInput.value[coOccurTopic] = "#4baaf5";


  await fetch(`${server_address}/processed_data/cooccurr_info/overall/${target}/${co_occurr_entity}`)
    .then(res => res.json())
    .then(json => {
      console.log("cooccurr_info fetched", json)
      const overall_flag = target.split("-")[1] === undefined
      const outlet = overall_flag ? "Overall" : target.split("-")[1]
      const co_occurr_entity: typeUtils.CooccurrEntityInfo = {
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

function updateSegmentation({ pos, neg }) {
  setSegmentation({ pos, neg })
}

function toggleTutorial(e: MouseEvent) {
  showTutorial.value = false
}


</script>


<template>
  <main>
    <div v-if="selected_entity" class="navigate-container">
      <!-- <router-link class="goNext"
        :to="{ name: 'compare', params: { entity: selected_entity.name } }">
        After finding a topic, <span class="clickNext">click here</span> to assess how each outlet covered it.
        <p class="next"><i class="pi pi-arrow-right " /></p>
      </router-link> -->
      <router-link class="goNext"
        :to="{ name: 'belief', params: { order: 'first', outlet: random_outlet[0], entity: selected_entity.name } }">
        After finding a topic, <span class="clickNext">click here</span> to assess how each outlet covered it.
        <p class="next"><i class="pi pi-arrow-right " /></p>
      </router-link>
    </div>

    <Dialog v-model:visible="showTutorial" class="tutorialStyle" position="right" :modal="true">
      <template #header>
        <h3> <i class="pi pi-compass" /> U.S. News Media Coverage Assessment</h3>
      </template>

      <p class="introTutorial">
        This application's purpose is to help you assess if your expectations of how fair mainstream news media cover
        topics align with their reporting.
        We gathered articles centered around COVID-19 from 6 U.S. mainstream media outlets.
        To demonstrate the system, let's see how these outlets covered the start of the COVID-19 Pandemic (Feb-June
        2020).
      </p>
      <p class="tutorialInstructions">
        Before we begin, please adjust the sliders below for how fair you believe each of corresponding outlets are.
        The scale is from 0 to 1, where 1 is fair. If you believe they are all fair you may leave them as is.
      </p>
      <div class="fairnessLegend">
        <i class="pi pi-arrow-left" /> Unfair
        Fair <i class="pi pi-arrow-right" />
      </div>

      <div class="initialWeights">
        <OutletWeightSlider v-if="overview_constructed" :outlet_leaning="outlet_leaning"
          @update_outlet_weight="handleUpdateOutletWeight" fontSize="0.65em">
        </OutletWeightSlider>
      </div>
      <template #footer>
        <Button label="Ready" icon="pi pi-check" @click="toggleTutorial" autofocus />
      </template>
    </Dialog>

    <Splitter class="overview-container">
      <SplitterPanel class="left-section-panel" :size="left_section_panel_size">
        <Splitter layout="vertical">
          <SplitterPanel class="entity-scatter-panel" :size="entity_scatter_panel_size">
            <!-- left section header -->
            <h2 class="component-header scatter-header">
              COVID-19 News Topics
              <i class='pi pi-info-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 200px;">
                  Each point is a topic with 2D sentiment score (pos, neg). <br />
                  The score represents how many positive and negatives articles they have.
                </span>
              </i>
            </h2>
            <div class='entity-scatter-content'>
              <Splitter class='table-scatter-splitter'>
                <SplitterPanel class="entity-table-panel" :size="table_panel_size">
                  <div id="entityTableWrapper" class='entityTableWrapper'>
                    <EntityTable v-if="overall_entity_data" :entity_nodes="overall_entity_data" :article_num_threshold="article_num_threshold" 
                      v-model:selected_entity_name='selected_entity_name'
                    />
                  </div>
                </SplitterPanel>
                <SplitterPanel class='entity-scatter-panel'>
                  <div class="overview-scatter-container">
                    <!-- load icon -->
                    <i v-if="overall_scatter_data_loading" class="pi pi-spin pi-spinner" style="position:absolute;
                        left: 45%;
                        top: 30%;
                        font-size: 3rem;
                        z-index: 1000">
                    </i>
                    <EntitySelection v-if="overall_scatter_view" :view="overall_scatter_view" id="overview-scatter"
                      ref='overview_scatter'
                      :article_num_threshold="article_num_threshold" :segment_mode="segment_mode" :segmentation="segmentation"
                      v-model:selected_entity_name='selected_entity_name'
                      @update:segmentation="updateSegmentation" />
                  </div>
                      <!-- @node_clicked="handleEntityClicked" -->
                </SplitterPanel>
              </Splitter>
            </div>
            <!-- overview scatter -->
          </SplitterPanel>
          <!-- overview table -->
        
        </Splitter>
      </SplitterPanel>
      <SplitterPanel class="right-section-panel" :size="right_section_panel_size">
        <Splitter layout="vertical">
          <SplitterPanel class="overview-hex-panel" :size="hex_view_panel_size">
            <div class="reminder-click-entity" v-if="!selected_entity && overview_constructed"> Click on one of the news
              topic points. </div>
            <!-- Hex view -->
            <h2 class="component-header hexview-header" v-if="selected_entity">
              Topic Co-occurrence Hive for
              <span class="mainTopicStyle"> {{ selected_entity.name.replaceAll("_", " ") }} </span>
              &nbsp
              <i class='pi pi-info-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 400px">
                  Shows most-frequently co-occurring topics with the main topic ({{
                      selected_entity.name.replaceAll("_", " ")
                  }}). <br />
                  Each co-occurring topic is categorized by the region segmentation in the Topic Scatterplot.
                </span>
              </i>
            </h2>
            <div class="overview-hex-container" v-if="overview_constructed">
              <!-- load icon -->
              <i v-if="!hex_constructed" class="pi pi-spin pi-spinner" style="position:absolute;
                    left: 45%;
                    top: 30%;
                    font-size: 3rem;
                    z-index: 1000
                    "></i>
              <HexCooccurrence ref="overall_co_hexview" v-if="overall_selected_hexview" class="overall-co-hexview"
                :title="overall_selected_hexview.title" :id="`overall-co-hex`"
                :entity_cooccurrences="overall_selected_hexview.data" :segmentation="segmentation"
                :highlight_hex_entity="highlight_hex_entity" :show_blink="true"
                :overall_entity_dict="overall_entity_dict" v-on:hex-clicked="handleHexClicked">
              </HexCooccurrence>
            </div>
          </SplitterPanel>
          <SplitterPanel class="utilities-panel" :size="entity_info_panel_size">
            <!-- Utilities -->
            <div class="utilities-container">
              <div id="entity-utility-container" class="entity-utils">
                <h2 class="component-header util-header">
                  Topic Settings
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px">
                      The color spectrum slider helps filter topics by number or articles. <br />
                      The six-sliders group lets you input your preception of each media outlet based on fairness and
                      importance.
                    </span>
                  </i>
                </h2>
                <!-- filter slider -->
                <h3 class="threshold-title"> Number of Articles Threshold
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px">
                      User the slider to set a threshold on topics' minimum articles.
                      Topics with less articles than the threshold will not appear in scatter plot.
                    </span>
                  </i>
                </h3>
                <div v-if="overview_constructed" class="slider-container">
                  <ThresholdController v-model:article_num_threshold="article_num_threshold"
                    :max_articles="overview_overall_scatter_metadata.max_articles"
                    :min_articles="overview_overall_scatter_metadata.min_articles"></ThresholdController>
                </div>
                <!-- outlet weight slider -->
                <h3 class="threshold-title">
                  News Outlet Fairness
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px">
                      How fair do you believe each of these outlets overall on their coverage of topics. <br />
                      Provide a score between 0 and 1 <br />
                      Sliding towards left indicates you feel the outlet is unfair.
                    </span>
                  </i>
                </h3>
                <OutletWeightSlider v-if="overview_constructed" :outlet_leaning="outlet_leaning"
                  @update_outlet_weight="handleUpdateOutletWeight" fontSize="0.65em">
                </OutletWeightSlider>
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>
  </main>
</template>

<style lang="css">
.p-dialog.p-component.tutorialStyle {
  width: 50%;
}
</style>

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
.mainTopicStyle {
  font-style: italic;
  font-weight: 200;
}

.p-splitter-panel.entity-scatter-panel {
  height: 62%;
}

.p-splitter-panel.entity-info-panel {
  height: 30%;
  overflow: hidden;
}

.p-splitter-panel.overview-hex-panel {
  height: 68%;
}

.legend-container.policy-bar-legend {
  height: 30%;
}

// ---------------------
// entity scatter section
// ---------------------

.left-section-panel,
.entity-scatter-panel {
  // This attribute is for node info to show 
  overflow: visible;
}

:deep(.scatter-container) {
  top: -2%;
}

.entity-scatter-content {
  height: 100%;
  /*! display: flex; */
  flex-direction: content;
}
.entity-scatter-panel {
  display: flex;
  flex-direction: column;
}
.entityTableWrapper {
  height: 80%;
  margin-left: 5%;
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

.entity-utils {
  margin: 0.4%;
  padding: 2%;
  // height: 100%;
  width: 100%;
  background: #f7f7f7;
}

.segment-utils {
  margin: 1%;
  padding: 2%;
  width: 33%;
  // height: 100%;
  background: #f7f7f7;
}

.segment-toggler-container {
  width: 100%;
}

.scatter-header {
  // background: #f7f7f7;
  margin: 2%;
  padding: 1%;
}


.tooltiptext {
  font-size: 1rem;
  font-size: 1rem;
  font-family: 'Lato';
  font-weight: 200;
  box-shadow: rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;
}

.toolbar-container {
  display: flex;
  height: max-content;
  width: 100%;
  margin-top: 5%;
  text-align: center;
}

.slider-container {
  width: 100%;
  display: flex;
  // height: max-content;
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
  position: absolute;
  top: 40%;
  left: 30%;

  box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
  transform: scale(1);
  animation: pulse 2s infinite;

}

.hexview-header {
  // background: #f7f7f7;
  margin: 1%;
  padding: 0.45%;
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
  height: 100%;
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
  width: 100%;
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

.num_of_articles,
.entity-info-section {
  width: 45%
}

.topic-bar-header {
  border-bottom: unset;
  border-right: solid 1px #b7b7b7;
  margin: 1%;
  padding: 1%;
  max-width: 27%;
}

.navigate-container {
  width: 12%;
  text-align: left;
  display: flex;
  height: 5%;
  position: absolute;
  top: 63%;
  left: 86%;
  z-index: 999;
}

a.goNext {
  text-decoration: none;
  color: #00000075;
}

.clickNext {
  font-style: italic;
  font-weight: 700;
}

p.next {
  text-align: center;
}

.threshold-title {
  width: 100%;
}


@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}

.introTutorial {
  margin-bottom: 2%;
  padding-bottom: 2%;
  border-bottom: 2px solid #b7b7b7;
}

p.tutorialInstructions {
  font-style: italic;
  margin-bottom: 2%;
}

.fairnessLegend {
  text-align: center;
  width: 100%;
}
</style>

