<template>
<div :id="props.id" class="scatter-container" :class="panel_class">
    <svg class="outlet-scatterplot" :class="panel_class"></svg>
    <Button class="reset-zoom" @click="resetZoom">reset</Button>
    <TooltipVue class='tooltip' :content="tooltip_content" style="z-index: 1000;"></TooltipVue>

</div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import TooltipVue from "./Tooltip.vue"
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
import { watch, onMounted, PropType, computed, Ref, ref} from 'vue'

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
    segment_mode: Boolean,
})
const tooltip_content: Ref<String> = ref("") 
const viewBox = [1000, 1000]
const outlet_min_radius = 10
const outlet_max_radius = 150
const origin = [30, 30]
const viewBox_width = 0.9*viewBox[0]
const viewBox_height = 0.9*viewBox[1]
const x = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ origin[0], viewBox_width ]);

const y = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ viewBox_height, origin[1]]);
const filtered_data = computed(() => props.graph?.nodes.filter(node => node.articles > (props.article_num_threshold || 0)))
const avg_pos_sst = computed(() => (_.mean(props.graph?.nodes.map(node => node.pos_sst))))
const avg_neg_sst = computed(() => (_.mean(props.graph?.nodes.map(node => node.neg_sst))))
onMounted(() => {
    const svg = d3.select(`#${props.id}`)
    .select("svg")
    .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    d3.select(`#${props.id}`).select("div.tooltip")
    .style("scale", 0)
    

    updateOverviewTooltipContent()
    updateSegmentation()

    svg.append("g")
        .attr("class", "axis_x")
        .attr("transform", `translate(0, ${viewBox_height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis_y")
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
        const zoom = d3.zoom().on("zoom", handleZoom)
        svg.call(zoom)
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
            .attr("font-size", () => (props.expanded?"2em":"5em"))
            .attr("dominant-baseline", "central")
        svg.on("mousemove", function(e, d) {
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("left", e.offsetX + 15 + "px")
            .style("top", e.offsetY - 5 + "px")
        })
        .on("mouseover", function(e, d) {
            svg.style("filter", "brightness(80%)")
            .style("background-color", "rgb(191,189,189)")
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("scale", 1)

        })
        .on("mouseout", function(e, d) {
            svg.style("filter", "brightness(100%)")
            .style("background-color", "white")
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("scale", 0)
        })
    }       
    updateCanvas()
})

watch(() => props.graph, (graph, prev_graph) => {
    updateCanvas() 
})

watch(() => props.article_num_threshold, () => {
    updateCanvas()
})
watch(() => props.segment_mode, () => {
    updateSegmentation()
})

function resetZoom() {
    const svg = d3.select(`#${props.id}`).select("svg")
    svg.selectAll("g.outlet")
        .attr("transform", "none")
    const axis_x = svg.selectAll("g.axis_x")
    axis_x.attr("transform", `translate(0, ${viewBox_height})`)

    const axis_y = svg.selectAll("g.axis_y")
    axis_y.attr("transform", `translate(${origin[0]}, 0)` )

}

function handleZoom(e) {
    if(e.transform.k === 1) {
        resetZoom()
        return
    }
    const svg = d3.select(`#${props.id}`).select("svg")
    svg.selectAll("g.outlet")
        .attr("transform", e.transform)
    const axis_x = svg.selectAll("g.axis_x")
    axis_x.attr("transform", `translate(${e.transform.x}, ${viewBox_height}) scale(${e.transform.k})`)

    const axis_y = svg.selectAll("g.axis_y")
    axis_y.attr("transform", `translate(${origin[0]}, ${e.transform.y}) scale(${e.transform.k})` )
}

function updateSegmentation() {
    const svg = d3.select(`#${props.id}`).select("svg")
    svg.selectAll("g.segmentation")
    .data([{avg_pos_sst, avg_neg_sst}])
    .join(
        enter => {
            const segment_group = enter.append("g").attr("class", "segmentation")
            // neg
            segment_group.append("rect")
                .attr("class", "neg")
                .attr("x", origin[0])
                .attr("y", origin[1])
                .attr("width", (d) => x(d.avg_pos_sst.value)-origin[0])
                .attr("height", (d) => y(d.avg_neg_sst.value)-origin[1])
                .attr("fill", "red")
            // neu
            segment_group.append("rect")
                .attr("class", "neu")
                .attr("x", origin[0])
                .attr("y", (d) =>  y(d.avg_neg_sst.value))
                .attr("width", (d) => x(d.avg_pos_sst.value)-origin[0])
                .attr("height", (d) => y(1-d.avg_neg_sst.value)-origin[1])
                .attr("fill", "grey")
            // pos
            segment_group.append("rect")
                .attr("class", "pos")
                .attr("x", (d) => x(d.avg_pos_sst.value))
                .attr("y", (d) => y(d.avg_neg_sst.value))
                .attr("width", (d) => x(1-d.avg_pos_sst.value)-origin[0])
                .attr("height", (d) => y(1-d.avg_neg_sst.value)-origin[1])
                .attr("fill", "blue")
            // mixed
            segment_group.append("rect")
                .attr("class", "mixed")
                .attr("x", (d) => x(d.avg_pos_sst.value))
                .attr("y", origin[1])
                .attr("width", (d) => x(1-d.avg_pos_sst.value)-origin[0])
                .attr("height", (d) => y(d.avg_neg_sst.value)-origin[1])
                .attr("fill", "yellow")
        }
    )
    if(props.segment_mode === false) {
        svg.selectAll("g.segmentation").style("scale", 0)
    } else {
        svg.selectAll("g.segmentation").style("scale", 1)
    }


}

function updateExpandedTooltipContent(data: ScatterOutletNode) {
    tooltip_content.value = 
    `entity: ${data.text} <br>` + 
    `&nbsp #articles: ${data.articles} <br>` +
    `&nbsp sst: (${data.pos_sst.toFixed(2)}, ${data.neg_sst.toFixed(2)}) <br>` 
    

}

function updateOverviewTooltipContent() {
    const nodes = filtered_data.value! 
    const title = props.graph?.title
    const entity_num = nodes.length || 0
    nodes.sort((node_a, node_b) => (node_a.articles - node_b.articles))
    tooltip_content.value = 
    `${title}: <br>` + 
    `&nbsp #entities: ${entity_num} <br>` +
    `&nbsp top 3 entities:<ol> 
    <li>${nodes[0].text}</li>
    <li>${nodes[1].text}</li>
    <li>${nodes[2].text}</li> </ol>` +
    `&nbsp avg_sst: (${avg_pos_sst.value.toFixed(2)}, ${avg_neg_sst.value.toFixed(2)}) <br>` 
}

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
        .on("mousemove", function(e, d) {
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("left", e.offsetX + 15 + "px")
            .style("top", e.offsetY - 5 + "px")
        })
        .on("mouseover", function(e, d) {
            const container = d3.select(this)
            container.style("filter", "brightness(90%)")
            container.selectAll("circle.expand_circle")
                .transition().duration(100)
                .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r")) + 10))
            updateExpandedTooltipContent(d)
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("scale", 1)
        })
        .on("mouseout", function(e, d) {
            const container = d3.select(this)
            container.style("filter", "brightness(100%)")
            container.selectAll("circle.expand_circle")
                .transition().duration(100)
                .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r"))))
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("scale", 0)
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
    .data(filtered_data.value, function(d) {return d.text})
    .join(
        enter => {
            const group = enter.append("g").attr("class", "outlet")
            group.append("circle")
                .attr("class", "outlet_circle")
                // .attr("r", (d) => article_radius_scale(d.articles))
                .attr("r", 10)
                .attr("cx", (d) => x(d.pos_sst))
                .attr("cy", (d) => y(Math.abs(d.neg_sst)))
                // .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
                .attr("fill", "black")
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
            // .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
            .attr("fill", "black")
            // .attr("opacity", 0.8)
        }
    ) 
    const dots = svg.selectAll("g.outlet")
    dots.sort((da, db) => -(da.articles - db.articles))
    // dots.attr("opacity", (d) => (d.articles < props.article_num_threshold? 0:0.8))
}
</script>

<style scoped lang="scss">
.scatter-container {
    height: inherit;
    width: inherit;
    background-color: white;
}
.outlet-scatterplot {
    // overflow: hidden;
    // height: inherit;
    max-height: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    // height: auto;
    // width: inherit;
    // aspect-ratio: 1;
    // height: 95vh;
}
.tooltip {
    transform-origin: top left;
    min-width: 200px;
}
.reset-zoom {
    position: absolute;
}
</style>