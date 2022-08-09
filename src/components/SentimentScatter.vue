<template>
<div :id="props.id" class="scatter-container" :class="panel_class">
    <svg class="outlet-scatterplot" :class="panel_class"></svg>
    <div class="button-set">
        <Button v-if="expanded" class="reset-zoom p-button-secondary" @click="resetZoom">reset</Button>
        <Button v-if="expanded" class="show-temporal p-button-secondary" @click="showTemporal">temporal</Button>
    </div>
    <TooltipVue class='tooltip' :content="tooltip_content" style="z-index: 1000;"></TooltipVue>
    <NodeInfo class='nodeinfo' :node="hovered_node_info" :total_articles="total_articles" style="position:absolute; z-index:1000;pointer-events: none;"></NodeInfo>
    <Menu id="overlay_menu" ref="menu" :model="menu_items" :popup="true" 
    style="position: absolute; width: fit-content;"></Menu>

</div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import TooltipVue from "./Tooltip.vue"
import Menu from "primevue/menu"
import * as d3 from "d3"
import { ScatterOutletNode, ScatterOutletGraph, ViewType, Sentiment2D, OutletNodeInfo } from '../types'
import * as SstColors from "./ColorUtils"
import { onMounted, PropType, computed, Ref, ref, defineEmits, nextTick} from 'vue'
import * as vue from 'vue'
import * as NodeUtils from "./NodeUtils"
import NodeInfo from './NodeInfo.vue'

// initialization
const props = defineProps({
    graph: Object as () => ScatterOutletGraph,
    graph_index: Number,
    id: String,
    highlight_node: String,
    expanded: Boolean,
    panel_class: String,
    article_num_threshold: Number,
    segment_mode: Boolean,
    segmentation: Object as () => Sentiment2D, 
})
const emit = defineEmits(['node_clicked', 'update:segmentation', 'show_temporal'])
const min_articles: Ref<number> = vue.inject('min_articles') || ref(0) 
const max_articles: Ref<number> = vue.inject('max_articles') || ref(0)
const outlet_article_num_dict: Ref<any> = vue.inject("outlet_article_num_dict") || ref({})
const total_articles = computed(() => {
    if(props.graph?.type === ViewType.EntityScatter) {
        const outlet = props.graph.title
        return outlet_article_num_dict.value[outlet]
    } else if(props.graph?.type === ViewType.OutletScatter) {
        return _.sumBy(props.graph?.nodes, (node) => (node.articles))
    } else {
        return undefined
    }
})
const {sst_threshold, updateThreshold} = vue.inject('segment_sst')
const tooltip_content: Ref<String> = ref("") 
const hovered_node_info: Ref<OutletNodeInfo> = ref({})
const tutorial_mode: Ref<boolean> = vue.inject("tutorial_mode") || ref(false)
const tutorial_step: Ref<number> = vue.inject("tutorial_step") || ref(0)
vue.watch(tutorial_step, (new_value, old_value) => {
    if(new_value === 1) {
    const svg = d3.select(`#${props.id}`).select("svg")
    svg.selectAll("circle.outlet_circle")
        .style("pointer-events", "none")
    }
})
vue.watch(() => props.highlight_node, (new_value, old_value) => {
    updateCanvas()
    // const svg = d3.select(`#${props.id}`) .select("svg")
    // const highlight_circle = svg.selectAll("circle.outlet_circle").filter(d => { return d.text.split("-")[0] === props.highlight_node})
    // console.log(highlight_circle.node())
    // highlight_circle.attr("fill", "blue")
})

const viewBox = [1000, 1000]
const outlet_min_radius = 10
const outlet_max_radius = 150
const margin = {top: 60, bottom: 60, right:40, left: 80} 
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom
const x = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ margin.left, viewBox_width ]);

const y = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ margin.top + viewBox_height, margin.top]);
const zoom = d3.zoom().scaleExtent([1, 3]).on("zoom", handleZoom)
const filtered_data = computed(() => props.graph?.nodes.filter(node => node.articles > (props.article_num_threshold || 0)))
const segment_controller_width = 12
const node_circle_radius = 10
const clicked_node: Ref<ScatterOutletNode> = ref({text: "", articles: 0, pos_sst: 0, neg_sst: 0})
const menu = ref()
const menu_items = ref([
    {
        label: "Compare with other outlets",
        command: () => {
            emit("node_clicked", {type: ViewType.OutletScatter, d: clicked_node.value})
        }
    },
    {
        label: "Show in TemporalView",
        command: () => {
            emit("node_clicked", {type: ViewType.Temporal, d: clicked_node.value})
        }
    },
    {
        label: "Show co-occurrence",
        command: () => {
        }
    },
    {
        label: "Show articles",
        command: () => {
        }
    },
])
var segment_point = {x: 0, y: 0} 
var segment_controller_start_x:number
var segment_controller_start_y:number
let current_zoom = undefined
vue.watch(() => props.segmentation, (new_value, old_value) => {
    segment_point = {x: x(new_value?.pos || 0.5), y: y(new_value?.neg || 0.5)}
    updateSegmentation()
}) 
vue.watch(() => props.graph, (graph, prev_graph) => {
    updateCanvas() 
})

vue.watch(() => props.article_num_threshold, () => {
    updateCanvas()
    updateOverviewTooltipContent()
})
vue.watch(() => props.segment_mode, (new_value) => {
    updateSegmentation()
    const svg = d3.select(`#${props.id}`).select("svg")
    svg.select("rect.segment-controller").style("opacity", new_value?1:0).raise()
})
onMounted(() => {
    const svg = d3.select(`#${props.id}`) .select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    d3.select(`#${props.id}`).select("div.tooltip")
        .style("opacity", 0)
    d3.select(`#${props.id}`).select(".nodeinfo")
        .style("opacity", 0)
    svg.append("g").attr("class", "node_group")
    updateOverviewTooltipContent()
    segment_point = {x: x(props.segmentation?.pos || 0.5), y: y(props.segmentation?.neg || 0.5)}
    updateSegmentation()

    if(props.expanded) {
        // svg.append("text")
        //     .text(props.graph?.title)
        //     .attr("x", () => viewBox[0]/2)
        //     .attr("y", 0)
        //     .attr("text-anchor", "middle")
        //     .attr("font-size", () => (props.expanded?"2em":"8em"))
        //     .attr("dominant-baseline", "hanging")
        svg.call(zoom)


        const drag = d3.drag()
            .on("start", function(e, d) { 
                segment_controller_start_x = e.x
                segment_controller_start_y = e.y
                d3.select(this).attr("stroke", "black")
            })
            .on("drag", function(e, d) { 
                let current_scale
                if (this.getAttribute("transform") === null)
                {
                    current_scale = 1; 
                } 
                //case where we have transformed the circle 
                else {
                    const current_scale_string = this.getAttribute("transform").split(' ')[1];
                    current_scale = +current_scale_string.substring(6,current_scale_string.length-1);
                }
                const end_x = segment_controller_start_x + ((e.x - segment_controller_start_x) / current_scale) 
                const end_y = segment_controller_start_y + ((e.y - segment_controller_start_y) / current_scale) 
                d3.select(this)
                    // .attr("x", d.x=(end_x-segment_controller_width/2) + (segment_controller_width-segment_controller_width/(current_zoom?.k || 1))/2)
                    // .attr("y", d.y=(end_y-segment_controller_width/2) + (segment_controller_width-segment_controller_width/(current_zoom?.k || 1))/2)
                    .attr("x", d.x=(end_x-(segment_controller_width/(current_zoom?.k || 1))/2))
                    .attr("y", d.y=(end_y-(segment_controller_width/(current_zoom?.k || 1))/2))
                    .raise()

                segment_point = {x: Math.max(margin.left, Math.min(end_x, viewBox_width)), y: Math.max(margin.top, Math.min(end_y, viewBox_height))} 
                emit("update:segmentation", {pos: x.invert(segment_point.x), neg: y.invert(segment_point.y)})
                updateSegmentation()
            })
            .on("end", function(e, d) { d3.select(this).attr("stroke", null)})

        svg.append("rect")
            .data([{x: segment_point.x-segment_controller_width/2, y:segment_point.y-segment_controller_width/2}])
            .attr("class", "segment-controller")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("width", segment_controller_width)
            .attr("height", segment_controller_width)
            .attr("fill", "red")
            .style("cursor", "pointer")
            .style("opacity", props.segment_mode?1:0)
            .call(drag)
            .on("mouseover", function(e, d) {
                d3.select(this).attr("stroke", "black")
            })
            .on("mouseout", function(e, d) {
                d3.select(this).attr("stroke", null)
            })

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
            .attr("x", viewBox[0]/2.1)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("font-size", "4em")
            .attr("dominant-baseline", "hanging")
        svg.on("mousemove", function(e, d) {
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("left", e.offsetX + 15 + "px")
            .style("top", e.offsetY - 5 + "px")
        })
        .on("mouseover", function(e, d) {
            if(tutorial_mode.value && tutorial_step.value === 0) return
            svg.style("filter", "brightness(80%)")
            .style("background-color", "rgb(191,189,189)")
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("opacity", 1)

        })
        .on("mouseout", function(e, d) {
            svg.style("filter", "brightness(100%)")
            .style("background-color", "white")
            d3.select(`#${props.id}`).select("div.tooltip")
            .style("opacity", 0)
        })
    }       
    updateCanvas()
    if(tutorial_mode.value && tutorial_step.value === 0) updateExpandedScatter()
    svg.append("g")
        .attr("class", "axis_x")
        .attr("transform", `translate(0, ${margin.top+viewBox_height})`)
        .call(d3.axisBottom(x))
    svg.append("text")
        .attr("class", "axis_x_label")
        .attr("transform", `translate(${margin.left+viewBox_width-15}, ${margin.top+viewBox_height+5})`)
        .attr("text-anchor", "middle")
        .text("positive score")
        .attr("fill", SstColors.pos_color)

    svg.append("g")
        .attr("class", "axis_y")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .raise()
    svg.append("text")
        .attr("class", "axis_y_label")
        .attr("transform", `translate(${margin.left}, ${margin.top-10})`)
        .attr("text-anchor", "middle")
        .text("negative score")
        .attr("fill", SstColors.neg_color)
})


function resetZoom() {
    const svg = d3.select(`#${props.id}`).select("svg")
    svg.call(zoom.transform, d3.zoomIdentity)
    svg.selectAll("g.axis_x")
        .call(zoom.transform, d3.zoomIdentity)
    svg.selectAll("g.axis_y")
        .call(zoom.transform, d3.zoomIdentity)
    svg.selectAll("g.outlet")
        .call(zoom.transform, d3.zoomIdentity)
    current_zoom = d3.zoomIdentity
}

function handleZoom(e) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const outlet_group = svg.selectAll("g.outlet")
        .attr("transform", e.transform)
    
    outlet_group.selectAll("circle")
        .attr("r", node_circle_radius/e.transform.k)

    svg.selectAll("g.axis_x")
        .attr("transform", `translate(${e.transform.x},${margin.top+viewBox_height}) scale(${e.transform.k})`)

    svg.selectAll("g.axis_y")
        .attr("transform", `translate(${margin.left},${e.transform.y}) scale(${e.transform.k})` )
    svg.selectAll("g.segmentation > rect")
        .attr("transform", e.transform)
    const segment_controller = svg.selectAll("rect.segment-controller")
    segment_controller
        .attr("transform", e.transform)
        .attr("width", segment_controller_width/e.transform.k)
        .attr("height", segment_controller_width/e.transform.k)
        .attr("x", () => (segment_point.x - (segment_controller_width/e.transform.k)/2))
        .attr("y", () => (segment_point.y - (segment_controller_width/e.transform.k)/2))

    current_zoom = e.transform
}

function updateSegmentation() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const segment_group = svg.selectAll("g.segmentation")
    .data([segment_point])

    segment_group.enter().append("g")
        .attr("class", "segmentation")
        .lower()

    // neg
    const neg_rect = segment_group.selectAll("rect.neg")
    segment_group.enter().select("g.segmentation").append("rect")
                .attr("class", "neg")
                .attr("fill", SstColors.neg_color)
                .style("filter", `brightness(${SstColors.brightness}%)`)
                .merge(neg_rect)
                .attr("x", margin.left)
                .attr("y", margin.top)
                .attr("width", (d) => segment_point.x-margin.left)
                .attr("height", (d) => segment_point.y-margin.top)
                .lower()
    // neu
    const neu_rect = segment_group.selectAll("rect.neu")
    segment_group.enter().select("g.segmentation").append("rect")
                .attr("class", "neu")
                .attr("fill", SstColors.neu_color)
                .style("filter", `brightness(${SstColors.brightness}%)`)
                .merge(neu_rect)
                .attr("x", margin.left)
                .attr("y", (d) =>  segment_point.y)
                .attr("width", (d) => segment_point.x-margin.left)
                .attr("height", (d) => viewBox_height-segment_point.y+margin.top)

    // pos
    const pos_rect = segment_group.selectAll("rect.pos")
    segment_group.enter().select("g.segmentation").append("rect")
                .attr("class", "pos")
                .attr("fill", SstColors.pos_color)
                .style("filter", `brightness(${SstColors.brightness}%)`)
                .merge(pos_rect)
                .attr("x", (d) => segment_point.x)
                .attr("y", (d) => segment_point.y)
                .attr("width", (d) => viewBox_width-segment_point.x)
                .attr("height", (d) => viewBox_height-segment_point.y + margin.top)
    // mixed
    const mixed_rect = segment_group.selectAll("rect.mixed")
    segment_group.enter().select("g.segmentation").append("rect")
                .attr("class", "mixed")
                .attr("fill", SstColors.mixed_color)
                .style("filter", `brightness(${SstColors.brightness}%)`)
                .merge(mixed_rect)
                .attr("x", (d) => segment_point.x)
                .attr("y", margin.top)
                .attr("width", (d) => viewBox_width-segment_point.x)
                .attr("height", (d) => segment_point.y-margin.top)
    svg.selectAll("g.segmentation")
        .style("opacity", props.segment_mode?1:0)
        .style("pointer-events", "none")
    svg.selectAll("rect.segment-controller")
        .data([{x: segment_point.x-segment_controller_width/2, y:segment_point.y-segment_controller_width/2}])
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        // .attr("x", () => (segment_point.x-segment_controller_width/2))
        // .attr("y", () => (segment_point.y-segment_controller_width/2))


}

function updateExpandedTooltipContent(data: ScatterOutletNode) {
    tooltip_content.value = 
    `title: ${data.text} <br>` + 
    `&nbsp #articles: ${data.articles}/${total_articles.value} <br>` +
    `&nbsp sst: (${data.pos_sst.toFixed(2)}, ${data.neg_sst.toFixed(2)}) <br>` 
    

}

function updateOverviewTooltipContent() {
    const nodes = filtered_data.value! 
    const title = props.graph?.title
    const entity_num = nodes.length || 0
    const avg_pos_sst = _.mean(nodes.map(node => node.pos_sst))
    const avg_neg_sst = _.mean(nodes.map(node => node.neg_sst))
    nodes.sort((node_a, node_b) => -(node_a.articles - node_b.articles))
    tooltip_content.value = 
    `${title}: <br>` + 
    `&nbsp #entities: ${entity_num} <br>` +
    `&nbsp top entities:<ol>` 
    for(let i = 0; i < Math.min(3, nodes.length); ++i) {
        tooltip_content.value +=
        `<li>${nodes[i].text.split("-")[0]}</li>`
    }
    tooltip_content.value += "</ol>" +
    `&nbsp avg_sst: (${avg_pos_sst.toFixed(2)}, ${avg_neg_sst.toFixed(2)}) <br>` 
    if(props.graph?.type === ViewType.EntityScatter) {
        tooltip_content.value += `&nbsp total_articles: ${total_articles.value} <br>`
    }
}

function updateCanvas() {
    if(props.expanded)
        updateExpandedScatter()
    else 
        updateOverviewScatter()
} 

function updateExpandedScatter() {
    updateOverviewScatter()
    const svg = d3.select(`#${props.id}`).select("svg")

    // add events
    svg.selectAll("circle.outlet_circle")
        .style("cursor", "pointer")
        .on("mousemove", function(e, d) {
            let align_image_offset = 0
            if(props.graph?.type === ViewType.OutletScatter) align_image_offset = 50 - 15
            d3.select(`#${props.id}`).select(".nodeinfo")
                .style("left", e.offsetX + align_image_offset + 15 + "px")
                .style("top", e.offsetY - 5 - align_image_offset + "px")
        })
        .on("mouseover", function(e, d) {
            const container = d3.select(this.parentNode)
            container.style("filter", "brightness(90%)")
            // apply hover effect
            container.selectAll("circle.expand_circle")
                .transition().duration(100)
                .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r"))*1.5 ))
            const target_node_text = container.data()[0].text
            const other_nodes_container = d3.select(`#${props.id}`).selectAll("g.outlet").filter((d) => d.text != target_node_text)
            other_nodes_container.selectAll("image")
                .attr("opacity", 0)
            container.selectAll("image")
                .transition().duration(100)
                .attr("opacity", 0.8)

            // update tooltip
            updateNodeInfo(d)
            d3.select(`#${props.id}`).select(".nodeinfo")
                .style("opacity", 1)
        })
        .on("mouseout", function(e, d) {
            const container = d3.select(this.parentNode)
            container.style("filter", "brightness(100%)")
            container.selectAll("circle.expand_circle")
                .transition().duration(100)
                .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r"))))
            const target_node_text = container.data()[0].text
            const other_nodes_container = d3.select(`#${props.id}`).selectAll("g.outlet").filter((d) => d.text != target_node_text)
            other_nodes_container.selectAll("image")
                .attr("opacity", 0.3)
            container.selectAll("image")
                .transition().duration(100)
                .attr("opacity", 0.3)

            d3.select(`#${props.id}`).select(".nodeinfo")
                .style("opacity", 0)
        })
        .on("click", (e, d) =>  {
            if(tutorial_mode.value && tutorial_step.value < 7) { return }
            menu.value.toggle(e)
            d3.select(`#${props.id}`).select(".nodeinfo")
                .style("opacity", 0)
            nextTick(() => {
                const overlay_menu = d3.select("#overlay_menu")
                    overlay_menu.style("left", e.clientX + 5 + "px")
                    .style("top", e.clientY + 5 + "px")
                clicked_node.value = d
            })
        })

    // add images if comparing across outlets
    if(props.graph?.type === ViewType.OutletScatter) {
        const outlets = svg.selectAll("g.outlet")
        const image_size = 100
        outlets.selectAll("image.outlet_image")
            .attr("href", (d) => `src/assets/${NodeUtils.abbr_dict[d.text.split("-")[1]]}.png`)
            .attr("height", image_size)
            .attr("width", image_size)
            .attr("x", (d) => x(d.pos_sst)-image_size/2)
            .attr("y", (d) => y(Math.abs(d.neg_sst))-image_size/2)
            .attr("opacity", 0.3)
            .attr("pointer-events", "none")
            .lower()
            .lower()
    }

}

function updateOverviewScatter() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const article_radius_scale = d3.scalePow()
    .exponent(1)
    .domain([ min_articles, max_articles ])
    .range([ outlet_min_radius, outlet_max_radius ]);

    let bind_data;
    if(props.graph?.type === ViewType.EntityScatter) bind_data = filtered_data.value
    if(props.graph?.type === ViewType.OutletScatter) bind_data = props.graph.nodes
    const node_group = svg.select("g.node_group")
    node_group.selectAll("g.outlet")
    .data(bind_data, function(d) {return d.text})
    .join(
        enter => {
            const group = enter.append("g").attr("class", "outlet")
            group.append("circle")
                .attr("class", "outlet_circle")
                // .attr("r", (d) => article_radius_scale(d.articles))
                .attr("r", node_circle_radius/(current_zoom?.k || 1))
                .attr("cx", (d) => x(d.pos_sst))
                .attr("cy", (d) => y(Math.abs(d.neg_sst)))
                // .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
                .attr("fill", (d) => d.articles === 0? "white" :SstColors.article_num_color_scale(d.articles/max_articles.value))
                .attr("opacity", 0.8)
                .raise()
            group.append("circle")
                .attr("class", "expand_circle")
                // .attr("r", (d) => article_radius_scale(d.articles))
                .attr("r", node_circle_radius/(current_zoom?.k || 1))
                .attr("cx", (d) => x(d.pos_sst))
                .attr("cy", (d) => y(Math.abs(d.neg_sst)))
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("stroke-dasharray", (d) => d.articles === 0? 2.5 : 0)
                .lower()
            group.append("image")
                .attr("class", "outlet_image")
        },
        update => {
            update.selectAll("circle")
            // .attr("r", (d) => article_radius_scale(d.articles))
                .attr("r", node_circle_radius/(current_zoom?.k || 1))
                .attr("cx", (d) => x(d.pos_sst))
                .attr("cy", (d) => y(Math.abs(d.neg_sst)))

            update.selectAll("circle.outlet_circle")
            // .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
            .attr("fill", (d) => SstColors.article_num_color_scale(d.articles/max_articles.value))
            // .attr("opacity", 0.8)
        }
    ) 
    const dots = svg.selectAll("g.outlet")
    dots.sort((da, db) => (da.articles - db.articles))
    if(current_zoom) {
        dots.attr("transform", current_zoom)
    }
    if(props.graph?.type === ViewType.EntityScatter) {
        const highlight_circle = svg.selectAll("circle.outlet_circle").filter(d => { return d.text.split("-")[0] === props.highlight_node})
        highlight_circle.attr("fill", "blue")
    }
    
    // dots.attr("opacity", (d) => (d.articles < props.article_num_threshold? 0:0.8))
}

function showTemporal() {
    let emit_data;
    if(props.graph?.type === ViewType.EntityScatter) emit_data = filtered_data.value
    if(props.graph?.type === ViewType.OutletScatter) emit_data = props.graph.nodes
    emit("show_temporal", emit_data)
}

function updateNodeInfo(node_data: ScatterOutletNode) {
    hovered_node_info.value = {
        text: node_data.text,
        pos_articles: node_data.pos_articles,
        neg_articles: node_data.neg_articles,
        pos_score: node_data.pos_sst,
        neg_score: node_data.neg_sst,
    }


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
.button-set {
    position: absolute;
    left: 70%;
    top:-4%;
    display:inline-flex;
}
.reset-zoom {
    font-size: smaller;
    padding-top: 3px;
    padding-bottom: 3px;
    padding-left: 5px;
    padding-right: 5px;
}
.show-temporal {
    font-size: smaller;
    padding-top: 3px;
    padding-bottom: 3px;
    padding-left: 5px;
    padding-right: 5px;
    margin-left:5px;
}
</style>