<template>
<div :id="props.id" class="scatter-container">
    <svg class="outlet-scatterplot"></svg>

</div>
</template>

<script setup lang="ts">
import * as d3 from "d3"
import { ScatterOutletNode, ScatterOutletGraph } from '../types'
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
    graph: Object as () => ScatterOutletGraph,
    graph_index: Number,
    id: String,
    expanded: Boolean,
    min_articles: Number,
    max_articles: Number,
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
const thumbnail_state = true

onMounted(() => {
    const svg = d3.select(`#${props.id}`)
    .select("svg")
    .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    svg.append("g")
        .attr("transform", "translate(0," + 0.9*viewBox[1] + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));
    let break_text = props.graph?.entity.split('_') || "known"
    var break_num = break_text.length
    if(break_num >= 4) {
        break_text = [break_text[0], break_text[1], break_text[2], '...']
        break_num = 4
    }
    svg.append("text")
        .selectAll("tspan")
        .data(break_text)
        .join("tspan")
        .text(d => d)
        .attr("x", () => viewBox[0]/2)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .attr("font-size", () => (props.expanded?"2em":"8em"))
        .attr("dominant-baseline", "central")
    updateGraph(props.graph)

})

watch(() => props.graph, (graph, prev_graph) => {
    updateGraph(graph)
})

function updateGraph(graph) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const article_radius_scale = d3.scalePow()
    .exponent(1)
    .domain([ props.min_articles, props.max_articles ])
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
                .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
        },
        update => {
            update.attr("r", (d) => article_radius_scale(d.articles))
            .attr("cx", (d) => x(d.pos_sst))
            .attr("cy", (d) => y(Math.abs(d.neg_sst)))
            .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
        }
    ) 
    svg.selectAll("circle").sort((da, db) => -(da.articles - db.articles))
    if(thumbnail_state) {
        svg.attr("pointer-events", "none")
        // svg.each(function() {
        //     d3.selectAll(this.childNodes).attr("pointer-events", "none")
        // })
        // svg.on("click") 
    }

}
</script>

<style scoped lang="scss">
.scatter-container {
    height: auto;
    width: auto;
    background-color: white;
}
.outlet-scatterplot {
    overflow: hidden;
    height: inherit;
    aspect-ratio: 1;
    // height: 95vh;
}
</style>