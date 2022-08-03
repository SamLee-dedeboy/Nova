<template>
<div class="tCoord-container" :id="id">
    <svg class="t-coord" ></svg>
</div>
    
</template>
<script setup lang="ts">
import * as d3 from "d3"
import * as vue from "vue"
import * as preprocess from "../components/preprocessUtils"
import * as SstColors from "./ColorUtils"
import { Path, Article, Sentiment2D } from "../types"
import { start } from "repl"
import {Ref, ref} from 'vue'
const props = defineProps({
    id: String,
    article_bin_dict: Object as () => {[id: string]: {[id: string]:Article[]}},
    path_keys: Object as () => string[],
    color_dict: Object as () => {[id: string]: string},
    highlight_object: Object as () => String[], 
    sst_threshold: Object as () => Sentiment2D, 
})

const viewBox = [500, 300]
const margin = {top: 30, bottom: 30, right:10, left: 30, middle: 10} 
const viewBox_width = viewBox[0] - margin.left - margin.right
const viewBox_height = viewBox[1] - margin.top - margin.bottom - margin.middle
const highlight_stroke_width = 5
// const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan"]

const min_timestamp: Ref<string> = vue.inject('min_timestamp') || ref("")
const max_timestamp: Ref<string> = vue.inject('max_timestamp') || ref("")
const sst_threshold: Ref<Sentiment2D> = vue.inject('segment_sst') || ref({pos: 0.5, neg: 0.5})

const start_date = vue.computed(() => new Date(min_timestamp.value))
const end_date = vue.computed(() => new Date(max_timestamp.value))
const start_month = vue.computed(() => start_date.value.getMonth() + 2)
const end_month = vue.computed(() => end_date.value.getMonth() + 2)
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
    .range([ viewBox_height/2 - margin.middle, 0])
    .clamp(true)
const y_neg = d3.scalePow()
    .exponent(1)
    .domain([0, 1])
    .range([ viewBox_height, viewBox_height/2 + margin.middle])
    .clamp(true)

vue.watch(() => props.highlight_object, (new_value, old_value) => {
    updateCoordinates()
})
vue.watch(() => props.article_bin_dict, (new_value, old_value) => {
    updateCoordinates()
})
vue.watch(() => props.path_keys, (new_value, old_value) => {
    updateCoordinates()
})

vue.watch(() => props.sst_threshold, (new_value, old_value) => {
    updateSegmentation()
})

const object_bins_dict = vue.computed(() => {
    const object_bins_dict: { [id: string]: {title: string, pos_bins: Number[], neg_bins: Number[]} } = {}
    Object.keys(props.article_bin_dict!).forEach(title => {
        const article_bins = props.article_bin_dict![title]
        const pos_bins :Number[] = []
        const neg_bins :Number[] = []
        for(let month = start_month.value; month < end_month.value; month++) {
            const articles = article_bins[month]
            console.log("🚀 ~ file: TemporalCoordinates.vue ~ line 84 ~ Object.keys ~ articles", title, month, articles)
            if(articles === undefined || articles.length === 0) {
                pos_bins.push(-1)
                neg_bins.push(-1)
            } else { 
                const bins = preprocess.construct_node(articles, `${title}-${month}`) 
                pos_bins.push(bins.pos_sst)
                neg_bins.push(bins.neg_sst)
            }
        }
        console.log("🚀 ~ file: TemporalCoordinates.vue ~ line 95 ~ Object.keys ~ object_bins_dict", object_bins_dict)
        object_bins_dict[title] = {title, pos_bins, neg_bins}
    })
    return object_bins_dict
})
const object_path_dict = vue.computed(() => {
    const object_path_dict: { [id: string]: {pos_path: Path[], neg_path: Path[]} } = {}
    Object.keys(object_bins_dict.value).forEach(title => {
        const {pos_bins, neg_bins} = object_bins_dict.value[title]
        const pos_path = constructPath(pos_bins, title)
        const neg_path = constructPath(neg_bins, title)
        object_path_dict[title] = {pos_path, neg_path}
    });
    return object_path_dict;
})
vue.onMounted(() => {
    const svg = d3.select(`#${props.id}`).select("svg")
        .attr("viewBox", `0 0 ${viewBox[0]} ${viewBox[1]}`)
    const coord_group = svg.append("g").attr("class", "temporal_view_group")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
    const axis_group = coord_group.append("g").attr("class", "time-axis-group").lower()

    
    axis_group.append("g")
        .attr("class", "axis_time_pos")
        .attr("transform", `translate(0, ${viewBox_height/2 - margin.middle})`)
        .call(d3.axisBottom(x).tickSize(0).tickFormat(""))
    axis_group.append("g")
        .attr("class", "axis_time_neg")
        .attr("transform", `translate(0, ${viewBox_height})`)
        .call(d3.axisBottom(x).ticks(month_range).tickSize(5).tickFormat(x => month_abbrs[x]))

    const rangeData = [...Array(month_range).keys()] 
    const pos_coord = coord_group.append("g").attr("class", "pos_coord")
    const pos_segment_group = coord_group.append("g").attr("class", "pos_segment_group").lower()
    const path_pos_group  = pos_coord.append("g").attr("class", "path_pos_group")
    const axis_pos_group = pos_coord.append("g").attr("class", "axis_pos_group").lower()
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

    const neg_coord = coord_group.append("g").attr("class", "neg_coord")
    const neg_segment_group = coord_group.append("g").attr("class", "neg_segment_group").lower()
    const path_neg_group  = neg_coord.append("g").attr("class", "path_neg_group")
    const axis_neg_group = neg_coord.append("g").attr("class", "axis_neg_group").lower()
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
    updateSegmentation()
    updateCoordinates()
})

function updateCoordinates() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const temporal_type = props.id!.split("_")[0]
    // pos
    const path_pos_group = svg.select("g.pos_coord").select("g.path_pos_group")
    const pos_line_group = path_pos_group.selectAll("g.line_group")
        .data(Object.keys(object_path_dict.value))
        .join(
            enter => enter.append("g").attr("class", "line_group").attr("id", d => d)
        )
    
    const pos_paths = path_pos_group.selectAll("g.line_group").selectAll("line.pos_path")
        .data((d) => {
            return object_path_dict.value[d].pos_path
        })
    pos_paths.enter()
        .append("line").attr("class", "pos_path")
        .merge(pos_paths)
        .attr("x1", (d,i) => (x_coord(i)))
        .attr("y1", (d) => (y_pos(d.start)))
        .attr("x2", (d,i) => (x_coord(i+1)))
        .attr("y2", (d) => (y_pos(d.end)))
        .attr("stroke", (d, i) => (props.color_dict?.[d.title] || "black"))



    if(temporal_type == "overview") {
        path_pos_group.selectAll("g.line_group").selectAll("line.pos_path")
            .attr("stroke-width", (d) => (props.highlight_object?.includes(d.title))?highlight_stroke_width:1)
    } else if(temporal_type == "compare") {
        path_pos_group.selectAll("g.line_group").selectAll("line.pos_path")
            .attr("stroke-width", (d) => (props.highlight_object?.includes(d.title))?highlight_stroke_width:2)
    }
    path_pos_group.selectAll("g.line_group").filter((d) => props.highlight_object?.includes(d))
        .raise()

    const pos_highlight_circles = path_pos_group.selectAll("g.line_group").selectAll("circle.pos_path_circles")
        .data((d) => object_bins_dict.value[d].pos_bins)
    pos_highlight_circles.enter()
        .append("circle").attr("class", "pos_path_circles")
        .merge(pos_highlight_circles)
        .attr("cx", (d, i) => (x_coord(i)))
        .attr("cy", (d) => (y_pos(d)))
        .attr("r", highlight_stroke_width)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-dasharray", (d) => (d === -1? 1:0))
        .attr("opacity", function() {
            const title = d3.select(this.parentNode).data()[0]
            return (props.highlight_object?.includes(title))?1:0
        })

    // neg
    const path_neg_group = svg.select("g.neg_coord").select("g.path_neg_group")
    const neg_line_group = path_neg_group.selectAll("g.line_group")
        .data(Object.keys(object_path_dict.value))
        .join(
            enter => enter.append("g").attr("class", "line_group").attr("id", d => d)
        )
    
    const neg_paths = path_neg_group.selectAll("g.line_group").selectAll("line.neg_path")
        .data((d) => object_path_dict.value[d].neg_path)
    neg_paths.enter()
            .append("line").attr("class", "neg_path")
            .merge(neg_paths)
            .attr("x1", (d,i) => (x_coord(i)))
            .attr("y1", (d) => (y_neg(d.start)))
            .attr("x2", (d,i) => (x_coord(i+1)))
            .attr("y2", (d) => (y_neg(d.end)))
            .attr("stroke", (d, i) => (props.color_dict?.[d.title] || "black"))

    if(temporal_type == "overview") {
        path_neg_group.selectAll("g.line_group").selectAll("line.neg_path")
            .attr("stroke-width", (d) => (props.highlight_object?.includes(d.title))?5:1)
    } else if(temporal_type == "compare") {
        path_neg_group.selectAll("g.line_group").selectAll("line.neg_path")
            .attr("stroke-width", (d) => (props.highlight_object?.includes(d.title))?5:2)
    } 
    path_neg_group.selectAll("g.line_group").filter((d) => props.highlight_object?.includes(d))
        .raise()

    const neg_highlight_circles = path_neg_group.selectAll("g.line_group").selectAll("circle.neg_path_circles")
        .data((d) => object_bins_dict.value[d].neg_bins)
    neg_highlight_circles.enter()
        .append("circle").attr("class", "neg_path_circles")
        .merge(neg_highlight_circles)
        .attr("cx", (d, i) => (x_coord(i)))
        .attr("cy", (d) => (y_neg(d)))
        .attr("r", highlight_stroke_width)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-dasharray", (d) => (d === -1? 1:0))
        .attr("opacity", function() {
            const title = d3.select(this.parentNode).data()[0]
            return (props.highlight_object?.includes(title))?1:0
        })
}

function updateSegmentation() {
    const svg = d3.select(`#${props.id}`).select("svg")
    const pos_segment_group = svg.select("g.pos_segment_group")
    const pos_pos_segment = pos_segment_group.selectAll("rect.pos_pos_segment")
        .data([props.sst_threshold?.pos || 0.5])
    pos_pos_segment.enter().append("rect").attr("class", "pos_pos_segment")
        .attr("x", -margin.left/2)
        .attr("y", 0)
        .attr("width", margin.left/2)
        .attr("fill", SstColors.pos_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)
        .merge(pos_pos_segment)
        .attr("height", (d) => y_pos(d))
    const pos_neu_segment = pos_segment_group.selectAll("rect.pos_neu_segment")
        .data([props.sst_threshold?.pos || 0.5])
    pos_neu_segment.enter().append("rect").attr("class", "pos_neu_segment")
        .attr("x", -margin.left/2)
        .attr("width", margin.left/2)
        .merge(pos_neu_segment)
        .attr("y", (d) => y_pos(d))
        .attr("height", (d) => y_pos(1-d))
        .attr("fill", SstColors.neu_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)
    const pos_divider = pos_segment_group.selectAll("line.pos_divider")
        .data([props.sst_threshold?.pos || 0.5])
    pos_divider.enter().append("line").attr("class", "pos_divider")
        .attr("x1", 0)
        .attr("x2", viewBox_width)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", 2.5)
        .merge(pos_divider)
        .attr("y1", (d) => y_pos(d))
        .attr("y2", (d) => y_pos(d))

    const neg_segment_group = svg.select("g.neg_segment_group")
    const neg_neg_segment = neg_segment_group.selectAll("rect.neg_neg_segment")
        .data([props.sst_threshold?.neg || 0.5])
    neg_neg_segment.enter().append("rect").attr("class", "neg_neg_segment")
        .attr("x", -margin.left/2)
        .attr("width", margin.left/2)
        .attr("fill", SstColors.neg_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)
        .merge(neg_neg_segment)
        .attr("y", y_neg(1))
        .attr("height", (d) => y_neg(d)-y_neg(1))
    const neg_neu_segment = neg_segment_group.selectAll("rect.neg_neu_segment")
        .data([props.sst_threshold?.neg || 0.5])
    neg_neu_segment.enter().append("rect").attr("class", "neg_neu_segment")
        .attr("x", -margin.left/2)
        .attr("width", margin.left/2)
        .attr("fill", SstColors.neu_color)
        .style("filter", `brightness(${SstColors.brightness}%)`)
        .merge(neg_neu_segment)
        .attr("y", (d) => y_neg(d))
        .attr("height", (d) => y_neg(1-d)-y_neg(1))
    const neg_divider = neg_segment_group.selectAll("line.neg_divider")
        .data([props.sst_threshold?.neg || 0.5])
    neg_divider.enter().append("line").attr("class", "neg_divider")
        .attr("x1", 0)
        .attr("x2", viewBox_width)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", 2.5)
        .merge(neg_divider)
        .attr("y1", (d) => y_neg(d))
        .attr("y2", (d) => y_neg(d))


}

function constructPath(bins, title) {
    let path_list: Path[] = []
    for(let i = 0; i < (bins?.length || 1) - 1; ++i) {
        path_list.push({title: title, start: bins![i], end: bins![i+1]})
    }
    return path_list
}
</script>
<style scoped lang="scss">
.t-coord {
    width: inherit;
    height: 100%;
    overflow: visible;
}
</style>