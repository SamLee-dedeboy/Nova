<script setup lang="ts">
import OutletWeightSlider from "../components/OutletWeightSlider.vue";
import Filter from "../components/deprecated/Filter.vue";
import Slider from "primevue/slider"
import InputText from "primevue/inputtext"
//import Target from "../components/Target.vue";
import PanelContainer from "../components/PanelContainer.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ToggleButton from 'primevue/togglebutton';
import TopicSelection from "../components/deprecated/TopicSelection.vue";
import TargetSelection from "../components/deprecated/TargetSelection.vue"
import MonthSlider from "../components/deprecated/MonthSlider.vue"
// import * as preprocess from "../components/preprocessUtils"
import { watch, computed, onMounted, PropType, ref, Ref, nextTick, } from 'vue'
import * as vue from 'vue'
import * as typeUtils from "../types"
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
import EntityInfoView from "../components/EntityInfoView.vue"
import tutorial_intro_json from "../assets/tutorial/tutorial_intro.json"
import * as tutorial from "../components/TutorialUtils"
import { resolve } from "path";
import SelectButton  from "../components/SelectButton.vue";


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
      type: typeUtils.ViewType.EntityScatter,
      data: scatter_data
    }
    res_dict[outlet] = scatter_view
  })
  return res_dict
})
const overall_scatter_data_loading: Ref<boolean> = ref(true)
const grouped_scatter_data_loaded: Ref<boolean> = ref(false)
const overview_constructed: Ref<boolean> = ref(false)
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
 * entity list
 */
const entity_list: Ref<string[]> = ref([])

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
 * nested dictionary:  { [entity_1]: { [entity_2]: Article_id[ ] } } 
 */
const entity_cooccurrences_dict = ref({})



/**
 * Array: ScatterOutletGraph[]. \
 * Stores the graphs in left panel.
 */
const selectedScatterViews_left: Ref<typeUtils.PanelView[]> = ref([])
/**
 * Array: ScatterOutletGraph[]. \
 * Stores the graphs in left panel.
 */
const selectedScatterViews_right: Ref<typeUtils.PanelView[]> = ref([])



//
// preprocessed global data used across components
//


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
 * flag for fetching article
 */
const fetching_article: Ref<boolean> = ref(false)

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
const temporal_mode: Ref<boolean> = ref(false)

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
const segment_sst: Ref<typeUtils.Sentiment2D> = ref({pos: 0.5, neg: 0.5}) 
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
 * Used in PanelContainer to store all temporal view data.
 */
// const temporalBins = ref({})

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
// const selected_articles: Ref<typeUtils.Article[]> = ref([])
const selected_entity: Ref<typeUtils.EntityInfo> = ref(new typeUtils.EntityInfo())

/**
 * dict of outlet weight. \
 * { [id: string]: number }
 */
const outlet_weight_dict: Ref<any> = ref({})

/**
 * flags for hex views being active
 */
const co_hex_active_left: Ref<boolean> = ref(false)
const co_hex_active_right: Ref<boolean> = ref(false)
const show_co_button = computed(() => {
  return co_hex_active_left.value && co_hex_active_right.value && compare_mode.value
})

const cohex_mode: Ref<any> = ref(null)
const cohex_options: Ref<string[]> = ref(["Common", "Diff"])
const cached_nodes: Ref<typeUtils.ScatterNode[]> = ref([])

/**
 * refs for panel left & right
 */
const panel_left: Ref<any> = ref(null)
const panel_right: Ref<any> = ref(null)

vue.watch(cohex_mode, (new_value, old_value) => {
  if(new_value === "Common")
    showCoHexCommon()
  if(new_value === "Diff")
    showCoHexDiff()
  if(new_value === null) 
    showOriginalCoHex()
})
vue.watch(overview_constructed, (new_value, old_value) => {
  if(tutorial_mode.value) {
    tutorial.updateOverviewGrid()
  }
})

vue.watch(temporal_mode , (new_value, old_value) => {
  tutorial.handleToggleTemporal(tutorial_intro, temporal_mode, {tutorial_mode, tutorial_step})
})

vue.watch(compare_mode, (new_value, old_value) => {
  tutorial.handleToggleCompareMode(tutorial_intro, {tutorial_mode, tutorial_step})
})

vue.watch(tutorial_mode, (new_value, old_value) => {
  if(old_value === true && new_value === false) {
    tutorial.handleSkipTutorial()
  }
})
vue.watch(selectedScatterViews_left, (new_value, old_value) => {
  tutorial.handleAddToLeftPanel(tutorial_intro, {tutorial_mode, tutorial_step})
}, {deep:true})


vue.watch(selectedScatterViews_right, (new_value, old_value) => {
  // 
  // closing tabs
  //


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
      if(selectedScatterViews_right.value[selectedScatterViews_right.value.length-1].type === typeUtils.ViewType.OutletScatter) {
        tutorial.introduceTemporalButton(tutorial_intro)
      }
  }



}, {deep:true})

// prepare for tutorial
vue.onMounted(async() => {
  tutorial.prepareComponentsForTutorial({tutorial_mode, tutorial_step})
  const promiseArray: any[] = []
  promiseArray.push(new Promise((resolve) => {
      fetch(`${server_address}/overview/scatter/overall/data`)
      .then(res => res.json())
      .then(json => {
        overview_overall_scatter_data.value = json
        const overall_scatter_view: typeUtils.EntityScatterView = {
          title: "Overall",
          type: typeUtils.ViewType.EntityScatter,
          data: overview_overall_scatter_data.value 
        }
        selectedScatterViews_left.value.push(overall_scatter_view)
        console.log("overall scatter fetched")
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
      enabled_outlet_set.value.forEach(outlet => {
        outlet_weight_dict.value[outlet] = 1
      })
      console.log("outlet_set fetched")
      resolve("success")
    })
  }))
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
function handleScatterClicked(index) {
    const clicked_scatter = Object.keys(grouped_scatter_view_dict.value)[index]

    selectedScatterViews_left.value.push(grouped_scatter_view_dict.value[clicked_scatter])
    const dropped_from = selectedScatterViews_right.value.findIndex(element => element.title === clicked_scatter)
    if(dropped_from > -1) 
      selectedScatterViews_right.value.splice(dropped_from, 1)

    const button_next = document.getElementsByClassName("p-tabview-nav-next")[0] as HTMLElement || undefined
    if(button_next != undefined) {
      button_next.click()
    }
}

function handleDragOutletScatter(evt, index) {
  evt.dataTransfer.dropEffect = 'move'
  evt.dataTransfer.effectAllowed = 'move'
  const dragged_scatter = Object.keys(grouped_scatter_view_dict.value)[index]

  const scatter = grouped_scatter_view_dict.value[dragged_scatter]
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
  const t0 = performance.now()
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
    selectedScatterViews_left.value.push(scatter)
    const dropped_from = selectedScatterViews_right.value.findIndex(element => element.title === scatter.title)
    if(dropped_from > -1) 
      selectedScatterViews_right.value.splice(dropped_from, 1)
  }
  else if(e.target.classList.contains("panel-right") || e.target.parentNode.classList.contains("panel-right")) {
    selectedScatterViews_right.value.push(scatter)
    const dropped_from = selectedScatterViews_left.value.findIndex(element => element.title === scatter.title)
  }

  const button_next = document.getElementsByClassName("p-tabview-nav-next")[0] as HTMLElement || undefined
  if(button_next != undefined) {
    button_next.click()
  }
  const t1 = performance.now()
  console.log("handle Drop:", t1-t0)
}

async function handleEntityClicked({title, type, d}: {title: string, type: typeUtils.ViewType, d: typeUtils.ScatterNode}) {
  if(type === typeUtils.ViewType.OutletScatter) {
    // construct outlet graph
    const entity_name = d.text.split("-")[0]
    let outlet_scatter_view: typeUtils.OutletScatterView = {title: entity_name, type: typeUtils.ViewType.OutletScatter, data: []}
    enabled_outlet_set.value.forEach(outlet => {
      const scatter = scatter_dict.value[outlet]
      // find entity node in this graph
      let entity_in_outlet: typeUtils.ScatterNode = _.cloneDeep(scatter.data.find(node => node.text.split("-")[0] === entity_name))
      || { text: outlet, articles: 0, pos_sst: 0, neg_sst: 0}
      entity_in_outlet.text = `${entity_name}-${outlet}`
      outlet_scatter_view.data.push(entity_in_outlet)
    })
    selectedScatterViews_right.value.push(outlet_scatter_view)
    return
  }

  if(type === typeUtils.ViewType.Temporal) {
    // construct outlet-entity pair temporal graph

    // get outlet-entity pair articles
    const article_ids = node_article_id_dict.value[d.text]
    const articles = preprocess.idsToArticles(article_ids, article_dict.value)

    // generate bins by month
    const articles_binBy_month = preprocess.binArticlesByMonth(articles)
    const temporalBins = new typeUtils.TemporalBins()
    temporalBins[d.text] = articles_binBy_month
    let temporal_view: typeUtils.TemporalView= {title: `t-${d.text}`, type: typeUtils.ViewType.Temporal, data: temporalBins}
    selectedScatterViews_right.value.push(temporal_view)
    return
  }
  
  if(type === typeUtils.ViewType.CooccurrHex) {
    const entity = d.text.split("-")[0]
    const outlet = d.text.split("-")[1]
    cached_nodes.value.push(d)

    const path_overall_or_grouped = ((title === "Overall")? "overall":"grouped")
    await fetch(`${server_address}/hexview/${path_overall_or_grouped}/${d.text}`)
      .then(res => res.json())
      .then(json => {
        const cooccurrences = json
        const hex_view: typeUtils.CooccurrHexView = {
          title: `co-${d.text}`,
          type: typeUtils.ViewType.CooccurrHex,
          data: cooccurrences,
        }
        selectedScatterViews_left.value.push(hex_view)
        console.log("cooccurr hex fetched")
      })
    fetch_articles(d)
    return
  }
  if(type === typeUtils.ViewType.Article) {
    // get article data
    const article_ids = node_article_id_dict.value[d.text]
    const articles = preprocess.idsToArticles(article_ids, article_dict.value)
    selected_entity.value = {
      name: d.text.split("-")[0],
      outlet: d.text.split("-")[1],
      sst_ratio: {
        pos_artcs: d.pos_article_ids.length,
        neg_artcs: d.neg_article_ids.length,
        pos: d.pos_sst,
        neg: d.neg_sst,
      },
      articles: articles
    }
    display_article_view.value = true
    
    // get outlet data and show outlet view
    const entity_name = d.text.split("-")[0]
    let outlet_scatter_view_data: typeUtils.ScatterNode[] = []
    let temporal_bins = new typeUtils.TemporalBins()
    enabled_outlet_set.value.forEach(outlet => {
      const scatter = scatter_dict.value[outlet]
      // find entity node in this graph
      let entity_data_in_outlet: typeUtils.ScatterNode = _.cloneDeep(scatter.data.find(node => node.text.split("-")[0] === entity_name))
      || { text: outlet, articles: 0, pos_sst: 0, neg_sst: 0}
      outlet_scatter_view_data.push(entity_data_in_outlet)

      // get temporal data and show temporal view
      // & generate bins by month
      const other_outlet_article_ids = node_article_id_dict.value[entity_data_in_outlet.text]
      const other_outlet_articles = preprocess.idsToArticles(other_outlet_article_ids, article_dict.value)
      const other_outlet_articles_binBy_month = preprocess.binArticlesByMonth(other_outlet_articles)
      temporal_bins[entity_data_in_outlet.text] = other_outlet_articles_binBy_month
    })
    
    let entity_detail_view: typeUtils.DetailView = {
      title: `Detail-${entity_name}`, 
      type: typeUtils.ViewType.Detail, 
      data: {
        outlet_scatter_data: outlet_scatter_view_data, 
        temporal_data: temporal_bins
      }}
    selectedScatterViews_right.value.push(entity_detail_view)
  }

}

function handleShowTemporal(nodes, title) {
    compare_mode.value = true 
    const temporal_bins = new typeUtils.TemporalBins()
    nodes.forEach(node => {
      const article_ids = node_article_id_dict.value[node.text]
      const articles = preprocess.idsToArticles(article_ids, article_dict.value)
      const articles_binBy_month = preprocess.binArticlesByMonth(articles)
      temporal_bins[node.text] = articles_binBy_month
      // TODO: replace deep clone 
      // temporalBins.value = _.cloneDeep(temporalBins.value)
    })
    let temporal_view: typeUtils.TemporalView= {title: `t-${title}`, type: typeUtils.ViewType.Temporal, data: temporal_bins}
    selectedScatterViews_right.value.push(temporal_view)
    return
}

function highlightChanged(new_value) {
  highlight_outlet.value = new_value
}

function handleSearch(item) {
  highlight_nodes.value.push(item)
}

function handleUpdateOutletWeight({outlet, value}) {
  outlet_weight_dict.value[outlet] = value
  updateOverallEntityNode({outlet, value})
}

async function updateOverallEntityNode({outlet, value}) {
  const overall_entity_scatter = selectedScatterViews_left.value.find(view => view.title === "Overall") as typeUtils.EntityScatterView
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
      overall_entity_scatter.data = json
      overall_scatter_data_loading.value = false
    })
}

function handleHexChanged({active, part}) {
  if(part === "panel-left") {
    co_hex_active_left.value = active
  } else {
    co_hex_active_right.value = active
  }
}
function showCoHexDiff() {
  const entities_left = panel_left.value.getActiveHexEntities()
  const entities_right = panel_right.value.getActiveHexEntities()
  const common = _.intersection(entities_left, entities_right)
  panel_left.value.applyCoHexMask(common, false)
  panel_right.value.applyCoHexMask(common, false)

}

function showCoHexCommon() {
  const entities_left = panel_left.value.getActiveHexEntities()
  const entities_right = panel_right.value.getActiveHexEntities()
  const common = _.intersection(entities_left, entities_right)
  panel_left.value.applyCoHexMask(common, true)
  panel_right.value.applyCoHexMask(common, true)
}

function showOriginalCoHex() {
  const entities_left = panel_left.value.getActiveHexEntities()
  const entities_right = panel_right.value.getActiveHexEntities()
  panel_left.value.applyCoHexMask(entities_left, true)
  panel_right.value.applyCoHexMask(entities_right, true)

}

async function fetch_articles(d: typeUtils.ScatterNode) {
    const article_ids = d.article_ids
    const overall_flag = d.text.split("-")[1] === undefined
    const outlet = overall_flag? "Overall": d.text.split("-")[1] 
    const metadata = overall_flag? overview_overall_scatter_metadata.value: overview_grouped_scatter_metadata.value
    selected_entity.value = {
      name: d.text.split("-")[0],
      outlet: outlet,
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
      articles: [],
    }
    display_article_view.value = true
    fetching_article.value = true
    await fetch(`${server_address}/processed_data/ids_to_articles`,{
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(article_ids)
    })
      .then(res => res.json())
      .then(json => {
        console.log("articles fetched")
        selected_entity.value.articles = json
        fetching_article.value = false
        console.log(selected_entity.value)
      })

}

async function handleHexClicked(entity: string) {
  await fetch(`${server_address}/processed_data/scatter_node/${entity}`)
    .then(res => res.json())
    .then(json => {
      console.log("scatter_node fetched")
      fetch_articles(json as typeUtils.ScatterNode)
    })
}
</script>


<template>
  <main>
    <Splitter class="splitter-outmost" layout="vertical">
      <SplitterPanel class="homeview-container flex align-items-center justify-content-center" :size="100">
        <Splitter>
          <SplitterPanel id="expanded_section" class="expanded-section flex align-items-center justify-content-center" :size="55" >
            <i v-if="overall_scatter_data_loading" class="pi pi-spin pi-spinner" 
            style="
            position:absolute;
            left: 45%;
            top: 30%;
            font-size: 3rem;
            z-index: 1000
            "></i> 

            <PanelContainer
            id="panel_left"
            ref="panel_left"
            :class="{compare: compare_mode}"
            compare_part="panel-left"
            :articles="articles"
            :enabled_outlet_set="enabled_outlet_set"
            v-model:selectedScatters="selectedScatterViews_left"
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            v-model:segmentation="segment_sst"
            :highlight_nodes="highlight_nodes"
            @hex_active_changed="handleHexChanged"
            @drop="handleDropScatter($event)"
            @dragover="handleDragOver($event)"
            @dragleave="handleDragLeave($event)"
            @dragenter="(e) => (e.preventDefault())"
            @entity-clicked="handleEntityClicked"
            @hex-clicked="handleHexClicked"
            @show_temporal="handleShowTemporal"
            >
            </PanelContainer>
            <Divider v-if="compare_mode" layout="vertical">
            </Divider>
            <div class="co-hex-button-container"
              v-if="show_co_button">
            <!-- <Button class="co-common-button p-primary" label="Common" @click="showCoHexCommon"></Button>
            <Button class="co-diff-button p-primary" label="Diff" @click="showCoHexDiff"></Button> -->
            <SelectButton class="common-diff" v-model="cohex_mode" :options="cohex_options" aria-labelledby="single"  />
            </div>

            <PanelContainer
            v-if="compare_mode"
            id="panel_right"
            ref="panel_right"
            :class="{compare: compare_mode}"
            compare_part="panel-right"
            :articles="articles"
            :enabled_outlet_set="enabled_outlet_set"
            v-model:selectedScatters="selectedScatterViews_right"
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            v-model:segmentation="segment_sst"
            :highlight_nodes="highlight_nodes"
            @hex_active_changed="handleHexChanged"
            @drop="handleDropScatter($event)"
            @dragover="handleDragOver($event)"
            @dragleave="handleDragLeave($event)"
            @dragenter="(e) => (e.preventDefault())"
            @entity-clicked="handleEntityClicked"
            @hex-clicked="handleHexClicked"
            @show_temporal="handleShowTemporal"
            >
            </PanelContainer>
          </SplitterPanel>
          <SplitterPanel id='sidebar' class="sidebar flex align-items-center justify-content-center" :size="45" :min-size="45">
            <div v-if="!display_article_view" class="overview-container">
              <div  class="toolbar-container">
                <ToggleButton v-if="overview_constructed" class='compare_toggle ' v-model="compare_mode" onIcon="pi pi-images" offIcon="pi pi-images"></ToggleButton>
                <div v-if="overview_constructed" class="segment-toggler-container">
                  <ToggleButton class='segment-toggler p-primary' v-model="segment_mode" onLabel="Segment" offLabel="Segment"></ToggleButton>
                </div>
                <div v-if="overview_constructed" class="search-bar">
                  <SearchBar :search_terms="entity_list" @entity_searched="handleSearch"></SearchBar>
                </div>
                <!-- <MyToolbar ref="toolbar" 
                @candidate_updated="updateNpList"
                @dataset_imported="datasetImported"  >
                </MyToolbar> -->
                <ToggleButton v-if="overview_constructed" class='temporal-toggler ' v-model="temporal_mode" onIcon="pi pi-chart-line" offIcon="pi pi-chart-line"></ToggleButton>
              </div>
              <i v-if="!overview_constructed" class="pi pi-spin pi-spinner" 
              style="
              position:absolute;
              left: 45%;
              top: 30%;
              font-size: 3rem;
              z-index: 1000
              "></i> 
            <div class="overview-grid-container" v-if="overview_constructed && !temporal_mode" >
              <SentimentScatter
                  v-for="(outlet, index) in Object.keys(grouped_scatter_view_dict)" :key="outlet" 
                  class="outlet-scatter"
                  :view="grouped_scatter_view_dict[outlet]"
                  :view_index="index"
                  :id="`scatter-${index}`"
                  :article_num_threshold="article_num_threshold"
                  :segment_mode="segment_mode"
                  :segmentation="segment_sst"
                  :highlight_nodes="highlight_nodes"
                  :expanded="false"
                  :draggable="true"
                  @dragstart="handleDragOutletScatter($event, index)"
                  @click="handleScatterClicked(index)"
              >
              </SentimentScatter>
              </div>
              <div class="overview-temporal-container" v-if="overview_constructed && temporal_mode">
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
                <OutletWeightSlider
                  v-if="overview_constructed"
                  :outlet_weight_dict="outlet_weight_dict"
                  @update_outlet_weight="handleUpdateOutletWeight">
                </OutletWeightSlider>
              </div>
              <Legend v-if="overview_constructed" 
                id="segment_legend"
                class="segment-legend"
                :color_dict="SstColors.key_color_dict" 
                :filter="true" 
                :interactable="false"></Legend>
              </div>
              <div v-if="display_article_view" class="article-view-container">
                <i v-if="fetching_article" class="pi pi-spin pi-spinner" 
                style="
                position:absolute;
                left: 45%;
                top: 30%;
                font-size: 3rem;
                z-index: 1000
                "></i> 
                <div class="toggler-container">
                  <ToggleButton class='back-toggler p-primary' v-model="display_article_view" onLabel="Back" offLabel="Article"></ToggleButton>
                  <ToggleButton class='segment-toggler p-primary' v-model="segment_mode" onLabel="Segment" offLabel="Segment"></ToggleButton>
                </div>
                <div class="entity-info-container">
                  <EntityInfoView
                  :entity_info="selected_entity"
                  v-model:segmentation="segment_sst"
                  >
                  </EntityInfoView>

                </div>
                <div class="article-view">
                  <ArticleView
                  v-if="!fetching_article"
                  v-model:sst_threshold="segment_sst"
                  :articles="selected_entity.articles"
                  :sst_ratio="selected_entity.sst_ratio">
                  </ArticleView>
                </div>
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
.homeview-container {
  height: 100%;
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
  height: 91vh !important;
  width: 100% !important;
  padding: 0 !important;
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
  display: inline-flex;
  width: fit-content;
  margin-left: 10px;
  margin: 3px;
}
.color-spectrum {
  width: inherit;
  height: 30px;
}
.utilities-container {
  display: flex;
  flex-direction: row;
  align-items: stretch;
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
  display: flex;
}
.toolbar-container > :deep(.p-button) {
  border-radius: 8px !important;
  // display: flex !important;
  margin: 3px;
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
.temporal-toggler {
  margin-left: auto !important;
}
.search-bar {
  z-index:1000;
  display:inline-block;
  // transform: translateY(-50%);
  height: 50px;
  margin-left: 3px;
}
.article-view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.article-view {
  overflow: hidden;
}
.slider-container {
  width: 200px;
}
.outlet-weight-grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-column-gap: 30px;
  width: 100%;
  margin-left: 10px;
  margin-right: 10px;
}
.co-hex-button-container {
  position: absolute;
  left: 45.4%;
  top: 24%;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.common-diff {
  display: flex;
  flex-direction: column;
  font-size: x-small;
}
.common-diff > :deep(.p-button.p-component) {
  font-size: inherit;
}
 </style>

