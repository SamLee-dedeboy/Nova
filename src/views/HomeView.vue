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
import Tooltip from "../components/Tooltip.vue";
import SearchBar from "../components/SearchBar.vue";
import tutorial_intro_json from "../assets/tutorial_intro.json"

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
const outlet_article_dict = ref({})
const outlet_article_num_dict = ref({})
vue.provide("outlet_article_num_dict", outlet_article_num_dict)
const entity_cooccurrences_groupby_outlet = ref({})
const graph_dict = ref({})
const graph_constructed: Ref<boolean> = ref(false)
const entity_list: Ref<string[]> = computed(() => entity_mentions.value?.["CNN"].map(entity_mention => entity_mention.entity))
const selectedScatterGraphs_left: Ref<ScatterOutletGraph[]> = ref([])
const selectedScatterGraphs_right: Ref<ScatterOutletGraph[]> = ref([])
const scatterClicked: Ref<boolean> = ref(false)
const entity_data = computed(() => entity_mentions.value.map(entity_mention => { return {"name": entity_mention[0], "num": entity_mention[1].length || 0}}))
const graph_constructing: Ref<boolean> = ref(true)
const max_articles: Ref<number> = ref(0)
const min_articles: Ref<number> = ref(0)
vue.provide('min_articles', min_articles)
vue.provide('max_articles', max_articles)
const compare_mode: Ref<boolean> = ref(false)
vue.provide('compare_mode', compare_mode)
const segment_mode: Ref<boolean> = ref(false)
const article_num_threshold: Ref<number> = ref(20)
const highlight_outlet: Ref<string[]> = ref([])
const overview_mode: Ref<boolean> = ref(true)
const min_timestamp: Ref<string> = ref("")
const max_timestamp: Ref<string> = ref("")
vue.provide('min_timestamp', min_timestamp)
vue.provide('max_timestamp', max_timestamp)
const segment_sst: Ref<Sentiment2D> = ref({pos: 0.5, neg: 0.5}) 
const tutorial_mode = ref(false)
const tutorial_step = ref(0)
vue.provide('tutorial_mode', tutorial_mode)
vue.provide('tutorial_step', tutorial_step)
const tutorial_intro: Ref<string[]> = ref(tutorial_intro_json.map(step => _.sum(step.content)))
vue.provide('segment_sst', {segment_sst, updateThreshold})
const highlight_nodes: Ref<string[]> = ref([])

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
vue.watch(graph_constructed, (new_value, old_value) => {
    nextTick(() => {
      if(tutorial_mode.value) {
        const grid_container = document.querySelector(".entity-grid-container") as HTMLElement
        grid_container.style["max-height"] = "44%"
        grid_container.style['grid-template-columns'] = "repeat(1, 0.5fr)"
        grid_container.style["transition"] = "height 0.5s"
        const first_scatter = document.querySelector("#scatter-0") as HTMLElement
        first_scatter.style['cursor'] = "unset"

        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style["opacity"] = "1"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style["opacity"] = "1"
        const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
        overview_toggler.style["opacity"] = "0"
        const segment_toggler = document.querySelector(".segment-toggler-container") as HTMLElement
        segment_toggler.style["opacity"] = "0"
        const segment_legend = document.querySelector(".legend-container") as HTMLElement
        segment_legend.style["opacity"] = "0"
        const utilities_container = document.querySelector(".utilities-container") as HTMLElement
        utilities_container.style["opacity"] = "0"
      }
    })
})
vue.watch(overview_mode, (new_value, old_value) => {
    if(tutorial_mode.value && tutorial_step.value === 3) {
      tutorial_intro.value[3] = 
      "The TemporalView shows monthly sentiment changes on each outlet with two <br>" +
      "parallel line charts. <br>" +
      "x-axis encodes month, y-axis encodes " +
      "<span style='background-color:rgb(29, 127, 119);filter:brightness(140%)'>&nbsppositive </span>" + 
      ", " + 
      "<span style='background-color:rgb(165, 106, 29);filter:brightness(140%)'>&nbspnegative </span>" + 
      " or " +
      "<span style='background-color:grey;filter:brightness(140%)'>&nbspneutral </span>" + 
      " sentiment. <br>" +
      "You can select any outlet to highlight it in the temporal view. <br> " +
      "<br>" +
      "<img src='src/assets/tutorial/temporal.png' width='498' height='221'> <br>"
      nextTick(() => {
        if(!overview_mode.value) {
          const tCoord_container = document.querySelector(".tCoord-container") as HTMLElement
          tCoord_container.style["width"] = "750px"
          tCoord_container.style["height"] = "450px"
          const temporal_selector = document.querySelector(".temporal-selector-container") as HTMLElement
          temporal_selector.style["margin-top"] = "45px"
          const selector_text = document.querySelector(".selector-option") as HTMLElement
          selector_text.style["font-size"] = "x-large"
          const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
          tutorial_tooltip.style.left = "64%"
          tutorial_tooltip.style.top = "12%"
          const skip_button = document.querySelector(".skip-button") as HTMLElement
          skip_button.style.left = "98%"
          skip_button.style.top = "61%"
        }
      })
    } else {
        nextTick(() => {
          if(!overview_mode.value) {
            const tCoord_container = document.querySelector(".tCoord-container") as HTMLElement
            tCoord_container.style["width"] = "500px"
            tCoord_container.style["height"] = "300px"
            const temporal_selector = document.querySelector(".temporal-selector-container") as HTMLElement
            temporal_selector.style["margin-top"] = "28px"
            const selector_text = document.querySelector(".selector-option") as HTMLElement
            selector_text.style["font-size"] = "x-small"
          }
        })
    }
})
vue.watch(compare_mode, (new_value, old_value) => {
  if(tutorial_mode.value && tutorial_step.value === 6) {
      tutorial_intro.value[6] = 
      "Drag & drop any scatter to the right panel. <br>" 
      nextTick(() => {
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "36%"
        tutorial_tooltip.style.top = "-2%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "54%"
        skip_button.style.top = "2.5%"
      })
  }
})
vue.watch(tutorial_mode, (new_value, old_value) => {
      const left_section = document.querySelector(".p-splitter-panel.expanded-section") as HTMLElement
      const right_section = document.querySelector(".p-splitter-panel.sidebar") as HTMLElement
      left_section.style.setProperty("flex-basis", "calc(55% - 4px)")
      right_section.style.setProperty("flex-basis", "calc(45% - 4px)")
      const grid_container = document.querySelector(".entity-grid-container") as HTMLElement
      grid_container.style["max-height"] = "50%"
      grid_container.style['grid-template-columns'] = "repeat(3, 1fr)"

      const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
      tutorial_tooltip.style["opacity"] = "0"
      const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
      overview_toggler.style["opacity"] = "1"
      overview_toggler.style.left = "unset"
      const segment_toggler = document.querySelector(".segment-toggler-container") as HTMLElement
      segment_toggler.style["opacity"] = "1"
      const segment_legend = document.querySelector(".legend-container") as HTMLElement
      segment_legend.style["opacity"] = "1"
      const utilities_container = document.querySelector(".utilities-container") as HTMLElement
      utilities_container.style["opacity"] = "1"
      const compare_toggler = document.querySelector(".compare_toggle") as HTMLElement
      compare_toggler.style["opacity"] = "1"
      const search_bar_container = document.querySelector(".search-bar") as HTMLElement
      search_bar_container.style["opacity"] = "1"


})
vue.watch(selectedScatterGraphs_left, (new_value, old_value) => {
  if(tutorial_mode.value && tutorial_step.value === 4) {
    tutorial_intro.value[4] = 
      "You can open multiple scatterplots at the same time and use the tabs to switch among them."
    nextTick(() => {
      const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
      tutorial_tooltip.style.left = "0%"
      tutorial_tooltip.style.top = "4%"
      const skip_button = document.querySelector(".skip-button") as HTMLElement
      skip_button.style.left = "40.5%"
      skip_button.style.top = "8.5%"

    })
  }

  if(tutorial_mode.value && tutorial_step.value < 8) {
    nextTick(() => {
      const show_temporal_btns = document.querySelectorAll(".show-temporal") as NodeListOf<HTMLElement>
      show_temporal_btns.forEach(btn => btn.style["opacity"] = "0")
    })
  }
}, {deep:true})
vue.watch(selectedScatterGraphs_right, (new_value, old_value) => {
  // closing tabs
  if(!new_value.find(scatter => scatter.type === ViewType.Temporal)) {
    temporalBins.value = {}
  }

  if(tutorial_mode.value && tutorial_step.value < 7) {
    nextTick(() => {
      const show_temporal_btns = document.querySelectorAll(".show-temporal") as NodeListOf<HTMLElement>
      show_temporal_btns.forEach(btn => btn.style["opacity"] = "0")
    })
  }
  if(tutorial_mode.value && tutorial_step.value === 7) {
      if(selectedScatterGraphs_right.value[selectedScatterGraphs_right.value.length-1].type === ViewType.OutletScatter) {
      tutorial_intro.value[7] = 
        "Try clicking on the temporal button."
        nextTick(() => {
          const show_temporal_btns = document.querySelectorAll(".show-temporal") as NodeListOf<HTMLElement>
          show_temporal_btns.forEach(btn => btn.style["opacity"] = "1")
          const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
          tutorial_tooltip.style.left = "54%"
          tutorial_tooltip.style.top = "10%"
          const skip_button = document.querySelector(".skip-button") as HTMLElement
          skip_button.style.left = "71%"
          skip_button.style.top = "12%"
        })
      }
  }
  if(tutorial_mode.value && tutorial_step.value === 6) {
    tutorial_intro.value[6] = 
      "You can also drag the tabs directly."
    nextTick(() => {
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "42%"
        tutorial_tooltip.style.top = "-2%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "59%"
        skip_button.style.top = "-2.5%"

    })

  }
}, {deep:true})
vue.onMounted(() => {
  if(tutorial_mode.value) {
    document.addEventListener("keydown", (event) => {
      if(tutorial_mode.value) {
        if(event.keyCode === 39)
          tutorial_step.value += 1
        // if(event.keyCode === 37)
          // tutorial_step.value -= 1
      }
    })
    const left_section = document.querySelector(".p-splitter-panel.expanded-section") as HTMLElement
    const right_section = document.querySelector(".p-splitter-panel.sidebar") as HTMLElement
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    left_section.style["flex-basis"] = "0"
    right_section.style["flex-basis"] = "100%"
    tutorial_tooltip.style.position = "absolute"
    tutorial_tooltip.style.width = "fit-content"
    tutorial_tooltip.style.left = "50%"
    tutorial_tooltip.style.top = "18%"
    tutorial_tooltip.style["transition"] = "opacity 1s, width 1s, height 1s, left 1s, top 1s, right 1s"
    const compare_toggler = document.querySelector(".compare_toggle") as HTMLElement
    compare_toggler.style["opacity"] = "0"
    const search_bar_container = document.querySelector(".search-bar") as HTMLElement
    search_bar_container.style["opacity"] = "0"
    compare_toggler.style["opacity"] = "0"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "84%"
    skip_button.style.top = "77%"
    skip_button.style["transition"] = "opacity 1s, width 1s, height 1s, left 1s, top 1s, right 1s"
  }
})
vue.watch(tutorial_step, (new_value, old_value) => {
  // introduce scatterplot
  if(new_value === 0) {
    const grid_container = document.querySelector(".entity-grid-container") as HTMLElement
    grid_container.style["max-height"] = "44%"
  }

  // introduce outlet scatter grid
  if(new_value === 1) {
    const grid_container = document.querySelector(".entity-grid-container") as HTMLElement
    grid_container.style['grid-template-columns'] = "repeat(3, 1fr)"
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style.right = "0px"
    tutorial_tooltip.style.left = "auto"
    tutorial_tooltip.style.top = "20px"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "98%"
    skip_button.style.top = "59%"

  }
  // introduce temporal 
  if(new_value === 2) {
    const utilities_container = document.querySelector(".utilities-container") as HTMLElement
    utilities_container.style["transition"] = "opacity 1s"
    utilities_container.style["opacity"] = "1"
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style.right = "auto"
    tutorial_tooltip.style.left = "20%"
    tutorial_tooltip.style.top = "80%"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "56.5%"
    skip_button.style.top = "93%"
  }
  if(new_value === 3) {
    const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
    overview_toggler.style["transition"] = "opacity 1s"
    overview_toggler.style["opacity"] = "1"
    overview_toggler.style.left = "-42%"
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style.left = "60%"
    tutorial_tooltip.style.top = "1%"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "89%"
    skip_button.style.top = "3%"
  }
  if(new_value === 4) {
    const left_section = document.querySelector(".p-splitter-panel.expanded-section") as HTMLElement
    const right_section = document.querySelector(".p-splitter-panel.sidebar") as HTMLElement
    right_section.style["transition"] = "flex-basis 1s"
    left_section.style.setProperty("flex-basis", "calc(55% - 4px)")
    right_section.style.setProperty("flex-basis", "calc(45% - 4px)")
    const grid_container = document.querySelector(".entity-grid-container") as HTMLElement
    if(grid_container) {
      grid_container.style["max-height"] = "50%"
    }
    const tCoord_container = document.querySelector(".tCoord-container") as HTMLElement
    if(tCoord_container) {
      tCoord_container.style["width"] = "500px"
      tCoord_container.style["height"] = "300px"
      const temporal_selector = document.querySelector(".temporal-selector-container") as HTMLElement
      temporal_selector.style["margin-top"] = "28px"
      const selector_text = document.querySelector(".selector-option") as HTMLElement
      selector_text.style["font-size"] = "x-small"
    }
    const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
    overview_toggler.style.left = "unset"
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style.left = "9%"
    tutorial_tooltip.style.top = "7%"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "48.5%"
    skip_button.style.top = "18%"
  }
  if(new_value === 5) {
    const segment_toggler = document.querySelector(".segment-toggler-container") as HTMLElement
    segment_toggler.style["transition"] = "opacity 1s"
    segment_toggler.style["opacity"] = "1"
    const segment_legend = document.querySelector(".legend-container") as HTMLElement
    segment_legend.style["transition"] = "opacity 1s"
    segment_legend.style["opacity"] = "1"
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style.left = "66%"
    tutorial_tooltip.style.top = "70%"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "98%"
    skip_button.style.top = "93%"
  }
  if(new_value === 6) {
    const compare_toggler = document.querySelector(".compare_toggle") as HTMLElement
    compare_toggler.style["transition"] = "opacity 1s"
    compare_toggler.style["opacity"] = "1"
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style.left = "55%"
    tutorial_tooltip.style.top = "-3%"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "79.5%"
    skip_button.style.top = "-1%"
  }
  if(new_value === 7) {
    // allow node click
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style.left = "55%"
    tutorial_tooltip.style.top = "-3%"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.left = "90.5%"
    skip_button.style.top = "2%"
  }
  if(new_value === 8) {
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style.opacity = "0"
  }
  if(new_value === 9) {
    // show finish notes
    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style["opacity"] = "0"
    tutorial_mode.value = false
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
  scatterClicked.value = true
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
      <SplitterPanel id="overview-section" class="flex align-items-center justify-content-center" :size="100">
        <Splitter>
          <SplitterPanel ref="expanded_section" class="expanded-section flex align-items-center justify-content-center" :size="55" 
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
            <div class="toolbar-container">
              <ToggleButton class='compare_toggle ' v-model="compare_mode" onIcon="pi pi-image" offIcon="pi pi-images"></ToggleButton>
              <div class="search-bar">
                <SearchBar v-if="graph_constructed" :search_terms="entity_list" @entity_searched="handleSearch"></SearchBar>
              </div>
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
                <InputText class="threshold-input" v-model="article_num_threshold"></InputText>
                <Button class="increment-button p-button-secondary" label="+"  @click="() => article_num_threshold=Math.min(article_num_threshold+=10, max_articles||100)"></Button>
                <Button class="decrease-button p-button-secondary " label="-"  @click="() => article_num_threshold=Math.max(article_num_threshold-10, 0)"></Button>
                <Slider v-model="article_num_threshold" :step="10" :min="0" :max="max_articles||100"></Slider>
                <ColorSpectrum class="color-spectrum" v-if="graph_constructed" 
                :color-scale="SstColors.article_num_color_scale"
                ></ColorSpectrum>
                <div class="indicator-container">
                  <div class="min_indicator">0</div>
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
.temporal-coord {
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

