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
import { watch, onMounted, PropType} from 'vue'
import { ScatterOutletNode, ScatterOutletGraph } from "../types";

const props = defineProps({
    articles: Object as () => any[],
    enabled_outlet_set: Object as () => Set<string>,
    selectedScatters: Object as () => ScatterOutletGraph[],
    selectedTimeRange: Object as () => {start: number, end: number} 
})
let scatterClicked: Boolean = false
var active: number = 0
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
    active = props.selectedScatters?.length || 1 - 1 
})
function handleNodeClicked(clicked_node) {
    this.$emit("node-clicked", clicked_node)        
    this.nodeClicked = true
    const target = this.entities[0]
    const articles = clicked_node.articles
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
    this.clicked_outlet = clicked_node.text
}
</script>

<template>
<TabView class="graph-container" v-model:activeIndex="active">
    <TabPanel class="graph-panel" 
     
     v-for="(graph, index) in selectedScatters" :key="graph.entity" :header="graph.entity">
        <OutletScatter
        :graph="graph"
        :graph_index="index"
        :id="`scatter-${index}-expanded`"
        :expanded="true"
        style="height:90vh;"
        
        ></OutletScatter>
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
:deep(.p-tabview-panel) {
}

</style>