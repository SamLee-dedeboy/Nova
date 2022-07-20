<template>
<div :id="props.id" class="scatter-container">
    <svg class="outlet-scatterplot" :class="panel_class"></svg>

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
    panel_class: String,
    article_num_threshold: Number,
})
const viewBox = [1000, 1000]
const outlet_min_radius = 10
const outlet_max_radius = 150
const origin = [30, 30]
const x = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ origin[0], 0.9*viewBox[0] ]);

const y = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ 0.9*viewBox[1], origin[1]]);

onMounted(() => {
    const svg = d3.select(`#${props.id}`)
    .select("svg")
    .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    
    svg.append("g")
        .attr("transform", `translate(0, ${0.9*viewBox[1]})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${origin[0]},0)`)
        .call(d3.axisLeft(y));
    if(props.expanded) {
        svg.append("text")
            .text(props.graph?.title)
            .attr("x", () => viewBox[0]/2)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .attr("font-size", () => (props.expanded?"2em":"8em"))
            .attr("dominant-baseline", "central")
    } else {
        let break_text = props.graph?.title.split('_') || "known"
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
    }       
    updateCanvas()
})

watch(() => props.graph, (graph, prev_graph) => {
    updateCanvas() 
})

function updateCanvas() {
    if(props.expanded)
        updateExpandedScatter(props.graph)
    else 
        updateOverviewScatter(props.graph)
} 

function updateExpandedScatter(graph) {
    updateOverviewScatter(graph)
    const svg = d3.select(`#${props.id}`).select("svg")
    svg.selectAll("g.outlet")
        .style("cursor", "pointer")
        .on("mouseover", function(e, d) {
            const container = d3.select(this)
            container.style("filter", "brightness(90%)")
            container.selectAll("circle.expand_circle")
                .transition().duration(100)
                .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r")) + 10))
        })
        .on("mouseout", function(e, d) {
            const container = d3.select(this)
            container.style("filter", "brightness(100%)")
            container.selectAll("circle.expand_circle")
                .transition().duration(100)
                .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r"))))
        })
        .on("click", function(e, d) {
            console.log(d)
        })


}

function updateOverviewScatter(graph) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const article_radius_scale = d3.scalePow()
    .exponent(1)
    .domain([ props.min_articles, props.max_articles ])
    .range([ outlet_min_radius, outlet_max_radius ]);
    svg.selectAll("g.outlet")
    .data(graph.nodes, function(d) {return d.text})
    .join(
        enter => {
            const group = enter.append("g").attr("class", "outlet")
            group.append("circle")
                .attr("class", "outlet_circle")
                // .attr("r", (d) => article_radius_scale(d.articles))
                .attr("r", 10)
                .attr("cx", (d) => x(d.pos_sst))
                .attr("cy", (d) => y(Math.abs(d.neg_sst)))
                .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
                .attr("opacity", 0.8)
            group.append("circle")
                .attr("class", "expand_circle")
                // .attr("r", (d) => article_radius_scale(d.articles))
                .attr("r", 10)
                .attr("cx", (d) => x(d.pos_sst))
                .attr("cy", (d) => y(Math.abs(d.neg_sst)))
                .attr("fill", "white")
                .attr("stroke", "black")
                .lower()
        },
        update => {
            update.selectAll("circle")
            // .attr("r", (d) => article_radius_scale(d.articles))
                .attr("r", 10)
            .attr("cx", (d) => x(d.pos_sst))
            .attr("cy", (d) => y(Math.abs(d.neg_sst)))

            update.selectAll("circle.outlet_circle")
            .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
            // .attr("opacity", 0.8)
        }
    ) 
    const dots = svg.selectAll("g.outlet")
    dots.sort((da, db) => -(da.articles - db.articles))
    dots.attr("opacity", (d) => (d.articles < props.article_num_threshold? 0:0.8))
}
</script>

<style scoped lang="scss">
.scatter-container {
    height: inherit;
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