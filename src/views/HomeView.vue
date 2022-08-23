<script setup lang="ts">

import Filter from "../components/deprecated/Filter.vue";
import Slider from "primevue/slider"
import InputText from "primevue/inputtext"
//import Target from "../components/Target.vue";
import TargetContainer from "../components/TargetContainer.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ToggleButton from 'primevue/togglebutton';
import TopicSelection from "../components/deprecated/TopicSelection.vue";
import TargetSelection from "../components/deprecated/TargetSelection.vue"
import MonthSlider from "../components/deprecated/MonthSlider.vue"
import * as preprocess from "../components/preprocessUtils"
import { watch, computed, onMounted, PropType, ref, Ref, nextTick, } from 'vue'
import * as vue from 'vue'
import { ScatterOutletGraph, ViewType, Sentiment2D, Article } from "../types";
import Legend from "../components/Legend.vue";
import Divider from 'primevue/divider';
import ColorSpectrum from '../components/ColorSpectrum.vue'
import * as SstColors from "../components/ColorUtils"
import * as _ from "lodash"
import TemporalCoordinates from "../components/TemporalCoordinates.vue";
import TemporalPathSelector from "../components/TemporalPathSelector.vue";
import SentimentScatter from "../components/SentimentScatter.vue";
import Tooltip from "../components/Tooltip.vue";
import SearchBar from "../components/SearchBar.vue";
import ArticleView from "../components/ArticleView.vue"
import tutorial_intro_json from "../assets/tutorial/tutorial_intro.json"
import * as tutorial from "../components/TutorialUtils"


//
// raw data
//
const entity_mentions: Ref<any[]> = ref([])
let dataset_metadata = {}
let original_dataset = []
const articles = ref([])

//
// processed data 
//

/**
 * @deprecated
 * start & end month of dataset.
 */
let timeRange: {start: number, end: number} 

/**
 * dictionary: { [article_id]: Article }
 */
const article_dict = ref({})

// outlet related data
/**
 * set of outlet names extracted from dataset.
 */
const enabled_outlet_set: Ref<Set<string>> = ref(new Set())

/**
 * nested dictionary: { [outlet]: { [month]: Article[ ] } }
 */
const outlet_article_bins_dict = ref({})

/**
 * dictionary: { [outlet]: Article[ ] }
 */
const outlet_article_dict = ref({})

/**
 * dictionary: { [outlet]: Article[ ].length }
 */
const outlet_article_num_dict = ref({})
vue.provide("outlet_article_num_dict", outlet_article_num_dict)

/**
 * nested dictionary: { [outlet]: { [entity_1]: { [entity_2]: Article_id[ ] } } }
 */
const entity_cooccurrences_groupby_outlet = ref({})

/**
 * dictionary: { [graph_title]: ScatterOutletGraph }. \
 * graph_dict stores all the graphs that are created to easily move graphs between views.
 */
const graph_dict = ref({})

/**
 * flag for constructing overview grid graphs on mounted.
 */

const overview_constructed: Ref<boolean> = ref(false)
/**
 * @deprecated
 */
const entity_list: Ref<string[]> = computed(() => entity_mentions.value?.["CNN"].map(entity_mention => entity_mention.entity))

/**
 * Array: ScatterOutletGraph[]. \
 * Stores the graphs in left panel.
 */
const selectedScatterGraphs_left: Ref<ScatterOutletGraph[]> = ref([])
/**
 * Array: ScatterOutletGraph[]. \
 * Stores the graphs in left panel.
 */
const selectedScatterGraphs_right: Ref<ScatterOutletGraph[]> = ref([])

/**
 * @deprecated
 */
const entity_data = computed(() => entity_mentions.value.map(entity_mention => { return {"name": entity_mention[0], "num": entity_mention[1].length || 0}}))

/**
 * flag for displaying load icon on mounted.
 */
const overview_constructing: Ref<boolean> = ref(true)

//
// preprocessed global data used across components
//

/**
 * max articles of all nodes in overview grid. \
 * Used when scaling node color.
 */
const max_articles: Ref<number> = ref(0)
/**
 * min articles of all nodes in overview grid. \
 * Used when scaling node color.
 */
const min_articles: Ref<number> = ref(0)
vue.provide('min_articles', min_articles)
vue.provide('max_articles', max_articles)

/**
 * Flag for compare mode. \
 * Two panels are opened when compare mode is on.
 */
const compare_mode: Ref<boolean> = ref(false)
vue.provide('compare_mode', compare_mode)

/**
 * Flag for displaying article view. 
 */
const display_article_view: Ref<boolean> = ref(false)
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
 * flag for switching between overview grid and overview temporal.
 */
const overview_grid_mode: Ref<boolean> = ref(true)

/**
 * min timestamp extracted from dataset. \
 * Used in temporal view.
 */
const min_timestamp: Ref<string> = ref("")
vue.provide('min_timestamp', min_timestamp)
/**
 * min timestamp extracted from dataset. \
 * Used in temporal view.
 */
const max_timestamp: Ref<string> = ref("")
vue.provide('max_timestamp', max_timestamp)

/**
 * segmentation threshold of sentiment value.
 */
const segment_sst: Ref<Sentiment2D> = ref({pos: 0.5, neg: 0.5}) 
vue.provide('segment_sst', {segment_sst, updateThreshold})
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
  segment_sst.value = new_value
}

/**
 * nested dictionary: { [title]: { [month]: Article[ ] }}. \
 * Used in TargetContainer to store all temporal view data.
 */
const temporalBins = ref({})

/**
 * dictionary: { [node_title]: Article_ids[ ] }. \
 * Stores the subset of articles represented by each node. \
 * Referenced by node title. 
 */
const node_article_id_dict = ref({})

/**
 * Array of selected articles. \
 * Used in ArticleView.
 */
const selected_articles: Ref<Article[]> = ref([])

/**
 * @deprecated
 */
watch(() => timeRange, (new_range, old_range) => {
  if(new_range[0] != old_range[0] || new_range[1] != old_range[1]) {
    // TODO: implement slicing with dataframe
    const subset = preprocess.sliceDatasetByTime(new_range, original_dataset)
    // const startIndex = this.original_dataset.findIndex(article => parseInt(article.timestamp.split('-')[1]) >= new_range[0])
    // const endIndex = this.original_dataset.findIndex(article => parseInt(article.timestamp.split('-')[1]) > new_range[1])
    // const subset = this.original_dataset.slice(startIndex, (endIndex == -1? this.original_dataset.length : endIndex))
    // this.updateDicts(subset)
  }
})

vue.watch(overview_constructed, (new_value, old_value) => {
  if(tutorial_mode.value) {
    tutorial.updateOverviewGrid()
  }
})

vue.watch(overview_grid_mode, (new_value, old_value) => {
  tutorial.handleToggleTemporal(tutorial_intro, overview_grid_mode, {tutorial_mode, tutorial_step})
})

vue.watch(compare_mode, (new_value, old_value) => {
  tutorial.handleToggleCompareMode(tutorial_intro, {tutorial_mode, tutorial_step})
})

vue.watch(tutorial_mode, (new_value, old_value) => {
  if(old_value === true && new_value === false) {
    tutorial.handleSkipTutorial()
  }
})
vue.watch(selectedScatterGraphs_left, (new_value, old_value) => {
  tutorial.handleAddToLeftPanel(tutorial_intro, {tutorial_mode, tutorial_step})
}, {deep:true})


vue.watch(selectedScatterGraphs_right, (new_value, old_value) => {
  // 
  // closing tabs
  //

  // if closing a temporal view, clear temporalBins
  if(!new_value.find(scatter => scatter.type === ViewType.Temporal)) {
    temporalBins.value = {}
  }

  //
  // tutorial setups
  //
  if(tutorial_mode.value && tutorial_step.value === 6) {
    tutorial.introduceDraggingTabs(tutorial_intro)
  }
  
  if(tutorial_mode.value && tutorial_step.value < 7) {
    tutorial.hideTemporalButton()
  }

  if(tutorial_mode.value && tutorial_step.value === 7) {
      if(selectedScatterGraphs_right.value[selectedScatterGraphs_right.value.length-1].type === ViewType.OutletScatter) {
        tutorial.introduceTemporalButton(tutorial_intro)
      }
  }



}, {deep:true})

// prepare for tutorial
vue.onMounted(() => {
  tutorial.prepareComponentsForTutorial({tutorial_mode, tutorial_step})
})

// tutorial setups
vue.watch(tutorial_step, (new_value, old_value) => {
  tutorial.handleNextStep({tutorial_mode, tutorial_step}) 
})


/**
 * @deprecated
 */
function updateNpList(np_list) {
  // this.dataset = dataset
  // this.outlet_set = dataset.outlet_set
  // this.enabled_outlet_set = dataset.outlet_set
  // this.topic_list = Object.keys(dataset.topic_dict)
  entity_mentions.value = np_list
  dataset_metadata = this.$refs.toolbar.getMetaData()  
} 

function datasetImported(dataset) {
  overview_constructing.value = true
  setTimeout(() => {
    const promise = new Promise((resolve) => { 
      outlet_article_dict.value = dataset.outlet_article_dict
      entity_mentions.value = dataset.entity_mentions
      entity_cooccurrences_groupby_outlet.value = dataset.entity_cooccurrences_outlet_dict

      let {outlet_set, r_article_dict, r_article_bins_dict, r_min_timestamp, r_max_timestamp, r_outlet_article_num_dict} = preprocess.processArticleDict(outlet_article_dict.value)
      outlet_article_num_dict.value = r_outlet_article_num_dict
      outlet_article_bins_dict.value = r_article_bins_dict
      enabled_outlet_set.value = outlet_set
      min_timestamp.value = r_min_timestamp
      max_timestamp.value = r_max_timestamp
      // articles.value = normalized_articles
      article_dict.value = r_article_dict
      let {r_graph_dict, r_max_articles, r_min_articles, r_node_article_id_dict} = preprocess.constructEntityGraph(entity_mentions.value, article_dict.value)
      graph_dict.value = r_graph_dict
      max_articles.value = r_max_articles
      min_articles.value = r_min_articles
      node_article_id_dict.value = r_node_article_id_dict
      overview_constructed.value = true
      resolve(""); 
    })
    promise.then(() => overview_constructing.value = false)
  }, 10)

}

/**
 * 
 * @deprecated this function is replaced by datasetImported() 
 */
function processDataset(dataset) {
  entity_mentions.value = dataset.entity_mentions
  dataset_metadata = dataset.metadata

  // save raw dataset 
  // possibly need deep clone?
  original_dataset = dataset.articles 

  // get time period
  const dataset_articles = dataset.articles
  dataset_articles.sort((a1, a2) => Date.parse(a1.timestamp) > Date.parse(a2.timestamp))
  const startMonth = parseInt(dataset_articles[0].timestamp.split('-')[1])
  const endMonth = parseInt(dataset_articles[dataset_articles.length-1].timestamp.split('-')[1])
  timeRange = {start: startMonth, end: endMonth+1}
  // process articles
  let {outlet_set, normalized_articles, r_article_dict} = preprocess.processArticles(dataset_articles)
  enabled_outlet_set.value = outlet_set
  articles.value = normalized_articles
  article_dict.value = r_article_dict
  // let {r_graph_dict, r_max_articles, r_min_articles} = preprocess.constructOutletGraph(entity_mentions.value, enabled_outlet_set.value, article_dict.value)
  let {r_graph_dict, r_max_articles, r_min_articles} = preprocess.constructEntityGraph(entity_mentions.value, enabled_outlet_set.value, article_dict.value, dataset_articles)
  graph_dict.value = r_graph_dict
  max_articles.value = r_max_articles
  min_articles.value = r_min_articles
  overview_constructed.value = true
}

function updateEnabledOutlet(outlet_set_info) {
  enabled_outlet_set.value = outlet_set_info.filter(outlet => outlet.enabled).map(outlet => outlet.outlet)
}

// handlers
function handleScatterClicked(index) {
    const clicked_scatter = Array.from(enabled_outlet_set.value)[index]

    selectedScatterGraphs_left.value.push(graph_dict.value[clicked_scatter])
    const dropped_from = selectedScatterGraphs_right.value.findIndex(element => element.title === clicked_scatter)
    if(dropped_from > -1) 
      selectedScatterGraphs_right.value.splice(dropped_from, 1)

    const button_next = document.getElementsByClassName("p-tabview-nav-next")[0] as HTMLElement || undefined
    if(button_next != undefined) {
      button_next.click()
    }
}

function handleDragScatter(evt, index) {
  evt.dataTransfer.dropEffect = 'move'
  evt.dataTransfer.effectAllowed = 'move'
  const dragged_scatter = Array.from(enabled_outlet_set.value)[index]
  const scatter = graph_dict.value[dragged_scatter]
  evt.dataTransfer.setData('scatter', JSON.stringify(scatter))  
}

function handleDragOver(e) {
  e.preventDefault()
  const tabview_left = document.querySelector(".p-tabview.panel-left") as HTMLElement
  if(e.target !== tabview_left && tabview_left.contains(e.target)) {
    const tabview_panels = tabview_left.querySelector(".p-tabview-panels") as HTMLElement
    const svg_list = tabview_left.querySelectorAll(".outlet-scatterplot")
    if(svg_list.length) svg_list.forEach(svg => (svg as HTMLElement).style.background = "#b8b8b8")
    else if(tabview_panels) tabview_panels.style.background = "#b8b8b8"
  }
  const tabview_right = document.querySelector(".p-tabview.panel-right") as HTMLElement
  if(tabview_right !== null) {
    if(e.target !== tabview_right && tabview_right.contains(e.target)) {
      const tabview_panels = tabview_right.querySelector(".p-tabview-panels") as HTMLElement
      const svg_list = tabview_right.querySelectorAll(".outlet-scatterplot")
      if(svg_list.length) svg_list.forEach(svg => (svg as HTMLElement).style.background = "#b8b8b8")
      else if(tabview_panels) tabview_panels.style.background = "#b8b8b8"
    }
  }
}

function handleDragLeave(e) {
  e.preventDefault()
  const tabview_left = document.querySelector(".p-tabview.panel-left") as HTMLElement
  if(e.target !== tabview_left && tabview_left.contains(e.target)) {
    const tabview_panels = tabview_left.querySelector(".p-tabview-panels") as HTMLElement
    const svg_list = tabview_left.querySelectorAll(".outlet-scatterplot")
    if(svg_list.length) svg_list.forEach(svg => (svg as HTMLElement).style.background = "white")
    else if(tabview_panels) tabview_panels.style.background = "white"
  }
  const tabview_right = document.querySelector(".p-tabview.panel-right") as HTMLElement
  if(tabview_right !== null) {
    if(e.target !== tabview_right && tabview_right.contains(e.target)) {
      const tabview_panels = tabview_right.querySelector(".p-tabview-panels") as HTMLElement
      const svg_list = tabview_right.querySelectorAll(".outlet-scatterplot")
      if(svg_list.length) svg_list.forEach(svg => (svg as HTMLElement).style.background = "white")
      else if(tabview_panels) tabview_panels.style.background = "white"
    }
  }
}

function handleDropScatter(e) {
  // style changes
  const tabview_left = document.querySelector(".p-tabview.panel-left") as HTMLElement
  if(e.target !== tabview_left && tabview_left.contains(e.target)) {
    const tabview_panels = tabview_left.querySelector(".p-tabview-panels") as HTMLElement
    const svg_list = tabview_left.querySelectorAll(".outlet-scatterplot")
    if(svg_list.length) svg_list.forEach(svg => (svg as HTMLElement).style.background = "white")
    else if(tabview_panels) tabview_panels.style.background = "white"
  }
  const tabview_right = document.querySelector(".p-tabview.panel-right") as HTMLElement
  if(tabview_right !== null) {
    if(e.target !== tabview_right && tabview_right.contains(e.target)) {
      const tabview_panels = tabview_right.querySelector(".p-tabview-panels") as HTMLElement
      const svg_list = tabview_right.querySelectorAll(".outlet-scatterplot")
      if(svg_list.length) svg_list.forEach(svg => (svg as HTMLElement).style.background = "white")
      else if(tabview_panels) tabview_panels.style.background = "white"
    }
  }

  // send data
  const scatter = JSON.parse(e.dataTransfer.getData('scatter'))
  if(e.target.classList.contains("panel-left") || e.target.parentNode.classList.contains("panel-left")) {
    selectedScatterGraphs_left.value.push(scatter)
    const dropped_from = selectedScatterGraphs_right.value.findIndex(element => element.title === scatter.title)
    if(dropped_from > -1) 
      selectedScatterGraphs_right.value.splice(dropped_from, 1)
  }
  else if(e.target.classList.contains("panel-right") || e.target.parentNode.classList.contains("panel-right")) {
    selectedScatterGraphs_right.value.push(scatter)
    const dropped_from = selectedScatterGraphs_left.value.findIndex(element => element.title === scatter.title)
    // if(dropped_from > -1) 
      // selectedScatterGraphs_left.value.splice(dropped_from, 1)
  }
  const button_next = document.getElementsByClassName("p-tabview-nav-next")[0] as HTMLElement || undefined
  if(button_next != undefined) {
    button_next.click()
  }
}

function handleEntityClicked({type, d}) {
  compare_mode.value = true 
  if(type === ViewType.OutletScatter) {
    // construct outlet graph
    const entity_name = d.text.split("-")[0]
    var outlet_graph: ScatterOutletGraph= {title: entity_name, type: ViewType.OutletScatter, nodes: []}
    enabled_outlet_set.value.forEach(outlet => {
      const graph = graph_dict.value[outlet]
      // find entity node in this graph
      let entity_in_outlet = _.cloneDeep(graph.nodes.find(node => node.text.split("-")[0] === entity_name))
      || { text: outlet, articles: 0, pos_sst: 0, neg_sst: 0}
      entity_in_outlet.text = `${entity_name}-${outlet}`
      outlet_graph.nodes.push(entity_in_outlet)
    })
    selectedScatterGraphs_right.value.push(outlet_graph)
    return
  }

  if(type === ViewType.Temporal) {
    // construct outlet-entity pair temporal graph

    // get outlet-entity pair articles
    const article_ids = node_article_id_dict.value[d.text]
    const articles = preprocess.idsToArticles(article_ids, article_dict.value)

    // generate bins by month
    const articles_binBy_month = preprocess.binArticlesByMonth(articles)
    temporalBins.value[d.text] = articles_binBy_month
    if(selectedScatterGraphs_right.value.find(graph => graph.type === ViewType.Temporal) === undefined) {
      var temporal_graph: ScatterOutletGraph= {title: "Temporal", type: ViewType.Temporal, nodes: []}
      selectedScatterGraphs_right.value.push(temporal_graph)
    }
    return
  }
  if(type === ViewType.CooccurrScatter) {
    const entity = d.text.split("-")[0]
    const outlet = d.text.split("-")[1]
    const cooccurrences = entity_cooccurrences_groupby_outlet.value[outlet][entity]
    const title = `co-${entity}-${outlet}` 
    var cooccurr_graph: ScatterOutletGraph= {title: title, type: ViewType.CooccurrScatter, nodes: []}
    Object.keys(cooccurrences).forEach(entity2 => {
      const cooccurr_article_ids = cooccurrences[entity2]
      const articles = preprocess.idsToArticles(cooccurr_article_ids, article_dict.value)
      const node = preprocess.construct_node(articles, `${entity2}-${entity}`)
      cooccurr_graph.nodes.push(node)
    });
    selectedScatterGraphs_right.value.push(cooccurr_graph)
    return
  }
  if(type === ViewType.Article) {
    const article_ids = node_article_id_dict.value[d.text]
    selected_articles.value = preprocess.idsToArticles(article_ids, article_dict.value)
    display_article_view.value = true

  }
}

function handleShowTemporal(nodes) {
    compare_mode.value = true 
    nodes.forEach(node => {
      const article_ids = node_article_id_dict.value[node.text]
      const articles = preprocess.idsToArticles(article_ids, article_dict.value)
      const articles_binBy_month = preprocess.binArticlesByMonth(articles)
      temporalBins.value[node.text] = articles_binBy_month
      // TODO: replace deep clone 
      // temporalBins.value = _.cloneDeep(temporalBins.value)
      if(selectedScatterGraphs_right.value.find(graph => graph.type === ViewType.Temporal) === undefined) {
        var temporal_graph: ScatterOutletGraph= {title: "Temporal", type: ViewType.Temporal, nodes: []}
        selectedScatterGraphs_right.value.push(temporal_graph)
      }
    })
    return
}

function highlightChanged(new_value) {
  highlight_outlet.value = new_value
}

function handleSearch(item) {
  highlight_nodes.value.push(item)
}
</script>


<template>
  <main>
    <Splitter class="splitter-outmost" layout="vertical">
      <SplitterPanel id="homeview-container" class="flex align-items-center justify-content-center" :size="100">
        <Splitter>
          <SplitterPanel id="expanded_section" class="expanded-section flex align-items-center justify-content-center" :size="55" 
            >
            <TargetContainer
            id="panel_left"
            :class="{compare: compare_mode}"
            compare_part="panel-left"
            :articles="articles"
            :enabled_outlet_set="enabled_outlet_set"
            v-model:selectedScatters="selectedScatterGraphs_left"
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            v-model:segmentation="segment_sst"
            :highlight_nodes="highlight_nodes"
            @drop="handleDropScatter($event)"
            @dragover="handleDragOver($event)"
            @dragleave="handleDragLeave($event)"
            @dragenter="(e) => (e.preventDefault())"
            @entity-clicked="handleEntityClicked"
            @show_temporal="handleShowTemporal"
            >
            </TargetContainer>
            <Divider v-if="compare_mode" layout="vertical">
            </Divider>

            <TargetContainer
            v-if="compare_mode"
            id="panel_right"
            :class="{compare: compare_mode}"
            compare_part="panel-right"
            :articles="articles"
            :enabled_outlet_set="enabled_outlet_set"
            v-model:selectedScatters="selectedScatterGraphs_right"
            :temporalBins="temporalBins"
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            v-model:segmentation="segment_sst"
            :highlight_nodes="highlight_nodes"
            @drop="handleDropScatter($event)"
            @dragover="handleDragOver($event)"
            @dragleave="handleDragLeave($event)"
            @dragenter="(e) => (e.preventDefault())"
            @entity-clicked="handleEntityClicked"
            @show_temporal="handleShowTemporal"
            >
            </TargetContainer>
          </SplitterPanel>
          <SplitterPanel id='sidebar' class="sidebar flex align-items-center justify-content-center" :size="45" :min-size="45">
            <div v-if="!display_article_view" class="overview-container">
              <div class="toolbar-container">
                <ToggleButton class='compare_toggle ' v-model="compare_mode" onIcon="pi pi-image" offIcon="pi pi-images"></ToggleButton>
                <div class="search-bar">
                  <SearchBar v-if="overview_constructed" :search_terms="entity_list" @entity_searched="handleSearch"></SearchBar>
                </div>
                <MyToolbar ref="toolbar" 
                @candidate_updated="updateNpList"
                @dataset_imported="datasetImported"  >
                </MyToolbar>
                <ToggleButton v-if="overview_constructed" class='overview-toggler ' v-model="overview_grid_mode" onIcon="pi pi-chart-line" offIcon="pi pi-table"></ToggleButton>
              </div>
              <i v-if="overview_constructing" class="pi pi-spin pi-spinner" 
              style="
              position:absolute;
              left: 45%;
              top: 30%;
              font-size: 3rem;
              z-index: 1000
              "></i> 
            <div class="overview-grid-container" v-if="overview_constructed && overview_grid_mode" >
              <SentimentScatter
                  v-for="(outlet, index) in enabled_outlet_set" :key="outlet" 
                  class="outlet-scatter"
                  :graph="graph_dict[outlet]"
                  :graph_index="index"
                  :id="`scatter-${index}`"
                  :article_num_threshold="article_num_threshold"
                  :segment_mode="segment_mode"
                  :segmentation="segment_sst"
                  :highlight_nodes="highlight_nodes"
                  :expanded="false"
                  :draggable="true"
                  @dragstart="handleDragScatter($event, index)"
                  @click="handleScatterClicked(index)"
              >
              </SentimentScatter>
              </div>
              <div class="overview-temporal-container" v-if="overview_constructed && !overview_grid_mode">
                <TemporalCoordinates class="overview-temporal-coord" 
                  :id="`overview_temporal`"
                  :article_bin_dict="outlet_article_bins_dict"
                  :highlight_object="highlight_outlet"
                  :color_dict="SstColors.outlet_color_dict"
                  :sst_threshold="segment_sst"
                ></TemporalCoordinates>
                <TemporalPathSelector 
                  :temporalBins="outlet_article_bins_dict"
                  v-model:selectedTargets="highlight_outlet"
                  :color_dict="SstColors.outlet_color_dict"
                >
                </TemporalPathSelector>
              </div>
              <div class="utilities-container">
                <div v-if="overview_constructed" class="slider-container">
                  <InputText class="threshold-input" v-model="article_num_threshold"></InputText>
                  <Button class="increment-button p-button-secondary" label="+"  @click="() => article_num_threshold=Math.min(article_num_threshold+=10, max_articles||100)"></Button>
                  <Button class="decrease-button p-button-secondary " label="-"  @click="() => article_num_threshold=Math.max(article_num_threshold-10, 0)"></Button>
                  <Slider v-model="article_num_threshold" :step="10" :min="0" :max="max_articles||100"></Slider>
                  <ColorSpectrum class="color-spectrum" v-if="overview_constructed" 
                  :color-scale="SstColors.article_num_color_scale"
                  ></ColorSpectrum>
                  <div class="indicator-container">
                    <div class="min_indicator">0</div>
                    <div class="max_indicator">{{max_articles || 100}}</div>
                  </div>
                </div>
                <div v-if="overview_constructed" class="segment-toggler-container">
                  <ToggleButton class='segment-toggler p-primary' v-model="segment_mode" onLabel="Segment" offLabel="Segment"></ToggleButton>
                </div>
              </div>
              <Legend v-if="overview_constructed" 
                id="segment_legend"
                class="segment-legend"
                :color_dict="SstColors.key_color_dict" 
                :filter="true" 
                :interactable="false"></Legend>
              </div>
              <div v-if="display_article_view" class="article-view-container">
                <ArticleView
                :articles="selected_articles">

                </ArticleView>
              </div>
            </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>
    <Tooltip v-if="tutorial_mode" class="tutorial_tooltip" :content="tutorial_intro[tutorial_step]"></Tooltip>
    "<span v-if="tutorial_mode" class="skip-button" 
    style='text-decoration:underline;'
    @click="tutorial_mode=false">Skip</span>", 
  </main>
</template>

<style scoped lang="scss">
* {
  --margin_left: 10px;
}
.splitter-outmost {
  width: 97vw;
  height: 95vh;
}
.overview-grid-container {
    display: grid;
    aspect-ratio: 3/2;
    max-height: 50%;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);  
    gap: 0;
}
.overview-grid-container > :deep(.scatter-container) {
  display:flex;
  aspect-ratio: 1;
}
/* :deep(.outlet-scatter:hover .outlet-scatterplot) {
    filter: brightness(80%);
    background-color: rgb(191, 189, 189);
} */
:deep(.outlet-scatter) {
  cursor: pointer;
}
:deep(.p-tabview) {
  height: 95vh !important;
  width: 100% !important;
}
:deep(.p-tabview-panels) {
  height: 100% !important;
  width: 100% !important;
}
:deep(.p-tabview-panel) {
  height: 100% !important;
  width: 100% !important;
}
:deep(.p-tabview-nav-container) {
  width: 100% !important;
}
.compare {
  max-width: 48%;
}
.expanded-section {
  display: flex;
  width: 55vw;
}
:deep(.p-tabview-panels:dragover) {
  background: #b8b8b8 !important;
}
.increment-button {
  display:inline-block;
}
.threshold-input {
  width: 60% !important;
  display:inline-block;
}
.increment-button, .decrease-button {
  width: 20% !important;
  display:inline-block;
}
.indicator-container {
  display: flex;
  justify-content: space-between;
}
.segment-toggler-container {
  width: fit-content;
}
.color-spectrum {
  width: inherit;
  height: 30px;
}
.utilities-container {
  width: 200px;
  display: inline-block;
  margin-left: var(--margin_left);
  overflow: hidden
}
:deep(.p-slider) {
  width: 100%;
  top: 13px;
}
:deep(.p-slider-handle) {
    border-radius: 10px !important; 
    background: white !important;
    z-index: 100;
} 
:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
  margin-left: unset !important;
}
:deep(.p-slider .p-slider-handle) {
  height: 1.3rem !important;
  width: 0.4rem !important;
  border: 2px solid black !important;
}
:deep(.p-slider-handle:hover) {
    background: #007bff !important;
} 
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}
.overview-temporal-coord {
  width: 500px;
  height: 300px;
}
.toolbar-container {
  margin-left: var(--margin_left); 
  height: 50px;
}
.toolbar-container > :deep(.p-button) {
  border-radius: 8px !important;
  // display: flex !important;
  margin: 3px !important;
}
.overview-temporal-container {
  display: flex;
}
.outlet-legend {
  position: absolute;
  top: 50%;
  right: 0%;
  transform: translateY(-50%);
  width:150px;
}
.segment-legend {
  width: 125px;
  height: 150px;
  margin-left: var(--margin_left);
}
:deep(.p-button:focus) {
  box-shadow: unset !important;
}
:deep(.overview-temporal-container > .temporal-selector-container) {
  margin-top: 28px;
}
.tutorial_tooltip {
  opacity: 0;
}
.skip-button {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}
.overview-toggler {
  float:right;
}
.search-bar {
  z-index:1000;
  display:inline-block;
  // transform: translateY(-50%);
  height: 50px;
}
 </style>

