<template>
<div :id="id" class="hex-container">
    <svg class="hex-svg"> </svg>
</div>
</template>
<script setup lang="ts">
import * as vue from "vue"
import * as d3 from "d3"
import * as d3_hexbin from "d3-hexbin"
import { updateOverviewGrid } from "./utils/TutorialUtils";
import * as SstColors from "./utils/ColorUtils"
import { SentimentType, Sentiment2D, EntityCooccurrences, HexEntity, ScatterNode } from "../types"
import { Ref, ref } from "vue"
const props = defineProps({
    title: String,
    id: String,
    entity_cooccurrences: Object as () => EntityCooccurrences,
    segmentation: Sentiment2D, 
    overall_entity_dict: Object as () => {[id: string]: ScatterNode},
})
const emit = defineEmits(["hex-clicked"])

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
    const center_hex_entity: HexEntity = props.entity_cooccurrences?.target! 
    let res: any[] = [{entity: center_hex_entity.entity, sst: center_hex_entity.sst, x:0,y:0, index:0, exists:true}]
    // let res:any[] = []
    raw_data.forEach((hex_entity, index) => {
        const {x, y} = generate_hex_coord(index, hex_radius) 
        res.push({
            entity: hex_entity.entity,
            x: x,
            y: y,
            sst: hex_entity.sst,
            exists: hex_entity.article_ids.length !== 0,
            index:index+1,
        })
    })
    return res
})
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

// vue.watch(() => props.overall_entity_dict, (new_value, old_value) => {
//     // updateHexColor(1000)
// }, {deep:true})

vue.watch(() => props.entity_cooccurrences, (new_value, old_value) => {
    updateHexBins()
})


vue.onMounted(() => {
    vue.nextTick(() => {
        const svg = d3.select(`#${props.id}`).select("svg")
        // const svg = d3.select(`#test-id`).select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
        svg.append("g").attr("class", "hex-group")
        updateHexBins()
    })
})

function updateHexBins() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_group = svg.select("g.hex-group")

    const hexbin_ = d3_hexbin.hexbin()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .radius(radius) // size of the bin in px
    .extent([[0, 0], [viewBox_width, max_height]])

    const hex_data = hexbin_(sorted_cooccurrence_list.value)


    hex_group.append("g")
    .attr("id","hex-paths")
    .attr("stroke","white")
    .selectAll("path")
    .data(hex_data)
    .join("path")
        .attr("d", hexbin_.hexagon())
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("fill", d => {
            const sst = d[0].sst;
            return  SstColors.enum_color_dict[categorizeHex(sst, props.segmentation!)]
        })
        .on("click", function(e, d) {
            const target = props.title?.split("-").slice(1).join("-")
            emit("hex-clicked", {target: target, co_occurr_entity: d[0].entity})
        })

    hex_group.append("g")
        .attr("id", "labels")
        .selectAll("text")
        .data(hex_data)
        .join("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y) //compute from num words and subtract from the y 
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "0.5em")
        .text(d => {
            const words = d[0].entity.split("_")
            let phrase = d[0].entity.replaceAll("_", " ")
            if(words.length > 4) {
                words[3] = "..."
                words.length = 4
            }
            return phrase
        })
        .call(wrap, 30)

}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}


function updateHexColor(overall_entity_dict:any=undefined) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_path_group = svg.select("g.hex-group")
    const hex_bins: any = hex_path_group.selectAll("path")
        .attr("fill", function (d) {
            const parentNode: any = (this as HTMLElement).parentNode
            const container: any = d3.select(parentNode)
            const parent_data: any = container.data()[0]
            const sst: Sentiment2D|undefined = (overall_entity_dict !== undefined && parent_data.sst !== undefined)? 
            { 
                pos: overall_entity_dict?.[parent_data.entity].pos_sst,
                neg: overall_entity_dict?.[parent_data.entity].neg_sst,
            }:
            parent_data.sst
            return SstColors.enum_color_dict[categorizeHex(sst, props.segmentation!)]
        })

}

function categorizeHex(sst: Sentiment2D|undefined, segmentation: Sentiment2D) {
    if(sst === undefined) return SentimentType.unknown
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
    const r = (level+1) * 2 * (distance_to_edge({alpha, radius}))
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


defineExpose({
    updateHexColor
})

</script>


<style scoped>
.hex-svg {
    width: 100%;
    height: 100%;
}
.hex-container {
    width: 100%;
    height: 100%;
}
</style>
