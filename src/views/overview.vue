<script setup lang="ts">
/**
 * primevue comopnents
 */
import Dialog from 'primevue/dialog';
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"

/**
 * libraries
 */
import { watch, computed, onMounted, PropType, ref, Ref, nextTick, } from 'vue'
import * as vue from 'vue'
import * as _ from "lodash"
import { useUserDataStore } from '../store/userStore'
import { useRoute, useRouter } from 'vue-router'

const store = useUserDataStore()
const route = useRoute()
const router = useRouter()

/**
 * types & utils
 */
import * as typeUtils from "../types"

/**
 * vue components
 */
import EntitySelection from "../components/entitySelection.vue"
import ThresholdController from "../components/ThresholdController.vue";
import EntityTable from "../components/entityTable.vue";
import EntityInfo from "../components/EntityInfo.vue"
import ProgressiveDialog from '../components/ProgressiveDialog.vue';


//
// refs
//
const overview_scatter = ref(null)

//
// raw data
//
const server_address = vue.inject("server_address")

// overview data 
// const overview_overall_scatter_data: Ref<any> = ref({})
const overview_grouped_scatter_data: Ref<any> = ref({})
const overview_overall_scatter_metadata: Ref<any> = ref({})


const overall_scatter_view: Ref<typeUtils.EntityScatterView | undefined> = ref(undefined)
const overall_scatter_data_loading: Ref<boolean> = ref(true)
const overview_constructed: Ref<boolean> = ref(false)
const hex_constructed: Ref<boolean> = ref(true)
const selected_entity_info_fetched: Ref<boolean> = ref(false)
//
// processed data 
//


// outlet related data
/**
 * set of outlet names extracted from dataset.
 */
const enabled_outlet_set: Ref<Set<string>> = ref(new Set(""))
const outlet_leaning: Ref<any> = ref({})


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

/**
 * threshold for filtering on count(articles).
 */
const article_num_threshold: Ref<number> = ref(20)
const setArticleNumThreshold = (threshold) => store.setArticleNumThreshold(threshold)
vue.watch(article_num_threshold, () => {
  setArticleNumThreshold(article_num_threshold.value)
})

const entity_clicked = ref(false)
const entity_changed = ref(false)
/**
 * layout constants in percentage
 */
const left_section_panel_size = 63
const right_section_panel_size = vue.computed(() => 100 - left_section_panel_size)

const table_panel_size = 20
const scatter_panel_size = vue.computed(() => 100 - table_panel_size)

const entity_info_panel_size = 100
const hex_view_panel_size = vue.computed(() => 100 - entity_info_panel_size)


/**
 * Array of selected articles. 
 * Used in ArticleView.
 */
// const selected_articles: Ref<typeUtils.Article[]> = ref([])
// const selected_entity: Ref<typeUtils.EntityInfo|undefined> = ref(undefined)
const selected_outlet = vue.computed(() => store.selected_outlet)
const setSelectedOutlet = (outlet) => store.setSelectedOutlet(outlet)
const selected_entity = vue.computed(() => store.selected_entity)
const setEntity = (entity) => store.setEntity(entity)
const selected_entity_name: Ref<string> = ref("")
vue.watch(selected_entity_name, (new_value, old_value) => {
  handleEntityClicked(selected_entity_name.value)
})
const overall_selected_hexview: Ref<typeUtils.CooccurrHexView | undefined> = ref(undefined)
const overall_entity_data = vue.computed(() => overall_scatter_view.value?.data?.nodes)

/**
 * segmentation threshold of sentiment value.
 */
const segmentation : Ref<typeUtils.Sentiment2D> = vue.computed(() => store.segmentation)
const setSegmentation = (segmentation : typeUtils.Sentiment2D) => store.setSegmentation(segmentation)

vue.onMounted(async () => {
  selected_entity_info_fetched.value = false
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
        // console.log({json})


        // turn flags
        overall_scatter_data_loading.value = false
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
    // overview grouped scatter data 
    fetch(`${server_address}/overview/scatter/grouped/data`)
      .then(res => res.json())
      .then(json => {
        overview_grouped_scatter_data.value = json
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
    // outlet article numbers, return as a dictionary
    fetch(`${server_address}/processed_data/outlet_article_num_dict`)
      .then(res => res.json())
      .then(json => {
        outlet_article_num_dict.value = json
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
    // entity list
    fetch(`${server_address}/processed_data/entity_list`)
      .then(res => res.json())
      .then(json => {
        entity_list.value = json
        resolve("success")
      })
  }))
  promiseArray.push(new Promise((resolve) => {
    // outlet set
    fetch(`${server_address}/processed_data/outlet_set`)
      .then(res => res.json())
      .then(json => {
        enabled_outlet_set.value = json
        // update outlet leaning dict
        enabled_outlet_set.value.forEach(outlet => {
            outlet_leaning.value[outlet] = 1
        });
        resolve("success")
      })
  }))
  if (selected_entity.value) {
    // request selected entity data (happens when user use back button)
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
    // trigger handler function 
    handleEntityClicked(selected_entity.value.name)

  }
  await Promise.all(promiseArray)
    .then(res => {
      overview_constructed.value = true
    })
})


// handlers
async function handleEntityClicked(entity: string) {
  if(!entity_clicked.value) entity_clicked.value = true
  else entity_changed.value = true
  legendInput.value = {}
  legendInput.value[entity] = "white";
  legendInput.value["Co-Occuring Topic"] = "#4baaf5";


  // request entity-related data
  const promiseArray: any[] = []
  promiseArray.push(new Promise((resolve) => {
    // selected entity node data
    fetch(`${server_address}/overview/scatter/overall/node/${entity}`)
      .then(res => res.json())
      .then(json => {
        console.log({json})
        const store_entity = {
          name: entity,
          outlet: "Overall",
          article_ids: json.article_ids,
          neg_article_ids: json.neg_article_ids,
          pos_article_ids: json.pos_article_ids,
          pos_sst: json.pos_sst,
          neg_sst: json.neg_sst,
        }
        setEntity(store_entity)
        selected_entity_info_fetched.value = true
        resolve("success")
      })
  }))
  await Promise.all(promiseArray)
}

let legendInput = ref({});
legendInput.value["main"] = "white";
legendInput.value["co-occur"] = "#4baaf5";

function updateSegmentation(segmentValue) {
  let segmentation : typeUtils.Sentiment2D = segmentValue
  setSegmentation(segmentation)
}


function handleOutletClicked(outlet) {
  console.log(outlet)
  setSelectedOutlet(outlet)
  router.push({ name: 'belief', params: { outlet: outlet, entity: selected_entity.value.name } })
}

function toggleTutorial() {
  return
}

</script>


<template>
  <main style="displex: flex; width: 99vw; height: 95vh">
    <ProgressiveDialog
      @toggle-tutorial="toggleTutorial"
      header="U.S. News Media Coverage Assessment"
      content="
        NOVA's purpose is to help you assess if your expectations of how mainstream news media cover topics align with their reporting.
        We gathered articles centered around COVID-19 from six U.S. mainstream media outlets:
        <img src='ABC News.png' style='height:18px;'/>
        <img src='New York Times.png' style='height:18px;'/>
        <img src='Washington Post.png' style='height:18px;'/>
        <img src='FoxNews.png' style='height:18px;'/>
        <img src='Breitbart.png' style='height:18px;'/>
        <img src='CNN.png' style='height:18px;'/>.
        <br>
        To demonstrate the system, let's delve into what topics these outlets covered during start of the COVID-19 Pandemic (Feb-June
        2020).
      "/>
    <Splitter class="overview-container">
      <SplitterPanel class="left-section-panel" style="overflow: visible" :size="left_section_panel_size">
          <!-- left section header -->
          <h2 class="component-header scatter-header" style="margin: 2%;">
            News Topics
            <i class='pi pi-info-circle tooltip'>
              <span class="tooltiptext right-tooltiptext" style="width: 200px;">
                Each point is a topic with 2D sentiment score (pos, neg). <br />
                The score represents how many positive and negatives articles they have.
                The articles are between Feb 2020 and June 2020.
              </span>
            </i>
          </h2>
          <div class='scatter-content' style="height: 100%; flex-direction: content;">
            <Splitter class='table-scatter-splitter'>
              <SplitterPanel class="entity-table-panel" :size="table_panel_size" style="display: flex; flex-direction: column">
                <div id="entityTableWrapper" class='entityTableWrapper' style="height: 67%; min-height: 67%; margin-left: 5%;">
                  <i v-if="overall_scatter_data_loading" class="pi pi-spin pi-spinner" style="position:absolute;
                      left: 45%;
                      top: 30%;
                      font-size: 3rem;
                      z-index: 1000">
                  </i>
                  <EntityTable v-else :entity_nodes="overall_entity_data" :article_num_threshold="article_num_threshold" 
                    v-model:selected_entity_name='selected_entity_name'
                  />
                </div>
                <!-- Utilities -->
                <div class="utilities-container"
                  style="
                    display: flex;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: 50px auto;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    width: 100%;
                    height: 100%;
                  ">
                  <div id="entity-utility-container" class="entity-utils" style="width: 100%; margin: 0.4%; padding: 2%;">
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
                    <h3 class="threshold-title" style="width: 100%;"> Number of Articles Threshold
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
                  </div>
                </div>

              </SplitterPanel>
              <SplitterPanel class='entity-scatter-panel' style="display: flex; flex-direction: column">
                <div class="overview-scatter-container" style="width: 100%; height: 95%">
                  <!-- load icon -->
                  <i v-if="overall_scatter_data_loading" class="pi pi-spin pi-spinner" style="position:absolute;
                      left: 45%;
                      top: 30%;
                      font-size: 3rem;
                      z-index: 1000">
                  </i>
                  <EntitySelection v-else :segmentation="segmentation" :view="overall_scatter_view" id="overview-scatter"
                    ref='overview_scatter'
                    :article_num_threshold="article_num_threshold" :segment_mode="segment_mode" 
                    v-model:selected_entity_name='selected_entity_name'
                    @update:segmentation="updateSegmentation" />
                </div>
              </SplitterPanel>
            </Splitter>
          </div>
      </SplitterPanel>
      <SplitterPanel class="right-section-panel" :size="right_section_panel_size">
        <Splitter layout="vertical">
          <SplitterPanel class="overview-entity-info-panel" :size="entity_info_panel_size">
            <!-- Entity Info View -->
            <h2 v-if="selected_entity" class="component-header entity-info-header" style="margin: 1%; padding: 0.45%">
              Statistics for 
              <span class="mainTopicStyle" style="font-style: italic; font-weight: 200;"> {{ selected_entity.name.replaceAll("_", " ") }} </span>
              &nbsp
              <!-- <i class='pi pi-info-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 400px">
                  Shows most-frequently co-occurring topics with the main topic ({{
                      selected_entity.name.replaceAll("_", " ")
                  }}). <br />
                  Each co-occurring topic is categorized by the region segmentation in the Topic Scatterplot.
                </span>
              </i> -->
            </h2>
            <div class="overview-entity-info-container" v-if="overview_constructed" style="padding-left: 0.7%;">
              <EntityInfo v-if="selected_entity_info_fetched" 
                :data="selected_entity"
                :segmentation="segmentation"
                :outlets="Array.from(enabled_outlet_set)"
                :show_animation="!entity_changed"
                @outlet-clicked="handleOutletClicked"
                >

              </EntityInfo>
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
.component-header {
  background: #f7f7f7;
}


// ---------------------
// css for split-panel layout
// ---------------------
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



// ---------------------
// utitlies section
// ---------------------
// slider style

.tooltiptext {
  font-size: 1rem;
  font-size: 1rem;
  font-family: 'Lato';
  font-weight: 200;
  box-shadow: rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;
}
// ---------------------
// entity info section
// ---------------------


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


</style>

