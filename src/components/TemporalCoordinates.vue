<template>
<div class="tCoord-container">
    <svg class="t-coord"></svg>
</div>
    
</template>
<script setup lang="ts">
import * as d3 from "d3"
import * as vue from "vue"
import { Path } from "../types"
const props = defineProps({
    entity_bin_dict: Object as () => {[id: string]: {pos_bins: Number[], neg_bins: Number[]}},
})

const test_pos_bins_1 = [1, 0.5, 0.3, 0.2, 0.7, 0, 0.5, 0.3, 0.3, 0.5, 0.6, 0.8]
const test_pos_bins_2 = [0, 0.2, 0.5, 0.6, 0.8, 0.1, 0.2, 0.5, 0.2, 0.9, 0.3, 0.5]
const test_neg_bins_1 = [1, 0.5, 0.3, 0.2, 0.7, 0, 0.5, 0.3, 0.3, 0.5, 0.6, 0.8]
const test_neg_bins_2 = [0, 0.2, 0.5, 0.6, 0.8, 0.1, 0.2, 0.5, 0.2, 0.9, 0.3, 0.5]
const test_entity_bin_dict = {"CNN": {pos_bins: test_pos_bins_1, neg_bins: test_neg_bins_1}, "ABC":{pos_bins:test_pos_bins_2, neg_bins: test_neg_bins_2}}

const viewBox = [500, 300]
const margin = {top: 30, bottom: 30, right:10, left: 30, middle: 20} 
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom - margin.middle
const x = d3.scaleTime()
    .domain([new Date("2020-01-01"), new Date("2020-12-02")])
    .range([ 0, viewBox_width ]);
const x_coord = d3.scaleLinear()
    .domain([0, 11])
    .range([ 0, viewBox_width ]);
const range = 12
const y_pos = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ viewBox_height/2, 0]);
const y_neg = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ viewBox_height, viewBox_height/2 + margin.middle]);
// const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan"]

const entity_path_dict = vue.computed(() => {
    const entity_path_dict: { [id: string]: {pos_path: Path[], neg_path: Path[]} } = {}
    Object.keys(test_entity_bin_dict).forEach(entity => {
        const pos_bins = test_entity_bin_dict[entity].pos_bins
        const neg_bins = test_entity_bin_dict[entity].neg_bins
        const pos_path = constructPath(pos_bins)
        const neg_path = constructPath(neg_bins)
        entity_path_dict[entity] = {pos_path, neg_path}
    });
    return entity_path_dict;
})
vue.onMounted(() => {
    const svg = d3.select("svg.t-coord")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    const axis_group = svg.append("g").attr("class", "axis-group")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
    
    axis_group.append("g")
        .attr("class", "axis_time_pos")
        .attr("transform", `translate(0, ${viewBox_height/2})`)
        .call(d3.axisBottom(x).tickSize(0).tickFormat(""))
    axis_group.append("g")
        .attr("class", "axis_time_neg")
        .attr("transform", `translate(0, ${viewBox_height})`)
        .call(d3.axisBottom(x).tickSize(0).tickFormat(d3.timeFormat("%b")))

    const rangeData = [...Array(range).keys()] 
    const pos_coord = axis_group.append("g").attr("class", "pos_coord")
    const path_pos_group  = pos_coord.append("g").attr("class", "path_pos_group")
    const axis_pos_group = pos_coord.append("g").attr("class", "axis_pos_group")
    axis_pos_group.selectAll("g.axis_pos")
    .data(rangeData)
    .enter()
    .append("g")
        .attr("class", "axis_pos")
        .attr("transform", (d) => `translate(${d*viewBox_width/(range-1)},0)`)
        .each(function(d) {
            if(d == 0) d3.select(this).call(d3.axisLeft(y_pos).ticks(2).tickSize(2))
            else d3.select(this).call(d3.axisLeft(y_pos).ticks(2).tickSize(0).tickFormat(""))
        })
        .raise()

    const neg_coord = axis_group.append("g").attr("class", "neg_coord")
    const path_neg_group  = neg_coord.append("g").attr("class", "path_neg_group")
    const axis_neg_group = neg_coord.append("g").attr("class", "axis_neg_group")
    axis_neg_group.selectAll("g.axis_neg")
    .data(rangeData)
    .enter()
    .append("g")
        .attr("class", "axis_neg")
        .attr("transform", (d) => `translate(${d*viewBox_width/(range-1)},0)`)
        .each(function(d) {
            if(d == 0) d3.select(this).call(d3.axisLeft(y_neg).ticks(2).tickSize(2))
            else d3.select(this).call(d3.axisLeft(y_neg).ticks(2).tickSize(0).tickFormat(""))
        })
        .raise()
    updateCoordinates()
})

function updateCoordinates() {
    const svg = d3.select("div.tCoord-container").select("svg")

    // pos
    const path_pos_group = svg.select("g.pos_coord").select("g.path_pos_group")
    const pos_line_group = path_pos_group.selectAll("g.line_group")
        .data(Object.keys(entity_path_dict.value))
    pos_line_group.enter()
        .append("g").attr("class", "line_group").attr("id", d => d)
    
    const pos_paths = path_pos_group.selectAll("g.line_group").selectAll("line.pos_path")
        .data((d) => entity_path_dict.value[d].pos_path)
    pos_paths.enter()
            .append("line").attr("class", "pos_path")
            .merge(pos_paths)
            .attr("x1", (d,i) => (x_coord(i)))
            .attr("y1", (d) => (y_pos(d.start)))
            .attr("x2", (d,i) => (x_coord(i+1)))
            .attr("y2", (d) => (y_pos(d.end)))
            .attr("stroke", "black")

    // neg
    const path_neg_group = svg.select("g.neg_coord").select("g.path_neg_group")
    const neg_line_group = path_neg_group.selectAll("g.line_group")
        .data(Object.keys(entity_path_dict.value))
    neg_line_group.enter()
        .append("g").attr("class", "line_group").attr("id", d => d)
    
    const neg_paths = path_neg_group.selectAll("g.line_group").selectAll("line.neg_path")
        .data((d) => entity_path_dict.value[d].neg_path)
    neg_paths.enter()
            .append("line").attr("class", "neg_path")
            .merge(neg_paths)
            .attr("x1", (d,i) => (x_coord(i)))
            .attr("y1", (d) => (y_neg(d.start)))
            .attr("x2", (d,i) => (x_coord(i+1)))
            .attr("y2", (d) => (y_neg(d.end)))
            .attr("stroke", "black")
}

function constructPath(bins) {
    let path_list: Path[] = []
    for(let i = 0; i < (bins?.length || 1) - 1; ++i) {
        path_list.push({start:bins![i], end: bins![i+1]})
    }
    return path_list
}
</script>
<style scoped lang="scss">
.t-coord {
    width: inherit;
    height: inherit;
}
</style>