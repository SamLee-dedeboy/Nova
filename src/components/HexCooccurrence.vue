<template>
    <div :id="id" class="hex-container">
        <svg :id="id+'-svg'" class="hex-svg">

        </svg>
    </div>
</template>
<script setup lang="ts">
import * as vue from "vue"
import * as d3 from "d3"
import * as d3_hexbin from "d3-hexbin"
import * as SstColors from "./utils/ColorUtils"
import { SentimentType, Sentiment2D, EntityCooccurrences, HexEntity, ScatterNode } from "../types"
import { Ref, ref } from "vue"
import { schemeBrBG } from "d3";
const props = defineProps({
    title: String,
    id: String,
    entity_cooccurrences: Object as () => EntityCooccurrences,
    highlight_hex_entity: String,
    segmentation:  Object as () => Sentiment2D,
    mode: String,
    show_blink: Boolean,
    show_label: Boolean,
})
const emit = defineEmits(["hex-clicked"])

// const viewBox = [1000, 1000/(2*Math.sin(Math.PI/3))*3]
const viewBox = [640, 680]
const margin = { top: 0, bottom: 0, right: 0, left: 0 }
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom

const hex_radius = 40
const radius = hex_radius / (Math.sin(Math.PI / 3))
const hex_width = radius * 2 * Math.sin(Math.PI / 3)
const hex_height = radius * 3 / 2
const max_height = viewBox_width / hex_width * hex_height

const dragged_hex = ref()
const entity_hex_index_dict = ref({})

const sorted_cooccurrence_list = vue.computed(() => {
    const raw_data = props.entity_cooccurrences?.sorted_cooccurrences_list!
    const center_hex_entity: HexEntity = props.entity_cooccurrences?.target!
    let res: any[] = [{ entity: center_hex_entity.entity, sst: center_hex_entity.sst, x: 0, y: 0, index: 0, exists: true, assigned_hex_index: -1 }]
    let sst_bins = {}
    // bin hex entities by sst
    raw_data.forEach(hex_entity => {
        const sst_category = categorizeHex(hex_entity.sst, props.segmentation)
        if(sst_bins[sst_category] === undefined) {
            sst_bins[sst_category] = []
        }
        sst_bins[sst_category].push(hex_entity.entity)
    })
    let unknown_count = 0
    raw_data.forEach((hex_entity, index) => {
        let coord;
        if(props.mode === "user")
            coord = generate_hex_list_coord(index, hex_radius)
        else {
            const sst_category = categorizeHex(hex_entity.sst, props.segmentation)
            const sst_index = sst_bins[sst_category].indexOf(hex_entity.entity)
            if(unknown_count < 0) {
                coord = generate_sst_hex_coord(SentimentType.unknown, unknown_count, hex_radius)
                unknown_count += 1
            } else 
                coord = generate_sst_hex_coord(sst_category, sst_index, hex_radius)
        }
        const { x, y } = coord
        res.push({
            entity: hex_entity.entity,
            x: x,
            y: y,
            sst: hex_entity.sst,
            sst_category: categorizeHex(hex_entity.sst, props.segmentation),
            exists: hex_entity.article_ids.length !== 0,
            index: index + 1,
            assigned_hex_index: -1,
        })
    })
    return res
})

const blank_hexbins = vue.computed(() => {
    let bins: any = []
    let length = 0
    // mix, pos and neg
    for(let count = 0; count < 18; count++) {
        const { x, y } = generate_hex_coord(count, hex_radius)
        if(count == 7 || count == 11) continue
        if(count == 15) {
            bins.push({
                x: x,
                y: y,
                i: length,
                sst: SentimentType.neu,
                index: count + 1,
                level: find_level(count),
            })
            length += 1
            continue
        }
        const sst = index_to_sst(count)
        bins.push({
            x: x,
            y: y,
            i: length,
            sst: sst,
            index: count + 1,
            level: find_level(count),
        })
        length += 1
    }
    // neu 
    for(let count = 30; count < 30+3; count++) {
        const { x, y } = generate_hex_coord(count, hex_radius)
        bins.push({
            x: x,
            y: y,
            i: length,
            sst: SentimentType.neu,
            index: count + 1,
            level: find_level(count),
        })
        length += 1
    }
    bins.push({
        x: generate_hex_coord(33, hex_radius).x,
        y: generate_hex_coord(33, hex_radius).y,
        i: length,
        sst: SentimentType.neu,
        index: 33,
        level: find_level(33),
    })

    return bins
})
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

const centers_indexed: any[] = []
vue.watch(() => props.segmentation, (new_value, old_value) => {
    updateHexColor()
}, { deep: true })

vue.watch(() => props.highlight_hex_entity, (new_value, old_value) => {
    console.log("highlight_hex_entity", new_value, old_value)
    updateHighlightHex()
    removeHighlightHex(old_value)
})

vue.watch(() => props.entity_cooccurrences, (new_value, old_value) => {
    //empty-SVG
    updateHive()
})
vue.watch(() => props.show_label, (new_value, old_value) => {
    updateHive()
})


vue.onMounted(() => {
    vue.nextTick(() => {
        const svg = d3.select(`#${props.id}`).select("svg")
            // const svg = d3.select(`#test-id`).select("svg")
            .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
        // const hex_group = svg.append("g").attr("class", "hex-group")
        // const hex_paths = hex_group.append("g").attr("class", "hex-paths")
        // const hex_labels = hex_group.append("g").attr("class", "hex-labels")
        // init()
        updateHive()
    })
})

function init() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_group = svg.append("g").attr("class", "hex-group")
    const hex_paths = hex_group.append("g").attr("class", "hex-paths")
    const hex_bins = hex_group.append("g").attr("class", "hex-bins")
    const hex_labels = hex_group.append("g").attr("class", "hex-labels")
}

function updateHive() {
    if(props.mode === "user") {
        updateUserHex()
    } else if(props.mode === "data") {
        updateDataHex()
    }
}

function updateDataHex() {
    const svg = d3.select(`#${props.id}`).select("svg")
    // delete everything to avoid blinking bug
    svg.selectAll("*").remove()

    // append everything back
    init()

    // update begins
    const hex_group = svg.select("g.hex-group").attr("transform", "translate(0, -80)")

    const hex_labels =  svg.select("g.hex-labels")
    const blank_hex_data = hexbin_(blank_hexbins.value)
    hex_group.select("g.hex-bins").lower()
        .selectAll("path.hex-bins")
        .data(blank_hex_data)
        .join("path")
        .style("pointer-events", "none")
        .attr("class", "hex-bins")
        .attr("d", hexbin_.hexagon())
        .attr("transform", function (d: any, index) {
            if(index >= centers_indexed.length)
                centers_indexed.push(d)
            else
                centers_indexed[index] = d
            return `translate(${d.x},${d.y})`
        })
        .attr("stroke", "#444444")
        .attr("stroke-width", 1)
        .attr("fill", (d: any) => {
            const sst = d[0].sst;
            return SstColors.enum_color_dict[sst]
        })

    const hex_data = hexbin_(sorted_cooccurrence_list.value)
    hex_group.select("g.hex-paths")
        .selectAll("path.hexagon")
        .data(hex_data)
        .join("path")
        .attr("class", "hexagon")
        .attr("cursor", "pointer")
        .attr("d", hexbin_.hexagon())
        .attr("transform", function (d: any, index) {
            // centers_indexed.push(d)
            return `translate(${d.x},${d.y})`
        })
        .attr("filter",(d, i) => i===0? "blur(1px)": "none")
        // .attr("stroke", (d,i) => i===0? "#444444": "white")
        .attr("stroke", (d,i) => i===0? "#444444": "black")
        .attr("stroke-width", (d, i) => i === 0 ? 7 : 1)
        .on("click", function (e, d: any) {
            console.log({clickedEntity: d[0].entity})
            emit("hex-clicked", { clickedEntity: d[0].entity })
        })
        .on("mouseover", function (e, d: any) {
            if(d[0].entity === props.highlight_hex_entity) return
            if(d[0].index === 0) return
            if(d[0].index === dragged_hex.value) return
            d3.select(this)
                .transition().duration(100)
                .attr("stroke-width",  8)
            if(props.show_blink)
                d3.select(this).raise()
        })
        .on("mouseout", function (e, d: any) {
            if(d[0].entity === props.highlight_hex_entity) return
            if(d[0].index === 0) return
            d3.select(this)
                .transition().duration(500)
                .attr("stroke-width", 1)
        })
        .attr("opacity", (d: any) => {
            if (d[0].exists) return 1
            else return 0.2
        })
        .attr("fill", (d: any, i) => {
            const sst = d[0].sst;
            return (d[0].exists) ? SstColors.enum_color_dict[categorizeHex(sst, props.segmentation!)] : '#dddddd'
        })
        // define drag behavior
        .call(drag)
    
    // add looped animation for center hex
    const center_entity = hex_data[0][0].entity
    if(props.show_blink) {
        removeHighlightHex(center_entity)
        loopedAnimateHex(hex_group)
    }
    if(props.highlight_hex_entity) {
        removeHighlightHex(hex_group)
        loopedAnimateHex(hex_group)
    }


    hex_group.select("g.hex-labels")
        .selectAll("text")
        .data(hex_data)
        .join("text")
        .attr("pointer-events", "none")
        // .attr("x", (d, i) => centers_indexed[i].x)
        // .attr("y", (d, i) => centers_indexed[i].y) //compute from num words and subtract from the y 
        .attr("x", (d: any, i) => d.x)
        .attr("y", (d: any, i) => d.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "black")
        .attr("font-size", "0.8em")
        .attr("opacity", (d: any, i) => {
            if(i === 0) return 1
            if(props.show_label === false) return 0
            if(d[0].exists) return 1
            else return 0.5
        })
        .text((d: any) => {
            const words = d[0].entity.split("_")
            if(words.length > 4) {
                words[3] = "..."
                words.length = 4
            }
            // //console.log(words.join(" "))
            return words.join(" ")
        })
        .call(wrap, 30)
}


function updateUserHex() {
    const svg = d3.select(`#${props.id}`).select("svg")
    // delete everything to avoid blinking bug
    svg.selectAll("*").remove()

    // append everything back
    init()

    // update begins
    const hex_group = svg.select("g.hex-group").attr("transform", "translate(0, -80)")

    const hex_labels =  svg.select("g.hex-labels")
    const blank_hex_data = hexbin_(blank_hexbins.value)
    const hex_data = hexbin_(sorted_cooccurrence_list.value)
    hex_group.select("g.hex-bins")
        .selectAll("path.hex-bins")
        .data(blank_hex_data)
        .join("path")
        .attr("class", "hex-bins")
        .attr("d", hexbin_.hexagon())
        .attr("transform", function (d: any, index) {
            if(index >= centers_indexed.length)
                centers_indexed.push(d)
            else
                centers_indexed[index] = d
            return `translate(${d.x},${d.y})`
        })
        .attr("stroke", "#444444")
        .attr("stroke-width", 1)
        .attr("fill", (d: any) => {
            const sst = d[0].sst;
            return SstColors.enum_color_dict[sst]
        })

    hex_group.select("g.hex-paths")
        .selectAll("path.hexagon")
        .data(hex_data)
        .join("path")
        .style("cursor", "pointer")
        .attr("class", "hexagon")
        .attr("d", hexbin_.hexagon())
        .attr("transform", function (d: any, index) {
            // centers_indexed.push(d)
            return `translate(${d.x},${d.y})`
        })
        .attr("filter",(d, i) => i===0? "blur(1px)": "none")
        // .attr("stroke", (d,i) => i===0? "#444444": "white")
        .attr("stroke", (d,i) => i===0? "#444444": "black")
        .attr("stroke-width", (d, i) => i === 0 ? 7 : 1)
        .on("mouseover", function (e, d: any) {
            if(d[0].entity === props.highlight_hex_entity) return
            if(d[0].index === 0) return
            if(d[0].index === dragged_hex.value) return
            d3.select(this)
                .transition().duration(100)
                .attr("stroke-width",  8)
            if(props.show_blink)
                d3.select(this).raise()
        })
        .on("mouseout", function (e, d: any) {
            if(d[0].entity === props.highlight_hex_entity) return
            if(d[0].index === 0) return
            d3.select(this)
                .transition().duration(500)
                .attr("stroke-width", 1)
        })
        .attr("fill", (d: any, i) => {
            if(i != 0) return "white"
            const sst = d[0].sst;
            return (d[0].exists) ? SstColors.enum_color_dict[categorizeHex(sst, props.segmentation!)] : '#dddddd'
        })
        // define drag behavior
        .call(drag)
    
    // add looped animation for center hex
    const center_entity = hex_data[0][0].entity
    if(props.show_blink) {
        removeHighlightHex(center_entity)
        loopedAnimateHex(hex_group)
    }
    // if(props.highlight_hex_entity) {
    //     removeHighlightHex(hex_group)
    //     loopedAnimateHex(hex_group)
    // }


    hex_group.select("g.hex-labels")
        .selectAll("text")
        .data(hex_data)
        .join("text")
        .attr("pointer-events", "none")
        // .attr("x", (d, i) => centers_indexed[i].x)
        // .attr("y", (d, i) => centers_indexed[i].y) //compute from num words and subtract from the y 
        .attr("x", (d: any, i) => d.x)
        .attr("y", (d: any, i) => d.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "black")
        .attr("font-size", "0.8em")
        .text((d: any) => {
            const words = d[0].entity.split("_")
            if(words.length > 4) {
                words[3] = "..."
                words.length = 4
            }
            // //console.log(words.join(" "))
            return words.join(" ")
        })
        .call(wrap, 30)
}

function updateHighlightHex() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_group = svg.select("g.hex-group")
    loopedAnimateHex(hex_group)
}

function removeHighlightHex(target_entity) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_group = svg.select("g.hex-group")
    let target_hex;
    if(props.mode === 'user') {
        target_hex = hex_group.selectAll("path.hex-bins").filter((d:any) => d[0].i === entity_hex_index_dict.value[target_entity])
    } else {
        target_hex = hex_group.selectAll("path.hexagon").filter((d:any) => d[0].entity === target_entity)
    }
    target_hex.transition().duration(0)
        .attr("stroke-width", (d: any) => d[0].index === 0 ? 20 : 1)
        .attr("stroke", "#444444")
        .attr("filter", "unset")
        .on("end", () => (1))
}

function loopedAnimateHex(hex_group) {
    const center_entity = hexbin_(sorted_cooccurrence_list.value)[0][0].entity
    const co_entity = props.highlight_hex_entity
    // if(!props.show_blink) {
    //     // hack for static highlight
    //     const target_path = hex_group.selectAll("path.hexagon").filter(function (d:any) {
    //         return d[0].entity === center_entity || d[0].entity === co_entity
    //     })
    //     target_path
    //         .attr("stroke-width", 7)
    //         .attr("stroke", "#444444")
    //         .attr("filter","blur(1px)")
    //         .raise()
    //     return
    // }
    var target_path;
    if(props.mode === 'user') {
        target_path = hex_group.selectAll("path").filter(function (d:any) {
            if(d[0].entity !== undefined) return d[0].entity === center_entity
            else return entity_hex_index_dict.value[co_entity] === d[0].i
        })
    } else if(props.show_blink){
        target_path = hex_group.selectAll("path.hexagon").filter(function (d:any) {
            return d[0].entity === center_entity || d[0].entity === co_entity
        })
    }
    repeat()
    function repeat() {
        const duration = 1000
        if(target_path) {
            target_path.raise()
                .transition().duration(0)
                .attr("stroke-width", 2)
                .attr("stroke", "white")
                .transition().duration(1000)
                .attr("stroke-width", 7)
                .attr("stroke", "#444444")
                .attr("filter","blur(1px)")
                .transition().duration(2000)
                .attr("stroke-width", 2)
                .attr("stroke", "white")
                .on("end", repeat)
        }
    }
}


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
function drag(eles) {
    function dragstarted(event, d) {
        if(d3.select(this).attr("class") === "hex-bins") {
            // find hexagon that was assigned to this hex-bin
            const i = d[0].i
            const hexagon = d3.selectAll("path.hexagon").filter((d) => d[0].assigned_hex_index === i)
            dragged_hex.value = hexagon.data()[0][0].index
            hexagon.raise().attr("stroke", "black").attr("stroke-width", 1)
            // hexagon.call(drag)
            return
        }
        dragged_hex.value = d[0].index
        d3.select(this).raise().attr("stroke", "black").attr("stroke-width", 1);
    }

    function dragged(event, d) {
        // reset previous highlighted hex
        d3.select("g.hex-group").selectAll("path.hex-bins").attr("stroke-width", 1)
        let dragged_selection: any = d3.select(this)
        if(d3.select(this).attr("class") === "hex-bins") {
            // find hexagon that was assigned to this hex-bin
            const i = d[0].i
            const hexagon = d3.selectAll("path.hexagon").filter((d) => d[0].assigned_hex_index === i)
            // hexagon.attr("transform", "translate(" + event.x + "," + event.y + ")")
            //                 .attr("stroke", "#444444").attr("stroke-width", 1)
            dragged_selection = hexagon
            d = hexagon.data()[0]
        }

        // move the hex
        dragged_selection.attr("transform", "translate(" + event.x + "," + event.y + ")")
        
        const closest_hex_index = find_closest_hex_index(event.x, event.y)
        let closest_hex_center = {x: event.x, y: event.y}
        // check if a hex is found
        if(closest_hex_index === -1) {
            dragged_selection.attr("stroke", "black").attr("stroke-width", 1).attr("fill", "none")
        } else {
            closest_hex_center = centers_indexed[closest_hex_index]
            // if found, remove the stroke of dragged hex
            dragged_selection.attr("stroke", "none")
            // highlight closest hex
            const closest_hex = d3.select("g.hex-group").selectAll("path.hex-bins").filter(function (d) { return d[0].i === closest_hex_index;})
            closest_hex.transition().duration(0).attr("stroke-width", 7).style("z-index", "100")
            closest_hex.raise()
        }
        // adjust label position
        const label = d3.select("g.hex-labels").selectAll("text").filter((ele: any) => ele[0].entity === d[0].entity)
        label.attr("x", closest_hex_center.x)
            .attr("y", closest_hex_center.y)
        // adjust tspan
        const line_num = label.selectAll("tspan").nodes().length
        const lineHeight = 1.1 // ems
        const em_to_px = 16
        label.selectAll("tspan")
            .attr("x", closest_hex_center.x)
            // .attr("y", closest_hex_center.y)
            .attr("y", parseFloat(closest_hex_center.y) - em_to_px / 2 * lineHeight * (line_num - 1) / 2) 
        // console.log(closest_hex_center.y, parseFloat(closest_hex_center.y) - em_to_px / 2 * lineHeight * (line_num - 1) / 2)

    }

    function dragended(event, d) {
        let dragged_selection: any = d3.select(this)
        dragged_hex.value = -1
        if(d3.select(this).attr("class") === "hex-bins") {
            // find hexagon that was assigned to this hex-bin
            const i = d[0].i
            const hexagon = d3.selectAll("path.hexagon").filter((d) => d[0].assigned_hex_index === i)
            dragged_selection = hexagon
            d = hexagon.data()[0]
        }
        dragged_selection.raise().attr("stroke", "black").attr("stroke-width", 1);
        const closest_hex_index = find_closest_hex_index(event.x, event.y)
        console.log({closest_hex_index})
        if(closest_hex_index !== -1) {
            // if found, remove the stroke of dragged hex
            dragged_selection.attr("stroke", "none")
            // highlight closest hex
            const closest_hex = d3.select("g.hex-group").selectAll("path.hex-bins").filter(function (d) { return d[0].i === closest_hex_index;})
            closest_hex.transition().duration(0).attr("stroke-width", 1)
            entity_hex_index_dict.value[d[0].entity] = closest_hex_index
            console.log(entity_hex_index_dict.value)
            d[0].assigned_hex_index = closest_hex_index
            // update draggable hexes
            const entity_hexes = d3.select("g.hex-group").selectAll("path.hexagon").filter((d: any) => d[0].assigned_hex_index !== -1)
            const assigned_hexes = entity_hexes.data().map((ele: any) => ele[0].assigned_hex_index)
            console.log({assigned_hexes})
            d3.selectAll("path.hex-bins").filter((d) => assigned_hexes.includes(d[0].i))
                .style("cursor", "pointer")
                .on("mouseover", function(e, hovered_d: any) {
                    console.log({highlight: props.highlight_hex_entity})
                    if(entity_hex_index_dict.value[props.highlight_hex_entity] === hovered_d[0].i) return
                    d3.select(this).transition().duration(100).attr("stroke", "black").attr("stroke-width", 8)
                    d3.select(this).raise()
                })
                .on("mouseout", function(e, hovered_d: any) {
                    if(entity_hex_index_dict.value[props.highlight_hex_entity] === hovered_d[0].i) return
                    d3.select(this).transition().duration(300).attr("stroke", "#444444").attr("stroke-width", 1)
                })
                .on("click", () => {
                    console.log("emit hex-clicked", d[0].entity)
                    emit("hex-clicked", { clickedEntity: d[0].entity })
                })
                .call(drag)
        } else {
            dragged_selection.attr("fill", "white")
                        .attr("transform", "translate(" + d.x + "," + d.y + ")")
                        .attr("stroke", "black").attr("stroke-width", 1)
            // adjust label position
            const label = d3.select("g.hex-labels").selectAll("text").filter((ele: any) => ele[0].entity === d[0].entity)
            label.attr("x", d.x)
                .attr("y", d.y)
            // adjust tspan
            const line_num = label.selectAll("tspan").nodes().length
            const lineHeight = 1.1 // ems
            const em_to_px = 16
            label.selectAll("tspan")
                .attr("x", d.x)
                .attr("y", parseFloat(d.y) - em_to_px / 2 * lineHeight * (line_num - 1) / 2) 
            }

    }

    const drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    d3.selectAll(eles).call(drag)
}


function updateHexColor(animation = true) {
    const svg = d3.select(`#${props.id}`).select("svg")
    const hex_path_group = svg.select("g.hex-group")
    let sst_bin_dict = {
        [SentimentType.neu]: [],
        [SentimentType.neg]: [],
        [SentimentType.pos]: [],
        [SentimentType.mix]: [],
    }
    const hex_bins: any = hex_path_group.selectAll("path")
        .attr("fill", function (d: any) {
            const sst = d[0].sst
            const sst_categorized = categorizeHex(sst, props.segmentation!)
            sst_bin_dict[sst_categorized].push(d)
            return SstColors.enum_color_dict[sst_categorized]
        })
}


function categorizeHex(sst: Sentiment2D | undefined, segmentation: Sentiment2D) {
    if (sst.pos === 0 && sst.neg === 0) return SentimentType.unknown
    if (sst.pos < segmentation.pos && sst.neg < segmentation.neg) return SentimentType.neu
    if (sst.pos < segmentation.pos && sst.neg > segmentation.neg) return SentimentType.neg
    if (sst.pos > segmentation.pos && sst.neg < segmentation.neg) return SentimentType.pos
    if (sst.pos > segmentation.pos && sst.neg > segmentation.neg) return SentimentType.mix
    return SentimentType.neu
}

function find_closest_hex_index(x, y) {
    let closest_index = -1
    let min_dist = 1000000
    blank_hexbins.value.forEach((bin, index) => {
        const bin_x = centers_indexed[index].x
        const bin_y = centers_indexed[index].y
        const dist = (bin_x - x)**2 + (bin_y - y)**2
        if(dist < hex_radius**2 && dist < min_dist) {
            min_dist = dist
            closest_index = index
        }
    })
    return closest_index
}

function generate_hex_list_coord(index, radius) {
    const row_capacity = 5
    const column_indices = [
        [0, 1, 2, 3, 4],
        [0, 1, 2, 3]
    ]
    const row_num = Math.floor(index / row_capacity)
    // const col_num = index % row_capacity
    const col_num = column_indices[row_num][index % row_capacity]
    const x = -4*radius + col_num * radius * 2
    const y = -10*radius + row_num * radius * 2
    return {x, y}
    
}
function index_to_sst(index) {
    const mix_index = [1, 2, 8, 9, 10]
    const neg_index = [3, 4, 12 ,13, 14]
    const pos_index = [0, 5, 6, 16, 17]
    if(mix_index.includes(index)) return SentimentType.mix
    if(neg_index.includes(index)) return SentimentType.neg
    if(pos_index.includes(index)) return SentimentType.pos
}

function distance_to_edge({ alpha, radius }) {
    const t = alpha % (Math.PI / 3)
    return Math.sqrt(3) * radius / (Math.sqrt(3) * Math.cos(t) + Math.sin(t))
}
function generate_hex_coord(index, radius) {
    return polar_to_cartesian(generate_polar(index, radius))
}
function generate_sst_hex_coord(sst, index, radius) {
    return polar_to_cartesian(generate_sst_polar(sst, index, radius))
}
function polar_to_cartesian({ alpha, r }) {
    return { x: r * Math.cos(alpha), y: r * Math.sin(alpha) }
}
function cartesian_to_polar({ x, y }) {
    return { alpha: Math.atan2(y, x), radius: Math.sqrt(x*x + y*y)}
}

function generate_sst_polar(sst, index, radius) {
    const mix_index = [1, 2, 8, 9, 10]
    const neg_index = [3, 4, 12 ,13, 14]
    const pos_index = [0, 5, 6, 16, 17]
    const neu_index = [15, 30, 31, 32, 33]
    const unknown_index = [62, 36, 88, 122]
    // const unknown_index = [62, 37, 36, 59, 88, 87]
    let hex_index = -1
    if(sst === "mixed") hex_index = mix_index[index]
    if(sst === "negative") hex_index = neg_index[index]
    if(sst === "positive") hex_index = pos_index[index]
    if(sst === "neutral") hex_index = neu_index[index]
    if(sst === "unknown") hex_index = unknown_index[index]
    const { level, M_l } = find_level(hex_index)
    const d_alpha = 2 * Math.PI / (6 * (level + 1))
    const d_index = hex_index - M_l
    const alpha = d_alpha * d_index
    const r = (level + 1) * 2 * (distance_to_edge({ alpha, radius }))
    return { alpha, r }
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
    updateHexColor,
    updateHighlightHex
})



/* 
            <!-- <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
                <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
            </pattern> -->

*/

</script>


<style scoped>
.hex-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}

.hex-container {
    width: 100%;
    height: 100%;
}


</style>
