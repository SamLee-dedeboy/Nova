<template>
    <div :id="id" class="hex-container">
        <svg :id="id+'-svg'" class="hex-svg">
            <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
                <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
            </pattern>
        </svg>
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
import { schemeBrBG } from "d3";
const props = defineProps({
    title: String,
    id: String,
    entity_cooccurrences: Object as () => EntityCooccurrences,
    highlight_hex_entity: String,
    segmentation: Sentiment2D,
})
const emit = defineEmits(["hex-clicked"])

// const viewBox = [1000, 1000/(2*Math.sin(Math.PI/3))*3]
const viewBox = [640, 580]
const margin = { top: 0, bottom: 0, right: 0, left: 0 }
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom

const hex_radius = 40
const radius = hex_radius / (Math.sin(Math.PI / 3))
const hex_width = radius * 2 * Math.sin(Math.PI / 3)
const hex_height = radius * 3 / 2
const max_height = viewBox_width / hex_width * hex_height

const sorted_cooccurrence_list = vue.computed(() => {
    const raw_data = props.entity_cooccurrences?.sorted_cooccurrences_list!
    const center_hex_entity: HexEntity = props.entity_cooccurrences?.target!
    let res: any[] = [{ entity: center_hex_entity.entity, sst: center_hex_entity.sst, x: 0, y: 0, index: 0, exists: true }]
    // let res:any[] = []
    raw_data.forEach((hex_entity, index) => {
        const { x, y } = generate_hex_coord(index, hex_radius)
        res.push({
            entity: hex_entity.entity,
            x: x,
            y: y,
            sst: hex_entity.sst,
            exists: hex_entity.article_ids.length !== 0,
            index: index + 1,
        })
    })
    return res
})
// const hexbin = d3_hexbin.hexbin()
//     .radius(radius) // size of the bin in px
//     .extent([[0, 0], [viewBox_width, max_height]])
const x = d3.scaleLinear()
    .domain([-viewBox_width / 2, viewBox_width / 2])
    .range([0, viewBox_width])
const y = d3.scaleLinear()
    .domain([-max_height / 2, max_height / 2])
    .range([max_height + hex_height / 2, hex_height / 2])

const hexbin_ = d3_hexbin.hexbin()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .radius(radius) // size of the bin in px
    .extent([[0, 0], [viewBox_width, max_height]])
vue.watch(() => props.segmentation, (new_value, old_value) => {
    updateHexColor()
}, { deep: true })

vue.watch(() => props.highlight_hex_entity, (new_value, old_value) => {
    updateHighlightHex(new_value)
    removeHighlightHex(old_value)

})

vue.watch(() => props.entity_cooccurrences, (new_value, old_value) => {
    //empty-SVG
    updateHexBins()
})


vue.onMounted(() => {
    vue.nextTick(() => {
        const svg = d3.select(`#${props.id}`).select("svg")
            // const svg = d3.select(`#test-id`).select("svg")
            .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
        const hex_group = svg.append("g").attr("class", "hex-group")
        const hex_paths = hex_group.append("g").attr("class", "hex-paths")
        const hex_labels = hex_group.append("g").attr("class", "hex-labels")
        updateHexBins()
    })
})

function updateHexBins() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_group = svg.select("g.hex-group")
        .style("cursor", "pointer")

    const hex_labels =  svg.select("g.hex-labels")


    const hex_data = hexbin_(sorted_cooccurrence_list.value)
    // const centers = hexbin_.centers()
    // svg.selectAll("circle.center")
    //     .data(centers)
    //     .join("circle")
    //     .attr("class", "center")
    //     .attr("cx", (d:any) => d[0])
    //     .attr("cy", (d:any) => d[1])
    //     .attr("r", 3)
    //     .attr("fill", "blue")

    const centers_indexed: any[] = []
    hex_group.select("g.hex-paths")
        .selectAll("path")
        .data(hex_data)
        .join("path")
        .attr("d", hexbin_.hexagon())
        .attr("transform", function (d: any, index) {
            centers_indexed.push(d)
            return `translate(${d.x},${d.y})`
        })
        .attr("stroke", "white")
        .attr("stroke-width", (d, i) => i === 0 ? 20 : 1)
        .on("click", function (e, d: any) {
            const target = props.title?.split("-").slice(1).join("-")
            emit("hex-clicked", { target: target, co_occurr_entity: d[0].entity })
            // loopedAnimateHex(hex_group, target)
        })
        .on("mouseover", function (e, d: any) {
            if(d[0].entity === props.highlight_hex_entity) return
            if(d[0].index === 0) return
            d3.select(this)
                .transition().duration(100)
                .attr("stroke-width", d[0].index === 0 ? 25 : 8)
            // emit("mouseover", d[0].entity)
        })
        .on("mouseout", function (e, d: any) {
            if(d[0].entity === props.highlight_hex_entity) return
            if(d[0].index === 0) return
            d3.select(this)
                .transition().duration(500)
                .attr("stroke-width", d[0].index === 0 ? 20 : 1)
        })
        .attr("opacity", (d: any) => {
            if (d[0].exists) return 1
            else return 0.2
        })
        .attr("fill", (d: any) => {
            const sst = d[0].sst;
            return SstColors.enum_color_dict[categorizeHex(sst, props.segmentation!)]
        })
    // add looped animation for center hex
    const center_entity = hex_data[0][0].entity
    loopedAnimateHex(hex_group, center_entity)
    if(props.highlight_hex_entity)
        loopedAnimateHex(hex_group, props.highlight_hex_entity)


    hex_group.select("g.hex-labels")
        .selectAll("text")
        .data(hex_data)
        .join("text")
        .attr("pointer-events", "none")
        .attr("x", (d, i) => centers_indexed[i].x)
        .attr("y", (d, i) => centers_indexed[i].y) //compute from num words and subtract from the y 
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "black")
        .attr("font-size", "0.8em")
        .attr("opacity", (d: any) => {
            if (d[0].exists) return 1
            else return 0.5
        })
        .text((d: any) => {
            const words = d[0].entity.split("_")
            if(words.length > 4) {
                words[3] = "..."
                words.length = 4
            }
            // console.log(words.join(" "))
            return words.join(" ")
        })
        .call(wrap, 30)
        .on("click", function (e, d: any) {
            const target = props.title?.split("-").slice(1).join("-")
            emit("hex-clicked", { target: target, co_occurr_entity: d[0].entity })
        })
}

function updateHighlightHex(target_entity) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_group = svg.select("g.hex-group")
    loopedAnimateHex(hex_group, target_entity)

    const hex_data = hexbin_(sorted_cooccurrence_list.value)
    const center_entity = hex_data[0][0].entity
    loopedAnimateHex(hex_group, center_entity)
}

function removeHighlightHex(target_entity) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_group = svg.select("g.hex-group")
    var target_hex = hex_group.selectAll("path").filter((d:any) => d[0].entity === target_entity)
    target_hex.transition().duration(1000)
        .attr("stroke-width", (d: any) => d[0].index === 0 ? 20 : 1)
        .attr("stroke", "white")
        .on("end", () => (1))
}

function loopedAnimateHex(hex_group, target_entity) {
    var target_hex = hex_group.selectAll("path").filter((d:any) => d[0].entity === target_entity)
    // expand Hex
    repeat()
    function repeat() {
        console.log("looping")
        const duration = 1000
        target_hex.raise()
            .transition().duration(duration)
            .attr("stroke-width", 5)
            .attr("stroke", "#b7b7b7")
            .transition().duration(duration)
            .attr("stroke-width", 10)
            .attr("stroke", "grey")
            .on("end", repeat)
    }
}


// function contractHex(hex_path) {
//     hex_path.transition().duration(500)
//         .attr("stroke-width", 20)
//         .on("end", expandHex(hex_path))
// }

function wrap(text, width) {
    text.each(function (d, i) {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line: any[] = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em")
                .attr("text-anchor", "bottom")
                .attr("dominant-baseline", "central")
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node()!.getComputedTextLength() > width && line.length > 1) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .attr("dominant-baseline", "central")
                    .text(word);
            }
        }
        const line_num = text.selectAll("tspan").nodes().length
        const em_to_px = 16
        text.selectAll("tspan").attr("y", parseFloat(y) - em_to_px / 2 * lineHeight * (line_num - 1) / 2)
    });
}


function updateHexColor(animation = true) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_path_group = svg.select("g.hex-group")
    const hex_bins: any = hex_path_group.selectAll("path")
        .attr("fill", function (d: any) {
            const sst = d[0].sst
            return SstColors.enum_color_dict[categorizeHex(sst, props.segmentation!)]
        })

}

function categorizeHex(sst: Sentiment2D | undefined, segmentation: Sentiment2D) {
    if (sst === undefined) return SentimentType.unknown
    if (sst.pos < segmentation.pos && sst.neg < segmentation.neg) return SentimentType.neu
    if (sst.pos < segmentation.pos && sst.neg > segmentation.neg) return SentimentType.neg
    if (sst.pos > segmentation.pos && sst.neg < segmentation.neg) return SentimentType.pos
    if (sst.pos > segmentation.pos && sst.neg > segmentation.neg) return SentimentType.mix
    return SentimentType.neu
}

function distance_to_edge({ alpha, radius }) {
    const t = alpha % (Math.PI / 3)
    return Math.sqrt(3) * radius / (Math.sqrt(3) * Math.cos(t) + Math.sin(t))
}
function generate_hex_coord(index, radius) {
    return polar_to_cartesian(generate_polar(index, radius))
}
function polar_to_cartesian({ alpha, r }) {
    return { x: r * Math.cos(alpha), y: r * Math.sin(alpha) }
}
function generate_polar(index, radius) {
    const { level, M_l } = find_level(index)
    const d_alpha = 2 * Math.PI / (6 * (level + 1))
    const d_index = index - M_l
    const alpha = d_alpha * d_index
    const r = (level + 1) * 2 * (distance_to_edge({ alpha, radius }))
    return { alpha, r }
}

function find_level(index) {
    const M = (level: number) => (3 + 3 * level) * level
    // step 1: find level for index
    let level = 0
    while (true) {
        const M_l = M(level)
        const M_l_plus_one = M(level + 1)
        if (M_l <= index && M_l_plus_one > index) return { level, M_l }
        level += 1

        // prevent infinite loop
        if (level > 100) return { level, M_l: M(level) }
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
