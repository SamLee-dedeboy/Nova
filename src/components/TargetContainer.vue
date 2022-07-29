<script setup lang="ts">
import Graph from "./Graph.vue";
import Cloud from "./Cloud.vue"
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import TimeAxes from './TimeAxes.vue'
import * as dfd from "danfojs"
import Dropdown from 'primevue/dropdown';
import InfoButton from "./InfoButton.vue";
import OutletScatter from "./OutletScatter.vue";
import * as d3 from "d3"
import { watch, onMounted, PropType, ref, Ref, toRef, computed, defineEmits } from 'vue'
import * as vue from 'vue'
import { ScatterOutletNode, ScatterOutletGraph, ViewType } from "../types";
import TemporalCoordinates from "./TemporalCoordinates.vue";

const props = defineProps({
    articles: Object as () => any[],
    enabled_outlet_set: Object as () => Set<string>,
    selectedScatters: Object as () => ScatterOutletGraph[],
    selectedTimeRange: Object as () => {start: number, end: number},
    compare_part: String,
    article_num_threshold: Number,
    segment_mode: Boolean,
    segmentation: Object as () => {pos: Number, neg: Number},
})
const scatterClicked: Ref<boolean> = ref(false)
const active: Ref<number> = ref(0)
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
}, {deep:true})
// watch(() => selectedScatters_list, (new_value) => {
//     console.log(selectedScatters_list.value)
// })

const emit = defineEmits(['update:selectedScatters', "update:segmentation", "node-clicked", "entity-clicked"])

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
</script>

<template>
<TabView class="graph-container" :class="compare_part" v-model:activeIndex="active" :scrollable="true">
    <TabPanel class="graph-panel" :class="compare_part" 
     v-for="(graph, index) in selectedScatters" :key="graph.title" 
      >
        <template #header>
			<span style="max-width:100px; overflow:hidden" :title="graph.title">{{graph.title}}</span>
            <Button icon="pi pi-times" class="p-button-rounded p-button-danger p-button-text p-button-sm"
            @click="handleCloseTab($event, index)"/>
		</template>
        <KeepAlive>
        <OutletScatter
            v-if="graph.type === ViewType.EntityScatter || graph.type === ViewType.OutletScatter"
            :graph="graph"
            :graph_index="index"
            :id="`${compare_part}-scatter-${index}-expanded`"
            :expanded="true"
            :panel_class="compare_part" 
            :article_num_threshold="article_num_threshold"
            :segment_mode="segment_mode"
            @update:segmentation="updateSegmentation"
            @node_clicked="handleEntityClicked"
        ></OutletScatter>
        </KeepAlive>

        <TemporalCoordinates 
        v-if="graph.type === ViewType.Temporal"
            :article_bin_dict="entity_article_bins_dict"

        ></TemporalCoordinates>
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
.graph-container .graph-panel {
    width: inherit;
    height: inherit;
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

</style>