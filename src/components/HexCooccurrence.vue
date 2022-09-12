<template>
<div :id="id" class="hex-container">
    <svg>
        <filter :id="`${id}-brightness`">
            <feComponentTransfer>
            <feFuncR type="linear" slope="2.4" />
            <feFuncG type="linear" slope="2.4" />
            <feFuncB type="linear" slope="2.4" />
            </feComponentTransfer>
        </filter>
    </svg>
</div>
</template>
<script setup lang="ts">
import * as vue from "vue"
import * as d3 from "d3"
import * as d3_hexbin from "d3-hexbin"
import { updateOverviewGrid } from "./TutorialUtils";
import * as SstColors from "./ColorUtils"
import { SentimentType, Sentiment2D, EntityCooccurrences } from "../types"
import { nextTick } from "process";
import { Ref, ref } from "vue"
const props = defineProps({
    id: String,
    entity_cooccurrences: Object as () => EntityCooccurrences,
    segmentation: Sentiment2D, 
})


// const viewBox = [1000, 1000/(2*Math.sin(Math.PI/3))*3]
const viewBox = [640, 580]
const margin = {top: 0, bottom: 0, right:0, left: 0} 
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom

const hex_radius = 40 
const radius = hex_radius/(Math.sin(Math.PI/3))
const hex_width = radius*2*Math.sin(Math.PI/3)
const hex_height = radius*3/2
const max_height = viewBox_width/hex_width*hex_height

const sorted_cooccurrence_list = vue.computed(() => {
    const raw_data = props.entity_cooccurrences?.sorted_cooccurrences_list!
    let res: any[] = []
    raw_data.forEach((hex_entity, index) => {
        const {x, y} = generate_hex_coord(index, hex_radius) 
        res.push({
            entity: hex_entity.entity,
            x: x,
            y: y,
            mask: hex_entity.mask
        })
    })
    return res
})
const applyMask: Ref<boolean> = ref(false)
const hexbin = d3_hexbin.hexbin()
    .radius(radius) // size of the bin in px
    .extent([[0, 0], [viewBox_width, max_height]])
const x = d3.scaleLinear()
    .domain([-viewBox_width/2, viewBox_width/2])
    .range([0, viewBox_width])
const y = d3.scaleLinear()
    .domain([-max_height/2, max_height/2])
    .range([max_height + hex_height/2, hex_height/2])

vue.watch(() => props.segmentation, (new_value, old_value) => {
    updateHexColor()
}, {deep: true}) 

vue.watch(() => props.entity_cooccurrences, (new_value, old_value) => {
    updateHexBins()
})


vue.onMounted(() => {
    vue.nextTick(() => {
        const svg = d3.select(`#${props.id}`).select("svg")
        // const svg = d3.select(`#test-id`).select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
        svg.append("g").attr("class", "hex-path-group")
        updateHexBins()
    })
})

function updateHexBins() {
    console.log(applyMask.value)
    console.log(sorted_cooccurrence_list.value)
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_path_group = svg.select("g.hex-path-group")

    // prepare data
    const inputForHexbin: any[] = []
    sorted_cooccurrence_list.value.forEach((d: any) => {
        inputForHexbin.push( [x(d.x), y(d.y)] )  
    })
    const hex_bins: any = hex_path_group.selectAll("path")
        .data(hexbin(inputForHexbin))
    hex_bins.enter().append("path")
        .merge(hex_bins)
        .attr("d", d => `M${d.x},${d.y}${hexbin.hexagon()}`)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("filter", `url(#${props.id}-brightness)`)
        .attr("opacity", (d, i) => {
            if(!applyMask.value) return 1
            return sorted_cooccurrence_list.value[i].mask? 1:0
        })
    updateHexColor()

    // add labels
    const entity_text: any = hex_path_group.selectAll("text")
        .data(sorted_cooccurrence_list.value.concat([{entity: props.entity_cooccurrences?.entity, x: 0, y: 0, mask: true}]))
    entity_text.enter().append("text")
        .merge(entity_text)
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y) - 35 - (Math.min(d.entity.split("_").length,4)+0.5)/2*15 )
        .attr("opacity", (d) => {
            if(!applyMask.value) return 1
            return d.mask? 1:0
        })
        // .attr("y", d => y(d.y))
    const tspan = hex_path_group.selectAll("text").selectAll("tspan")
        .data((d) => {
            const words = d.entity.split("_")
            if(words.length > 4) {
                words[3] = "..."
                words.length = 4
            }
            return words
        })
    tspan.enter().append("tspan")
        .text(d => d)
        .attr("x", function(d) { return parseFloat(d3.select(this.parentNode).attr("x") )})
        .attr("dy", 15)
        .attr("font-size", "small")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
    
}

function updateHexColor() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_path_group = svg.select("g.hex-path-group")
    const hex_bins: any = hex_path_group.selectAll("path")
        .attr("fill", (d, i) => SstColors.enum_color_dict[categorizeHex(props.entity_cooccurrences?.sorted_cooccurrences_list[i].sst!, props.segmentation!)])

}

function categorizeHex(sst: Sentiment2D, segmentation: Sentiment2D) {
    if(sst.pos < segmentation.pos && sst.neg < segmentation.neg) return SentimentType.neu
    if(sst.pos < segmentation.pos && sst.neg > segmentation.neg) return SentimentType.neg
    if(sst.pos > segmentation.pos && sst.neg < segmentation.neg) return SentimentType.pos
    if(sst.pos > segmentation.pos && sst.neg > segmentation.neg) return SentimentType.mix
    return SentimentType.neu
}

function distance_to_edge({alpha, radius}) {
    const t = alpha % (Math.PI/3)
    return Math.sqrt(3)*radius/(Math.sqrt(3) * Math.cos(t) + Math.sin(t))
}
function generate_hex_coord(index, radius) {
    return polar_to_cartesian(generate_polar(index, radius))
}
function polar_to_cartesian({alpha, r}) {
    return {x: r*Math.cos(alpha), y: r*Math.sin(alpha)}
}
function generate_polar(index, radius) {
    const {level, M_l} = find_level(index)
    const d_alpha = 2*Math.PI/(6*(level+1))
    const d_index = index - M_l
    const alpha = d_alpha * d_index
    const r = (level+1) * 2 * distance_to_edge({alpha, radius})
    return {alpha, r}
}

function find_level(index) {
    const M = (level: number) => (3+3*level)*level
    // step 1: find level for index
    let level = 0
    while(true) {
        const M_l = M(level)
        const M_l_plus_one = M(level+1)
        if(M_l <= index && M_l_plus_one > index) return {level, M_l}
        level += 1

        // prevent infinite loop
        if(level > 100) return {level, M_l:M(level)}
    }
}

function updateMask() {
    console.log("update Mask")
    applyMask.value = true
    updateHexBins()
}

defineExpose({
    updateMask,
})

</script>


<style scoped>

</style>
