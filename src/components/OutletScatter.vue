<template>
<div :id="props.id" class="scatter-container">
    <svg class="outlet-scatterplot"></svg>

</div>
</template>

<script setup lang="ts">
import * as d3 from "d3"
import { ScatterOutletNode } from '../types'
import { edgeRotation,
         applyEntityEdgeSelectedStyle, 
         addEdges,
        } from './EdgeUtils'
import { applyEntityNodeSelectedStyle,
         applyEntityNodeClickedStyle,
         applyNodeStyling,
         articlesToRadius,
       } from './NodeUtils'
import * as SstColors from "./ColorUtils"
import { watch, onMounted, PropType} from 'vue'

// initialization
const props = defineProps({
    graph: { 
        type: Object as () => {
            nodes: ScatterOutletNode[], 
        }
    },
    graph_index: Number,
    id: String,
})
const viewBox = [1000, 1000]
const outlet_min_radius = 10
const outlet_max_radius = 150
const x = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ 0, viewBox[0] ]);
const y = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ 0.9*viewBox[1], 0]);

onMounted(() => {
    const svg = d3.select(`#${props.id}`)
    .select("svg")
    .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    svg.append("g")
        .attr("transform", "translate(0," + 0.9*viewBox[1] + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));
    updateGraph(props.graph)

})

watch(() => props.graph, (graph, prev_graph) => {
    updateGraph(graph)
})


function updateGraph(graph) {
    console.log("🚀 ~ file: OutletScatter.vue ~ line 58 ~ updateGraph ~ graph", graph)
    const svg = d3.select(`#${props.id}`).select("svg")
    const article_radius_scale = d3.scalePow()
    .exponent(1)
    .domain([0, 1000])
    .range([ outlet_min_radius, outlet_max_radius ]);
    svg.selectAll("circle")
    .data(graph.nodes)
    .join(
        enter => {
            const node_group = enter.append("g") .attr("class", "outlet")
            node_group.append("circle")
                .attr("class", "outlet_circle")
                .attr("r", (d) => article_radius_scale(d.articles))
                .attr("cx", (d) => x(d.pos_sst))
                .attr("cy", (d) => y(Math.abs(d.neg_sst)))
                .attr("fill", "grey")
        }
    ) 

}
</script>

<style scoped lang="scss">
.scatter-container {
    height: auto;
    width: auto;
    display: block;
}
.outlet-scatterplot {
    overflow: visible;
    // height: 95vh;
    width:auto;
}
</style>