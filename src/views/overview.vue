<script setup lang="ts">
/**
 * primevue comopnents
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"

/**
 * libraries
 */
import { ref, Ref } from 'vue'
import * as vue from 'vue'
import * as _ from "lodash"
import { useUserDataStore } from '../store/userStore'
import { useRouter } from 'vue-router'
import introJS from 'intro.js'

const store = useUserDataStore()
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
const overview_overall_scatter_metadata: Ref<any> = ref({})


const overall_scatter_view: Ref<typeUtils.EntityScatterView | undefined> = ref(undefined)
const overall_scatter_data_loading: Ref<boolean> = ref(true)
const overview_constructed: Ref<boolean> = ref(false)
const selected_entity_info_fetched: Ref<boolean> = ref(false)


// outlet related data
const entity_outlet_dict = ref({})

/**
 * entity list
 */
const entity_list: Ref<string[]> = ref([])

/**
 * dictionary: { [outlet]: Article[ ].length }
 */
// const outlet_article_num_dict = ref({})
const total_articles = ref(0)
vue.provide("total_articles", total_articles)

/**
 * Flags
 */
const firstAccess = vue.computed(() => store.overview_first_access)
const setFirstAccess = (value) => (store.setOverviewFirstAccess(value))

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
const entity_info_panel_size = 100

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


function fetchRetry(url, fetchOptions = {}, retry=2) {
  return fetch(url, fetchOptions)
  // check 404 error
  .then(response => {
    if (!response.ok) {
      console.log({response})
      if(retry != 0) return fetchRetry(url, fetchOptions, retry-1)
    }
    return response;
  })
  // other errors
  .catch(() => {
    if(retry != 0) return fetchRetry(url, fetchOptions, retry - 1)
  });
}

vue.onMounted(async () => {
  selected_entity_info_fetched.value = false
  const url = `${server_address}/overview/data`
  const fetchOptions = {
    method: "POST",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({article_num_threshold: article_num_threshold.value})
  }
  fetchRetry(url, fetchOptions)
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
    total_articles.value = json.total_article
    console.log("total_articles:", total_articles.value)
    entity_list.value = json.entity_list
    entity_outlet_dict.value = json.entity_outlet_dict

    // turn flags
    overall_scatter_data_loading.value = false
    overview_constructed.value = true
  })
})


// handlers
async function handleEntityClicked(entity: string) {
  if(!entity_clicked.value) entity_clicked.value = true
  else entity_changed.value = true

  // request entity-related data
  const url = `${server_address}/overview/scatter/overall/node/${entity}`
  fetchRetry(url)
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
  })
}


function updateSegmentation(segmentValue) {
  let segmentation : typeUtils.Sentiment2D = segmentValue
  setSegmentation(segmentation)
}


function handleOutletClicked(outlet) {
  console.log(outlet)
  setSelectedOutlet(outlet)
  router.push({ name: 'belief', params: { outlet: outlet, entity: selected_entity.value.name } })
}

function toggleTutorial(e: MouseEvent) {
  setFirstAccess(false)
  introJS().setOptions({
      // dontShowAgain: true,
      showProgress: true,
      steps: [
        {
          title: "The table",
          element: document.querySelector('.entityList'),
          intro: "This is the table showing all the topics we collected. You can click any item to see the details.",
        },
        {
          title: "The filter",
          element: document.querySelector('.entity-utils'),
          // element: document.querySelector('.utilities-container'),
          intro: "You can also use this filter to remove unimportant topics.",
        },
        {
          title: "The Scatter Plot",
          // element: document.querySelector(".scatter-container > svg "),
          element: document.querySelector(".scatter-container"),
          // element: document.querySelector(".entity-scatter-panel"),
          intro: `We visualize the topics in a scatter plot and categorize the topics into four types: 
          <span class='neg_color'>negative</span>,
          <span class='pos_color'>positive</span>,
          <span class='neu_color'>neutral</span>, or
          <span class='mix_color'>mixed</span>. You can also hover the dot on the scatter plot for more 
          information and also click on the dot to select the topic.`,
          position: 'left',
        },
        {
          title: "The mixed region",
          element: document.querySelector('.scatter-container > svg > g.segmentation > rect.mixed'),
          intro: `Mixed topics have high volume of articles, which means that they are more controversial and have more diverse opinions. 
          <span style='font-weight: bold'> We encourage you to explore the mixed topics. </span>`,
          position: 'left',
        },
      ]
  }).start()
}


</script>


<template>
  <div style="display: flex; width: 99vw; height: 95vh; overflow: hidden;">
    <ProgressiveDialog
      v-if="firstAccess"
      @toggle-tutorial="toggleTutorial"
      header="U.S. News Media Coverage Assessment"
      content="
        NOVA's purpose is to help you assess if your expectations of how mainstream news media cover topics align with their reporting.
        We gathered articles centered around COVID-19 from six U.S. mainstream media outlets:
        <img src='imgs/ABC News.png' style='height:18px;'/>
        <img src='imgs/New York Times.png' style='height:18px;'/>
        <img src='imgs/Washington Post.png' style='height:18px;'/>
        <img src='imgs/FoxNews.png' style='height:18px;'/>
        <img src='imgs/Breitbart.png' style='height:18px;'/>
        <img src='imgs/CNN.png' style='height:18px;'/>.
        <br>
        To demonstrate the system, let's delve into what topics these outlets covered during start of the COVID-19 Pandemic (Feb-June
        2020).
      "/>
    <Splitter class="overview-container">
      <SplitterPanel class="left-section-panel" style="overflow: visible; display: flex; flex-direction:column;" :size="left_section_panel_size">
          <!-- left section header -->
          <h2 class="component-header scatter-header" style="margin: 1%;">
            News Topics
            <i class='pi pi-info-circle tooltip'>
              <span class="tooltiptext right-tooltiptext" style="width: 200px;">
                Each dot on the scatter plot is a topic with 2D sentiment score (pos, neg). <br />
                User can either choose topics from the table or the scatter plot.
                <!-- The score represents the normalization value of how many positive and negatives articles they have. -->
                <!-- The articles are between Feb 2020 and June 2020. -->
              </span>
            </i>
            <div class="tutorial-toggle-container" style="display:inline; margin-left: auto; position: absolute; right: 0%; top: -1%;">
              <Button severity="secondary" text raised @click="toggleTutorial" style="width:fit-content;font-family:Trebuchet MS;"> Tutorial </Button>
            </div>
          </h2>
          <div class='scatter-content' style="max-height: calc(100% - 40px); flex: 1;">
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
                  <div id="entity-utility-container" class="entity-utils" style="width: 100%; height: fit-content; padding: 2%; margin: 2%;">
                    <h2 class="component-header util-header">
                      Topic Settings
                      <i class='pi pi-info-circle tooltip'> 
                        <span class="tooltiptext right-tooltiptext" style="width: 300px;">
                          The color spectrum slider helps filter topics by number or articles. <br />
                          <!-- The six-sliders group lets you input your preception of each media outlet based on fairness and
                          importance. -->
                        </span>
                      </i>
                    </h2>
                    <!-- filter slider -->
                    <h3 class="threshold-title" style="width: 100%;"> Articles Threshold
                      <i class='pi pi-info-circle tooltip'>
                        <span class="tooltiptext right-tooltiptext" style="width: 300px;">
                          Drag the slider or click on the increasement/ decreasement button to set a threshold on topics' minimum articles.
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
                    :article_num_threshold="article_num_threshold" :segment_mode="true" 
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
                :outlets="entity_outlet_dict[selected_entity.name]"
                :show_animation="!entity_changed"
                @outlet-clicked="handleOutletClicked"
                >
              </EntityInfo>
              <div v-else class="default">
                <div style="padding:3rem; ">Select a topic by clicking on a row in the table or a dot on the scatter plot!</div>
              </div>
            </div>
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>
  </div>
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
.default{
  height: 100%;
  text-align: justify;
  padding: 45% 0;
  font-family: 'Lato';
  font-weight: 200;
  font-size: 2rem;
  font-style: italic;
  
}
// ---------------------
// css for split-panel layout
// ---------------------
:deep(.p-splitter) {
  width: inherit;
  height: 100%;
}

:deep(.p-splitter-panel) {
  width: 100%;
  height: 100%;
  // overflow: hidden;
}

// divider style 
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}



// ---------------------
// utitlies section
// ---------------------
// slider style

// .tooltiptext {
//   text-align: justify;
//   position: absolute;
//   z-index:1000;
//   pointer-events: none;
//   font-size: 1rem;
//   font-size: 1rem;
//   font-family: 'Lato';
//   font-weight: 200;
//   box-shadow: rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;
// }
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

.pos_color {
    background: #baf0f5;
}
.neg_color {
    background: #f4c49c;
}
.mix_color {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect x="0" y="0" width="10" height="10" fill="rgb(186, 240, 245)" /> <line x1="0" y1="10" x2="10" y2="0" stroke="rgb(244, 196, 156)" stroke-width="2.5" /> </svg>');
}
.neu_color {
    background: #dddddd;
}
</style>

