<script setup lang="ts">
import Graph from "./Graph.vue";
import Cloud from "./Cloud.vue"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import TimeAxes from './TimeAxes.vue'
import * as dfd from "danfojs"
import Dropdown from 'primevue/dropdown';
import InfoButton from "./InfoButton.vue";
import * as d3 from "d3"
import { watch, onMounted, PropType, ref, Ref, toRef, computed, defineEmits, nextTick } from 'vue'
import * as vue from 'vue'
import { ScatterOutletNode, ScatterOutletGraph, ViewType, Article, OutletNodeInfo } from "../types";
import TemporalCoordinates from "./TemporalCoordinates.vue";
import TemporalPathSelector from "./TemporalPathSelector.vue";
import SentimentScatter from "./SentimentScatter.vue";
import NodeInfo from "./NodeInfo.vue"
import ArticleInfo from "./ArticleInfo.vue";
import DataTable from "primevue/datatable";
import Column from 'primevue/column'
import * as _ from "lodash"

const props = defineProps({
    articles: Object as () => any[],
    enabled_outlet_set: Object as () => Set<string>,
    selectedScatters: Object as () => ScatterOutletGraph[],
    temporalBins: Object as () => {[id: string]: {[id: string]:Article[]}},
    selectedTimeRange: Object as () => {start: number, end: number},
    compare_part: String,
    article_num_threshold: Number,
    segment_mode: Boolean,
    segmentation: Object as () => {pos: Number, neg: Number},
    highlight_nodes: Object as () => string[], 
})
const scatterClicked: Ref<boolean> = ref(false)
const active: Ref<number> = ref(0)
const highlight_entity: Ref<string[]> = ref([])
const compare_mode = vue.inject("compare_mode") || ref(false)
const selectedNodes: Ref<ScatterOutletNode[]> = ref([])
const topicBins = vue.computed(() => {
    if(selectedNodes.value.length === 0) return undefined
    let bins = {}
    const topic_set: Set<string> = new Set()
    selectedNodes.value.forEach(node => {
        Object.keys(node.topicBins).forEach(topic => topic_set.add(topic))
    })
    selectedNodes.value.forEach(node => {
        topic_set.forEach(topic => {
            if(bins[topic] === undefined) {
                bins[topic] = []
            } 
            bins[topic].push({title: node.text, pos: node.topicBins[topic]?.pos || 0, neg: node.topicBins[topic]?.neg || 0 })
        })
    })
    return bins
})
const highlightNodes: Ref<string[]> = ref([])
const selectedEntities = vue.computed(() => {
    return Object.keys(props.temporalBins)
})
const temporal_color_dict = vue.computed(() => {
    let color_dict = {}
    Object.keys(props.temporalBins).forEach((title, index) => {
        const color = selectColor(index)
        color_dict[title] = color
    })
    return color_dict
})
vue.watch(() => props.highlight_nodes, (new_value, old_value) => {
    highlightNodes.value = props.highlight_nodes || []
}, {deep:true})
vue.watch(selectedNodes, (new_value, old_value) => {
    highlightNodes.value = selectedNodes.value?.map(node => node.text.split("-")[0])
    
})
// const selectedScatters: Ref<Set<ScatterOutletGraph> | undefined> = toRef(props, 'selectedScatters')
// const selectedScatters_list = computed(() => {
//     console.log(selectedScatters.value)
//     return Array.from(selectedScatters.value || [])
// })
        // data() {
        // return {
        //     entity_graph: {
        //         nodes:[]
        //     },
        //     cooccur_matrix: {},
        //     clicked_outlet: undefined,
        //     opacityThreshold: 0,
        //     modes: [
        //         {label: "avg_score", value: "avg_score"},
        //         {label: "score", value: "score"},
        //         {label: "#articles", value: "#articles"}],
        //     selected_mode: "score",
        //     graph_constructed: false,
        //     scatterClicked: false,
        //     clickedScatter: {graph: {}, index: undefined},
        //     active: 0
        // }
    // },
    // computed: {
    //     article_dict: function() {
    //         return this.articles.reduce((dict, article) => (dict[article.id]=article, dict), {})
    //     },
    //     entity_list: function() {
    //         return this.entity_mentions.map(entity_mention => entity_mention[0])
    //     },
    // },
watch(() => props.selectedScatters, (new_scatters, old_scatters) => {
    active.value = (props.selectedScatters?.length || 1) - 1 
    // const tab_navs = document.querySelector(".p-tabview-nav").querySelector('[role="presentation"]')
    vue.nextTick(() => {
        const tab_navs = document.querySelectorAll(`.${props.compare_part} .p-tabview-nav > [role=presentation]`)
        tab_navs.forEach((tab,index) => {
            tab.setAttribute("draggable", "true")
            tab.addEventListener("dragstart", function(e: any) {
                e.dataTransfer.dropEffect = 'move'
                e.dataTransfer.effectAllowed = 'move'
                const scatter = props.selectedScatters![index]
                e.dataTransfer.setData('scatter', JSON.stringify(scatter))  
            })})
    })
}, {deep:true})

// watch(() => selectedScatters_list, (new_value) => {
//     console.log(selectedScatters_list.value)
// })

const emit = defineEmits(['update:selectedScatters', "update:segmentation", "node-clicked", "entity-clicked", "show_temporal"])

vue.onMounted(() => {
    highlightNodes.value = props.highlight_nodes || []

})
function handleNodeClicked({type, d}) {
    emit("node-clicked", d)        
    this.nodeClicked = true
    const target = this.entities[0]
    const articles = d.articles
    const max_node_num = 10
    // generate candidates that cooccur frequently with target
    let entity_mentioned_articles:{[id: string]: Set<string>} = {}
    articles.forEach(article => {
        const entity_list = article.entities
        entity_list.forEach(entity_mention => {
            const entity_id = entity_mention[3]
            entity_mentioned_articles[entity_id] = (entity_mentioned_articles[entity_id] || new Set())
            entity_mentioned_articles[entity_id].add(article.id)
        })
    })
    // get top k candidates
    var freq_list = Array.from(Object.entries(entity_mentioned_articles)).map(item => ({entity: item[0], freq: item[1].size})).sort((a,b) => (b.freq - a.freq)).slice(0, max_node_num).map(item => item.entity) 
    var cooccur_matrix = {}

    var nodes: ScatterOutletNode[] = []
    freq_list.forEach(entity_id => {
        // generate candidate cooccur matrix
        cooccur_matrix[entity_id] = {}
        const entity_articles = this.idsToArticles([...entity_mentioned_articles[entity_id]])
        entity_articles.forEach(article => {
            const comentioned_entities = Array.from(new Set(article.entities.map(mention => mention[3]).filter(entity => freq_list.includes(entity))))
            comentioned_entities.forEach(cooccur_entity_id => {
                // if(entity_id != cooccur_entity_id)
                cooccur_matrix[entity_id][cooccur_entity_id] = (cooccur_matrix[entity_id][cooccur_entity_id] || 0)+1  
            })
        })
        // construct node
        const node = this.construct_node(entity_articles, entity_id)
        nodes.push(node)
    })
    this.entity_graph.nodes = nodes
    this.cooccur_matrix = cooccur_matrix
    this.clicked_outlet = d.text
}

function handleCloseTab(e, index) {
    e.preventDefault()
    const closed_scatter = props.selectedScatters![index]
    props.selectedScatters?.splice(index, 1)
    emit("update:selectedScatters", props.selectedScatters)
}

function handleEntityClicked(data) {
    emit("entity-clicked", data)
}

function updateSegmentation(new_value) {
    emit("update:segmentation", new_value)
}
function selectColor(number) {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},50%,75%)`;
}
function handleShowTemporal(nodes) {
    emit("show_temporal", nodes)
}
function handleDragScatter(e) {
    console.log(e.target)
}
function colHeader(graph_type: ViewType): string {
    if(graph_type === ViewType.OutletScatter) return "outlet"
    if(graph_type === ViewType.EntityScatter) return "entity"
    return "title"
}

function rowHeader(data: string, graph_type: ViewType): string {
    if(graph_type === ViewType.OutletScatter) return data.split("-")[1] 
    if(graph_type === ViewType.EntityScatter) return data.split("-")[0]
    return data 
}

function breakText(data: string): string[] {
    return data.split("_")
}
</script>

<template>
<TabView class="graph-container" :class="compare_part" v-model:activeIndex="active" :scrollable="true"
    ref="tabview"
    >
    <TabPanel class="graph-panel" :class="compare_part"
     v-for="(graph, index) in selectedScatters" :key="graph.title" ref="tabpanels" 
      >
        <template #header>
			<span style="max-width:100px; overflow:hidden;display: block ruby;font-size:x-small" :title="graph.title"
            >{{graph.title}}</span>
            <Button icon="pi pi-times" class="p-button-rounded p-button-danger p-button-text p-button-sm"
            @click="handleCloseTab($event, index)"/>
		</template>
        <div class="scatter-panel-container"
            v-if="graph.type === ViewType.EntityScatter || graph.type === ViewType.OutletScatter">
            <SentimentScatter
                :graph="graph"
                :graph_index="index"
                :id="`${compare_part}-scatter-${index}-expanded`"
                :class="{compare: compare_mode}"
                :expanded="true"
                :panel_class="compare_part" 
                :article_num_threshold="article_num_threshold"
                :segment_mode="segment_mode"
                :segmentation="segmentation"
                :highlight_nodes="highlightNodes"
                @update:segmentation="updateSegmentation"
                @node_clicked="handleEntityClicked"
                @show_temporal="handleShowTemporal"
            ></SentimentScatter>
            <div class="scatter-info-container">
                <DataTable :value="graph.nodes.sort((a, b) => -(a.articles-b.articles))"
                v-model:selection="selectedNodes" selectionMode="multiple" dataKey="text" :metaKeySelection="false"
                scrollable 
                scrollHeight="150px"
                :virtualScrollerOptions="{itemSize: 30}"
                style="font-size: x-small" >
                    <Column field="text" :header="colHeader(graph.type)">
                        <template #body="{data}">
                            <div class="col-outlet" :title="rowHeader(data.text, graph.type)">
                                <div v-for="word in breakText(rowHeader(data.text, graph.type))" :key="word">{{word}}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="articles" header="articles"></Column>
                    <Column field="pos_articles" header="pos articles"></Column>
                    <Column field="neg_articles" header="neg articles"></Column>
                    <Column field="pos_sst" header="pos score">
                        <template #body="{data}">
                            <span :title="data.pos_sst"> {{data.pos_sst.toFixed(2)}}
                            </span>
                        </template>
                    </Column>
                    <Column field="neg_sst" header="neg score">
                        <template #body="{data}">
                            <span :title="data.neg_sst"> {{data.neg_sst.toFixed(2)}}
                            </span>
                        </template>
                    </Column>
                </DataTable>
                <ArticleInfo v-if="selectedNodes.length !== 0" 
                :id="`${compare_part}-article-info-${index}`"
                :topicBins="topicBins"></ArticleInfo>
            </div>
        </div>
        <div class="target-temporal-container" v-if="graph.type === ViewType.Temporal">
            <TemporalCoordinates 
                class="temporal-coord"
                :id="`compare_temporal`"
                :article_bin_dict="temporalBins"
                :path_keys="selectedEntities"
                :color_dict="temporal_color_dict"
                :highlight_object="highlight_entity"
                :sst_threshold="segmentation"
            ></TemporalCoordinates>
            <TemporalPathSelector 
                class="temporal-selector"
                v-model:temporalBins="temporalBins"
                :color_dict="temporal_color_dict"
                closable
                v-model:selectedTargets="highlight_entity">
            </TemporalPathSelector>
        </div>
        <!-- <Graph 
            class="graph"
            :graph="graph_dict[target]"
            :graph_index="index"
            :id="`graph-${index}`"
            :entity_graph="entity_graph.nodes"
            :cooccur_matrix="cooccur_matrix"
            :opacityThreshold="opacityThreshold"
            @node-clicked="handleNodeClicked"
            >
        </Graph > -->
            <!-- <TimeAxes class='time-axes' v-if="targets.length!=0" :selectedTimeRange="selectedTimeRange"></TimeAxes> -->
            <!-- <div class="dropdown-container">
                <div class="dropdown-header-container">
                    <div class="dropdown-header"> Classifier </div>
                    <InfoButton class='clf-info' info_content="Choose a mode to classify nodes as 'pos'/'neg'/'neu'"></InfoButton>
                </div>
                <Dropdown class="clf-dropdown" 
                v-model="selected_mode" 
                :options="modes" 
                optionLabel="label" 
                optionValue="value"
                placeholder="Select a clfer" />
            </div> -->
        <!-- </div> -->
    </TabPanel>
</TabView>
</template>

<style scoped lang="scss">
.graph-container .graph-panel,.scatter-panel-container  {
    width: inherit;
    height: inherit;
}
.compare {
    height: 50%;
}
.dropdown-container {
    position: absolute;
    left: 88.2%;
    top: 15%;
}
.dropdown-header-container {
    display: flex;
}
.dropdown-header {
    display: flex;
    align-items: center;
    justify-content: center;
}
:deep(.tooltip) {
    position:absolute;
    left:-100px; 
    top:-75px;
}
.graph {
    width: inherit;
    height: inherit;
}
.time-axes {
    position:absolute;
    top:23%;
    left:2%;
}
:deep(.p-tabview-nav-link) {
    padding: unset !important;
    padding-left: 0.75rem !important;

}
:deep(.p-tabview-nav-content) {
    width:90%;
}
:deep(.p-button.p-button-danger.p-button-text, .p-buttonset.p-button-danger > .p-button.p-button-text, .p-splitbutton.p-button-danger > .p-button.p-button-text) {
    color: #7c7576;
}

.target-temporal-container {
    height: 50%;
}
.temporal-coord {
    height: 60%;
}
.temporal-selector {
    height: 37%;
}
:deep(.p-button.p-button-sm .p-button-icon) {
    font-size: 0.575rem !important;
}
:deep(.p-button.p-button-icon-only.p-button-rounded) {
    height: 1.757rem !important;
    margin-left: auto;
    margin-right: 0;
}
:deep(.p-datatable .p-datatable-thead > tr > th) {
    padding: unset !important;
}
:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: unset !important;
}
:deep(.p-datatable .p-column-header-content) {
    justify-content: center;
}
:deep(.p-datatable .p-datatable-thead > tr > th) {
    text-align: center;
}
:deep(.p-datatable .p-datatable-tbody > tr > td) {
    display: block;
    text-align: center;
    cursor: pointer;
}
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background-color: #E3F2FD;
}
.col-outlet {
    text-align: left;
}

</style>