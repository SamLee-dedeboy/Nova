<template>
<div class="tCoord-container">
    <svg class="t-coord" ></svg>
</div>
    
</template>
<script setup lang="ts">
import * as d3 from "d3"
import * as vue from "vue"
import * as preprocess from "../components/preprocessUtils"
import * as SstColors from "./ColorUtils"
import { Path, Article } from "../types"
import { start } from "repl"
const props = defineProps({
    min_timestamp: String,
    max_timestamp: String, 
    pos_threshold: Number,
    neg_threshold: Number,
    article_bin_dict: Object as () => {[id: string]: {[id: string]:Article[]}},
    highlight_object: String, 
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
// const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan"]

const start_date = vue.computed(() => new Date(props.min_timestamp!))
const end_date = vue.computed(() => new Date(props.max_timestamp!))
const start_month = vue.computed(() => start_date.value.getMonth() + 2)
const end_month = vue.computed(() => end_date.value.getMonth() + 2)
console.log(start_date.value.toISOString(), start_date.value.getMonth())
console.log(end_date.value.toISOString(), end_date.value.getMonth())
const month_range = vue.computed(() => end_date.value.getMonth() - start_date.value.getMonth()).value
const month_abbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const x = vue.computed(
    () => d3.scaleLinear()
        .domain([start_month.value-1, end_month.value-2])
        .range([ 0, viewBox_width ])
    ).value
const x_coord = vue.computed(
    () => d3.scaleLinear()
        .domain([0, month_range-1])
        .range([ 0, viewBox_width ])
    ).value
const y_pos = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ viewBox_height/2, 0]);
const y_neg = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ viewBox_height, viewBox_height/2 + margin.middle]);
vue.watch(() => props.highlight_object, (new_value, old_value) => {
    updateCoordinates()
})
const test_entity_path_dict = vue.computed(() => {
    const entity_path_dict: { [id: string]: {pos_path: Path[], neg_path: Path[]} } = {}
    Object.keys(test_entity_bin_dict).forEach(entity => {
        const pos_bins = test_entity_bin_dict[entity].pos_bins
        const neg_bins = test_entity_bin_dict[entity].neg_bins
        const pos_path = constructPath(pos_bins, entity)
        const neg_path = constructPath(neg_bins, entity)
        entity_path_dict[entity] = {pos_path, neg_path}
    });
    return entity_path_dict;
})
const object_path_dict = vue.computed(() => {
    const object_path_dict: { [id: string]: {pos_path: Path[], neg_path: Path[]} } = {}
    const article_bin_dict = props.article_bin_dict!
    Object.keys(article_bin_dict).forEach(title => {
        const article_bins = article_bin_dict[title]
        const pos_bins :Number[] = []
        const neg_bins :Number[] = []
        console.log(start_month.value, end_month.value) 
        for(let month = start_month.value; month < end_month.value; month++) {
            const articles = article_bins[month]
            const bins = preprocess.construct_node(articles, `${title}-${month}`) 
            pos_bins.push(bins.pos_sst)
            neg_bins.push(bins.neg_sst)
        }
        // console.log({title, pos_bins, neg_bins})
        const pos_path = constructPath(pos_bins, title)
        const neg_path = constructPath(neg_bins, title)
        object_path_dict[title] = {pos_path, neg_path}
    });
    return object_path_dict;
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
        .call(d3.axisBottom(x).ticks(month_range).tickSize(5).tickFormat(x => month_abbrs[x]))

    const rangeData = [...Array(month_range).keys()] 
    const pos_coord = axis_group.append("g").attr("class", "pos_coord")
    const path_pos_group  = pos_coord.append("g").attr("class", "path_pos_group")
    const axis_pos_group = pos_coord.append("g").attr("class", "axis_pos_group")
    axis_pos_group.selectAll("g.axis_pos")
    .data(rangeData)
    .enter()
    .append("g")
        .attr("class", "axis_pos")
        .attr("transform", (d) => `translate(${d*viewBox_width/(month_range-1)},0)`)
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
        .attr("transform", (d) => `translate(${d*viewBox_width/(month_range-1)},0)`)
        .each(function(d) {
            if(d == 0) d3.select(this).call(d3.axisLeft(y_neg).ticks(2).tickSize(2))
            else d3.select(this).call(d3.axisLeft(y_neg).ticks(2).tickSize(0).tickFormat(""))
        })
        .raise()
    updateCoordinates()
})

function updateCoordinates() {
    console.log("🚀 ~ file: TemporalCoordinates.vue ~ line 147 ~ updateCoordinates ~ object_path_dict", Object.keys(object_path_dict.value))
    console.log(props.highlight_object)
    const svg = d3.select("div.tCoord-container").select("svg")

    // pos
    const path_pos_group = svg.select("g.pos_coord").select("g.path_pos_group")
    const pos_line_group = path_pos_group.selectAll("g.line_group")
        .data(Object.keys(object_path_dict.value))
    pos_line_group.enter()
        .append("g").attr("class", "line_group").attr("id", d => d)
    
    const pos_paths = path_pos_group.selectAll("g.line_group").selectAll("line.pos_path")
        .data((d) => object_path_dict.value[d].pos_path)
    pos_paths.enter()
            .append("line").attr("class", "pos_path")
            .merge(pos_paths)
            .attr("x1", (d,i) => (x_coord(i)))
            .attr("y1", (d) => (y_pos(d.start)))
            .attr("x2", (d,i) => (x_coord(i+1)))
            .attr("y2", (d) => (y_pos(d.end)))
            .attr("stroke", (d) => SstColors.outlet_color_dict[d.title])
            .attr("stroke-width", (d) => (d.title === props.highlight_object)?5:1)

    // neg
    const path_neg_group = svg.select("g.neg_coord").select("g.path_neg_group")
    const neg_line_group = path_neg_group.selectAll("g.line_group")
        .data(Object.keys(object_path_dict.value))
    neg_line_group.enter()
        .append("g").attr("class", "line_group").attr("id", d => d)
    
    const neg_paths = path_neg_group.selectAll("g.line_group").selectAll("line.neg_path")
        .data((d) => object_path_dict.value[d].neg_path)
    neg_paths.enter()
            .append("line").attr("class", "neg_path")
            .merge(neg_paths)
            .attr("x1", (d,i) => (x_coord(i)))
            .attr("y1", (d) => (y_neg(d.start)))
            .attr("x2", (d,i) => (x_coord(i+1)))
            .attr("y2", (d) => (y_neg(d.end)))
            .attr("stroke", (d) => SstColors.outlet_color_dict[d.title])
            .attr("stroke-width", (d) => (d.title === props.highlight_object)?5:1)
}

function constructPath(bins, title) {
    let path_list: Path[] = []
    for(let i = 0; i < (bins?.length || 1) - 1; ++i) {
        path_list.push({title: title, start:bins![i], end: bins![i+1]})
    }
    return path_list
}
</script>
<style scoped lang="scss">
.t-coord {
    width: inherit;
    height: inherit;
    overflow: visible;
}
</style>