<script setup lang="ts">

import Filter from "../components/Filter.vue";
//import Target from "../components/Target.vue";
import TargetContainer from "../components/TargetContainer.vue";
import MyToolbar from "../components/MyToolbar.vue"
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import ArticleView from "../components/ArticleView.vue";
import TopicSelection from "../components/TopicSelection.vue";
import TargetSelection from "../components/TargetSelection.vue"
import MonthSlider from "../components/MonthSlider.vue"
import OutletScatter from "../components/OutletScatter.vue";
import * as preprocess from "../components/preprocessUtils"
import { watch, computed, onMounted, PropType, ref, Ref, nextTick, } from 'vue'
import { ScatterOutletGraph } from "../types";
import Legend from "../components/Legend.vue";
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
const graph_dict = ref({})
const graph_constructed: Ref<Boolean> = ref(false)
const entity_list: Ref<string[]> = computed(() => entity_mentions.value.map(entity_mention => entity_mention[0]))
const selectedScatterGraphs: Ref<Set<ScatterOutletGraph>> = ref(new Set())
const selectedScatterGraphList = computed(() => Array.from(selectedScatterGraphs.value))
const scatterClicked: Ref<Boolean> = ref(false)
const entity_data = computed(() => entity_mentions.value.map(entity_mention => { return {"name": entity_mention[0], "num": entity_mention[1].length || 0}}))
const graph_constructing: Ref<Boolean> = ref(false)
const max_articles: Ref<number> = ref(0)
const min_articles: Ref<number> = ref(0)
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
    const promise = new Promise((resolve) => { processDataset(dataset); resolve(""); })
    promise.then(() => graph_constructing.value = false)
  }, 1)
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
  let {r_graph_dict, r_max_articles, r_min_articles} = preprocess.constructOutletGraph(entity_mentions.value, enabled_outlet_set.value, article_dict.value)
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
    const clicked_entity = entity_mentions.value[index][0]
    selectedScatterGraphs.value.add(graph_dict.value[clicked_entity])
    scatterClicked.value = true
}

function handleDragScatter(evt, index) {
  evt.dataTransfer.dropEffect = 'move'
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.setData('scatterIndex', index)  
}

function handleDragOver(e) {
  e.preventDefault()
  e.target.style.background = "#b8b8b8"
}

function handleDragLeave(e) {
  e.preventDefault()
  e.target.style.background = "white"
}

function handleDropScatter(evt) {
  evt.target.style.background = "white"
  const index = evt.dataTransfer.getData('scatterIndex')
  const clicked_entity = entity_mentions.value[index][0]
  selectedScatterGraphs.value.add(graph_dict.value[clicked_entity])
  scatterClicked.value = true
}

</script>


<template>
  <main>
    <Splitter class="splitter-outmost" layout="vertical">
      <SplitterPanel id="overview-section" class="flex align-items-center justify-content-center" :size="100">
        <Splitter>
          <SplitterPanel id='target-section' class="flex align-items-center justify-content-center" :size="55"
            @drop="handleDropScatter($event)"
            @dragover="handleDragOver($event)"
            @dragleave="handleDragLeave($event)"
            @dragenter="(e) => (e.preventDefault())"
            >
            <TargetContainer
            :articles="articles"
            :enabled_outlet_set="enabled_outlet_set"
            v-model:selectedScatters="selectedScatterGraphList"
            :selectedTimeRange="timeRange"
            :min_articles="min_articles"
            :max_articles="max_articles"
            >
            </TargetContainer>
          </SplitterPanel>
          <SplitterPanel id='sidebar' class="sidebar flex align-items-center justify-content-center" :size="45" :min-size="20">
            <MyToolbar ref="toolbar" 
            @candidate_updated="updateNpList"
            @dataset_imported="datasetImported"  >
            </MyToolbar>
            <i v-if="graph_constructing" class="pi pi-spin pi-spinner" 
            style="
            position:absolute;
            left: 45%;
            top: 30%;
            font-size: 3rem;
            z-index: 1000
            "></i> 
          <div class="entity-grid-container" v-if="graph_constructed" >
            <OutletScatter
                v-for="(entity, index) in entity_list" :key="entity" 
                class="outlet-scatter"
                :graph="graph_dict[entity]"
                :graph_index="index"
                :id="`scatter-${index}`"
                :max_articles="max_articles"
                :min_articles="min_articles"
                style="cursor: pointer"
                :expanded="false"
                :draggable="true"
                @dragstart="handleDragScatter($event, index)"
                @click="handleScatterClicked(index)"
            >
            </OutletScatter>
            </div>
            <Legend v-if="graph_constructed" style="position:absolute; left: 72%; top: 75%"></Legend>

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

<style scoped>
.splitter-outmost {
  width: 97vw;
  height: 95vh;
}
.entity-grid-container {
    display: grid;
    height: 90vh;
    width: auto;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(7, 1fr);  
}
:deep(.outlet-scatter:hover .outlet-scatterplot) {
    filter: brightness(80%);
    background-color: rgb(191, 189, 189);
}
:deep(.p-tabview-panels) {
  height:95vh !important;
}
:deep(.p-tabview-panels:dragover) {
  background: #b8b8b8 !important;
}
:deep(.p-tabview-panels) {
  /* background: #b8b8b8 !important; */
}
</style>
