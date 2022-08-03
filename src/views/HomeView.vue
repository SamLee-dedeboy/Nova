<script setup lang="ts">

import Filter from "../components/Filter.vue";
import Slider from "primevue/slider"
import InputText from "primevue/inputtext"
//import Target from "../components/Target.vue";
import TargetContainer from "../components/TargetContainer.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ToggleButton from 'primevue/togglebutton';
import ArticleView from "../components/ArticleView.vue";
import TopicSelection from "../components/TopicSelection.vue";
import TargetSelection from "../components/TargetSelection.vue"
import MonthSlider from "../components/MonthSlider.vue"
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

  // data() {
  //   return {
  //     original_dataset: {
  //       graphList:[],
  //       outlet_set:[],
  //       np_list:[]
  //     },
  //     dataset: {
  //       graphList:[],
  //       outlet_set:[],
  //       np_list:[]
  //     },
  //     outlet_set: [],
  //     enabled_outlet_set:[],
  //     selected_articles: [],
  //     np_list:[],
  //     selected_target:[],
  //     timeRange:[1,13],
  //     dataset_matadata: {},
  //     graph_constructed: false,
  //     graph_dict: {},
  //     scatterClicked: false,
  //     selectedScatterGraphs: [],
  //   }
const entity_mentions: Ref<any[]> = ref([])
let dataset_metadata = {}
let original_dataset = []
let timeRange: {start: number, end: number} 
const enabled_outlet_set: Ref<Set<string>> = ref(new Set())
const articles = ref([])
const article_dict = ref({})
const outlet_article_bins_dict = ref({})
const graph_dict = ref({})
const graph_constructed: Ref<boolean> = ref(false)
const entity_list: Ref<string[]> = computed(() => entity_mentions.value.map(entity_mention => entity_mention[0]))
const selectedScatterGraphs_left: Ref<ScatterOutletGraph[]> = ref([])
const selectedScatterGraphs_right: Ref<ScatterOutletGraph[]> = ref([])
const scatterClicked: Ref<boolean> = ref(false)
const entity_data = computed(() => entity_mentions.value.map(entity_mention => { return {"name": entity_mention[0], "num": entity_mention[1].length || 0}}))
const graph_constructing: Ref<boolean> = ref(false)
const max_articles: Ref<number> = ref(0)
const min_articles: Ref<number> = ref(0)
vue.provide('min_articles', min_articles)
vue.provide('max_articles', max_articles)
const compare_mode: Ref<boolean> = ref(false)
const segment_mode: Ref<boolean> = ref(false)
const article_num_threshold: Ref<number> = ref(10)
const highlight_outlet: Ref<string[]> = ref([])
const overview_mode: Ref<boolean> = ref(true)
const min_timestamp: Ref<string> = ref("")
const max_timestamp: Ref<string> = ref("")
vue.provide('min_timestamp', min_timestamp)
vue.provide('max_timestamp', max_timestamp)
const segment_sst: Ref<Sentiment2D> = ref({pos: 0.5, neg: 0.5}) 
vue.provide('segment_sst', {segment_sst, updateThreshold})
function updateThreshold(new_value) {
  segment_sst.value = new_value
}
// watch(() => segment_sst, (new_value, old_value) => {
//   console.log(segment_sst.value)
// }, {deep: true})

const temporalBins = ref({})
const node_article_id_dict = ref({})

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

function updateNpList(np_list) {
  // this.dataset = dataset
  // this.outlet_set = dataset.outlet_set
  // this.enabled_outlet_set = dataset.outlet_set
  // this.topic_list = Object.keys(dataset.topic_dict)
  entity_mentions.value = np_list
  dataset_metadata = this.$refs.toolbar.getMetaData()  
} 

function datasetImported(dataset) {
  graph_constructing.value = true
  setTimeout(() => {
    const promise = new Promise((resolve) => { 
      const outlet_article_dict = dataset.outlet_article_dict
      const entity_mentions = dataset.entity_mentions
      let {outlet_set, r_article_dict, r_article_bins_dict, r_min_timestamp, r_max_timestamp} = preprocess.processArticleDict(outlet_article_dict)
      outlet_article_bins_dict.value = r_article_bins_dict
      enabled_outlet_set.value = outlet_set
      min_timestamp.value = r_min_timestamp
      max_timestamp.value = r_max_timestamp
      // articles.value = normalized_articles
      article_dict.value = r_article_dict
      let {r_graph_dict, r_max_articles, r_min_articles, r_node_article_id_dict} = preprocess.constructEntityGraph(entity_mentions, article_dict.value)
      graph_dict.value = r_graph_dict
      max_articles.value = r_max_articles
      min_articles.value = r_min_articles
      node_article_id_dict.value = r_node_article_id_dict
      graph_constructed.value = true
      resolve(""); 
    })
    promise.then(() => graph_constructing.value = false)
  }, 10)

  // graph_constructing.value = true
  // setTimeout(() => {
  //   const promise = new Promise((resolve) => { processDataset(dataset); resolve(""); })
  //   promise.then(() => graph_constructing.value = false)
  // }, 1)
}

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
  graph_constructed.value = true
}

function updateEnabledOutlet(outlet_set_info) {
  enabled_outlet_set.value = outlet_set_info.filter(outlet => outlet.enabled).map(outlet => outlet.outlet)
}

// function queryDataset(article_list) {
//   console.log(article_list.toString())
//   const url = "http://ec2-35-160-171-6.us-west-2.compute.amazonaws.com:8081/v1/graphql"

//   const query = `
//     query MyQuery {
//       Article(where: {id: {_in: [${article_list}]}}) {
//         id
//         headline
//         journal
//         timestamp
//         Analysis_mentioned_entities {
//           mentions
//         }
//         Analysis_sentiments {
//           sentiment
//         }
//         content
//       }
//     }
//   ` 
//   this.axios({
//       url: url,
//       method: 'post',
//       data: {
//         query: query,
//       }
//   })   
//   .then(response => {
//     console.log("done")
//     console.log(response)
//   })
// }

// function updateTarget(target) {
//   const index = entity_list.indexOf(target) 

//   this.selected_target = [target]
//   const article_list = this.np_list[index][1]
//   // TODO: query data from graphql
//   // const dataset = this.queryDataset(article_list)
//   const target_articles = this.$refs.toolbar.getData(target)

//   this.original_dataset = target_articles
//   // sort by date and update time range
//   target_articles.sort((a1, a2) => Date.parse(a1.timestamp) > Date.parse(a2.timestamp))
//   const startMonth = parseInt(target_articles[0].timestamp.split('-')[1])
//   const endMonth = parseInt(target_articles[target_articles.length-1].timestamp.split('-')[1])
//   this.timeRange = [startMonth, endMonth+1]
//   this.updateDicts(target_articles)
// }

function handleScatterClicked(index) {
    // const clicked_scatter = entity_mentions.value[index][0]
    const clicked_scatter = Array.from(enabled_outlet_set.value)[index]

    selectedScatterGraphs_left.value.push(graph_dict.value[clicked_scatter])
    const dropped_from = selectedScatterGraphs_right.value.findIndex(element => element.title === clicked_scatter)
    if(dropped_from > -1) 
      selectedScatterGraphs_right.value.splice(dropped_from, 1)

    scatterClicked.value = true
    const button_next = document.getElementsByClassName("p-tabview-nav-next")[0] || undefined
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
    if(dropped_from > -1) 
      selectedScatterGraphs_left.value.splice(dropped_from, 1)
  }
  scatterClicked.value = true
  const button_next = document.getElementsByClassName("p-tabview-nav-next")[0] || undefined
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
    // graph_dict.value[entity.text] = outlet_graph
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

</script>


<template>
  <main>
    <Splitter class="splitter-outmost" layout="vertical">
      <SplitterPanel id="overview-section" class="flex align-items-center justify-content-center" :size="100">
        <Splitter>
          <SplitterPanel class="expanded-section flex align-items-center justify-content-center" :size="55" 
            >
            <TargetContainer
            :class="{compare: compare_mode}"
            compare_part="panel-left"
            :articles="articles"
            :enabled_outlet_set="enabled_outlet_set"
            v-model:selectedScatters="selectedScatterGraphs_left"
            :selectedTimeRange="timeRange"
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            v-model:segmentation="segment_sst"
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
            :class="{compare: compare_mode}"
            compare_part="panel-right"
            :articles="articles"
            :enabled_outlet_set="enabled_outlet_set"
            v-model:selectedScatters="selectedScatterGraphs_right"
            :temporalBins="temporalBins"
            :selectedTimeRange="timeRange"
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            v-model:segmentation="segment_sst"
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
            <div class="toolbar-container">
              <ToggleButton class='compare_toggle ' v-model="compare_mode" onIcon="pi pi-image" offIcon="pi pi-images"></ToggleButton>
              <MyToolbar ref="toolbar" 
              @candidate_updated="updateNpList"
              @dataset_imported="datasetImported"  >
              </MyToolbar>
              <ToggleButton v-if="graph_constructed" class='overview-toggler ' v-model="overview_mode" onIcon="pi pi-chart-line" offIcon="pi pi-table"></ToggleButton>
            </div>
            <i v-if="graph_constructing" class="pi pi-spin pi-spinner" 
            style="
            position:absolute;
            left: 45%;
            top: 30%;
            font-size: 3rem;
            z-index: 1000
            "></i> 
          <div class="entity-grid-container" v-if="graph_constructed && overview_mode" >
                <!-- v-for="(entity, index) in entity_list" :key="entity"  -->
            <SentimentScatter
                v-for="(outlet, index) in enabled_outlet_set" :key="outlet" 
                class="outlet-scatter"
                :graph="graph_dict[outlet]"
                :graph_index="index"
                :id="`scatter-${index}`"
                :max_articles="max_articles"
                :min_articles="min_articles"
                :article_num_threshold="article_num_threshold"
                :segment_mode="segment_mode"
                v-model:segmentation="segment_sst"
                style="cursor: pointer"
                :expanded="false"
                :draggable="true"
                @dragstart="handleDragScatter($event, index)"
                @click="handleScatterClicked(index)"
            >
            </SentimentScatter>
            </div>
            <div class="temporal-container" v-if="graph_constructed && !overview_mode">
              <TemporalCoordinates class="temporal-coord" 
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
              <div v-if="graph_constructed" class="slider-container">
                <InputText class="threshold-input" v-model="article_num_threshold" />
                <Button class="increment-button p-button-secondary" label="+"  @click="() => article_num_threshold=Math.min(article_num_threshold+=10, max_articles||100)"></Button>
                <Button class="decrease-button p-button-secondary " label="-"  @click="() => article_num_threshold=Math.max(article_num_threshold-10, 10)"></Button>
                <Slider v-model="article_num_threshold" :step="1" :min="10" :max="max_articles||100"></Slider>
                <ColorSpectrum class="color-spectrum" v-if="graph_constructed" 
                :color-scale="SstColors.article_num_color_scale"
                ></ColorSpectrum>
                <div class="indicator-container">
                  <div class="min_indicator">10</div>
                  <div class="max_indicator">{{max_articles || 100}}</div>
                </div>
              </div>
              <div v-if="graph_constructed" class="segment-toggler-container">
                <ToggleButton class='segment-toggler p-primary' v-model="segment_mode" onLabel="Segment" offLabel="Segment"></ToggleButton>
              </div>
            </div>
            <Legend v-if="graph_constructed" 
            id="segment_legend"
            class="segment-legend"
            :color_dict="SstColors.key_color_dict" 
            :filter="true" 
            :interactable="false"></Legend>
            <!-- <div class="selection_container" style="display:flex">
              <TargetSelection v-if="np_list.length!=0" :dataset_metadata="dataset_metadata" :targets="entity_data" @target-selected="updateTarget"></TargetSelection>
              <TopicSelection  v-if="topic_list.length!=0"  :topics="topic_list" @topic-selected="updateTopic" style="flex:0.5"></TopicSelection>
            </div> -->
            <!-- <Filter v-if="selected_target.length!=0" :outlet_set="outlet_set"
            @outlet-filtered="updateEnabledOutlet"
            ></Filter>
          <MonthSlider v-if="selected_target.length!=0" v-model:selectedRange="timeRange" ></MonthSlider> -->

          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
      <!-- <SplitterPanel id='detail-section' class="flex align-items-center justify-content-center" :size="22">
        <p> detail </p>
      </SplitterPanel> -->
    </Splitter>
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
.entity-grid-container {
    display: grid;
    aspect-ratio: 3/2;
    max-height: 50%;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);  
    gap: 0;
}
.entity-grid-container > :deep(.scatter-container) {
  display:flex;
  aspect-ratio: 1;
}
/* :deep(.outlet-scatter:hover .outlet-scatterplot) {
    filter: brightness(80%);
    background-color: rgb(191, 189, 189);
} */
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
.temporal-coord {
  width: 500px;
  height: 300px;
}
.toolbar-container {
  display: flex;
  margin-left: var(--margin_left); 
}
.toolbar-container > :deep(.p-button) {
  border-radius: 8px !important;
  display: flex !important;
  margin: 3px !important;
}
.temporal-container {
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
:deep(.temporal-container > .temporal-selector-container) {
  margin-top: 28px;
}
 </style>

