<script setup lang="ts">
import * as d3 from "d3"
import { OutletNode } from '../types'
import { defineComponent, computed, watch, onMounted, PropType} from 'vue'
import * as SstColors from './ColorUtils'
import { enableTracking } from "@vue/reactivity";

interface OutletNodeInfo {
    text: string,
    pos_articles: number,
    neg_articles: number,
    neu_articles: number,
    pos_score: number,
    neg_score: number,
    neu_score: number,
}
const props = defineProps({
    node: Object as () => OutletNodeInfo,
    total_articles: Number,
})
// define constants
const bar_width = 10;    
const svgViewBox = [100, 10]
const svgBox = [100, 10]
// watch node
watch(() => props.node, (node, prev_node) => {
    updateBars(node, prev_node)
})

// onMounted(() => {
//     if(props.node === undefined) return
//     updateBars(props.node, undefined)
// }) 
function updateBars(node, prev_node) {
    const node_articles = (node.pos_articles || 0) + (node.neg_articles || 0) + (node.neu_articles || 0)
    // articles
    updateArticle({text: node.text, articles: node.pos_articles}, "pos", node_articles) 
    updateArticle({text: node.text, articles: node.neg_articles}, "neg", node_articles) 
    updateArticle({text: node.text, articles: node.neu_articles}, "neu", node_articles) 
    const max_score = 1+Math.max(node.pos_score, Math.abs(node.neg_score), Math.abs(node.neu_score))
    updateScore(node.pos_score, "pos", max_score)
    updateScore(node.neg_score, "neg", max_score)
    updateScore(node.neu_score, "neu", max_score)

    updateAvgScore({score: node.pos_score, articles: node.pos_articles}, "pos")
    updateAvgScore({score: node.neg_score, articles: node.neg_articles}, "neg")
    updateAvgScore({score: node.neu_score, articles: node.neu_articles}, "neu")

    updateTotalArticles(node.pos_articles, node.neg_articles, node.neu_articles, props.total_articles)
}

function updateArticle({text, articles}, sst_class, node_articles) {
    const svg = d3.selectAll(`td.${sst_class}_articles`).selectAll("svg")
        .attr("viewBox", `0 0 ${svgViewBox[0]} ${svgViewBox[1]}`)
        .attr("width", `${svgBox[0]}px`)
        .attr("height", `${svgBox[1]}px`)
    svg.selectAll("rect")
    .data([articles]) 
    .join(
        enter => {
            enter.append("rect")
            .attr("height", svgViewBox[1])
            .attr("filter", `brightness(${SstColors.brightness}%)`)
            .attr("width", (d) => (d/node_articles)*svgViewBox[0])
            .attr("fill", () => SstColors.color_dict[sst_class])
        },
        update => {
            update.attr("width", (d) => (d/node_articles)*svgViewBox[0])
        }
    )
    const node_text = svg.selectAll("text")
    .data([`${parseInt(articles)}(${Math.round((articles/node_articles)*100)}%)`])

    node_text.enter()
    .append("text")
    .merge(node_text)
    .text(d => d)
    .attr("x", svgViewBox[0]/2)
    .attr("y", svgViewBox[1]/2-1)
    .attr("font-size", "0.7em")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
}

function updateScore(score,  sst_class, max_score) {
    const svg = d3.selectAll(`td.${sst_class}_score`).selectAll("svg")
        .attr("viewBox", `0 0 ${svgViewBox[0]} ${svgViewBox[1]}`)
        .attr("width", `${svgBox[0]}px`)
        .attr("height", `${svgBox[1]}px`)
    svg.selectAll("rect")
    .data([score]) 
    .join(
        enter => {
            enter.append("rect")
            .attr("height", svgViewBox[1])
            .attr("filter", `brightness(${SstColors.brightness}%)`)
            .attr("width", (d) => (Math.abs(d)/max_score)*svgViewBox[0])
            .attr("fill", () => SstColors.color_dict[sst_class])
        },
        update => {
            update.attr("width", (d) => (Math.abs(d)/max_score)*svgViewBox[0])
        }
    )
    const node_text = svg.selectAll("text")
    .data([`${score.toFixed(2)}`])

    node_text.enter()
    .append("text")
    .merge(node_text)
    .text(d => d)
    .attr("x", svgViewBox[0]/2)
    .attr("y", svgViewBox[1]/2-1)
    .attr("font-size", "0.7em")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
}

function updateAvgScore({score, articles},  sst_class) {
    const avg_score = (score/articles).toFixed(2)
    const svg = d3.selectAll(`td.${sst_class}_avg_score`).selectAll("svg")
        .attr("viewBox", `0 0 ${svgViewBox[0]} ${svgViewBox[1]}`)
        .attr("width", `${svgBox[0]}px`)
        .attr("height", `${svgBox[1]}px`)
    svg.selectAll("rect")
    .data([avg_score]) 
    .join(
        enter => {
            enter.append("rect")
            .attr("height", svgViewBox[1])
            .attr("filter", `brightness(${SstColors.brightness}%)`)
            .attr("width", (d) => (Math.abs(d))*svgViewBox[0])
            .attr("fill", () => SstColors.color_dict[sst_class])
        },
        update => {
            update.attr("width", (d) => (Math.abs(d))*svgViewBox[0])
        }
    )
    const node_text = svg.selectAll("text")
    .data([`${avg_score}`])

    node_text.enter()
    .append("text")
    .merge(node_text)
    .text(d => d)
    .attr("x", svgViewBox[0]/2)
    .attr("y", svgViewBox[1]/2-1)
    .attr("font-size", "0.7em")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
}

function updateTotalArticles(pos_articles, neg_articles, neu_articles, total_articles) {
    const node_total_articles =  pos_articles + neg_articles + neu_articles 
    const svg = d3.selectAll(`td.total_articles`).selectAll("svg")
        .attr("viewBox", `0 0 ${2*svgViewBox[0]} ${svgViewBox[1]}`)
        .attr("width", `${2*svgBox[0]}px`)
        .attr("height", `${svgBox[1]}px`)
    svg.selectAll("rect.frame")
    .data([0])
    .enter()
    .append("rect")
        .attr("class", "frame")
        .attr("height", svgViewBox[1])
        .attr("width", 2*svgViewBox[0])
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1)

    svg.selectAll("rect.bar")
    .data([node_total_articles])
    .join(
        enter => {
            enter.append("rect")
            .attr("class", "bar")
            .attr("height", svgViewBox[1])
            .attr("filter", `brightness(${SstColors.brightness}%)`)
            .attr("width", (d) => (d/total_articles)*2*svgViewBox[0])
            .attr("fill", "#0d6efd") 
        },
        update => {
            update.attr("width", (d) => (d/total_articles)*2*svgViewBox[0])
        }
    )
    const percentage = parseFloat((node_total_articles/total_articles).toFixed(2))*100
    const node_text = svg.selectAll("text")
    .data([`${node_total_articles}/${total_articles}(${percentage}%)`])

    node_text.enter()
    .append("text")
    .merge(node_text)
    .text(d => d)
    .attr("x", 2*svgViewBox[0]/2)
    .attr("y", svgViewBox[1]/2-1)
    .attr("font-size", "0.7em")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
}

</script>
<template>
    <table class="node-info-table">
  <tr class="header">
    <th class="articles">#articles</th>
    <th class="score">score</th>
    <th class="avg score">score(average)</th>

  </tr>
  <tr class="pos">
    <td class="pos_articles"><svg></svg></td>
    <td class="pos_score"> <svg></svg></td>
    <td class="pos_avg_score"> <svg></svg></td>
  </tr>
  <tr class="neg">
    <td class="neg_articles"><svg></svg> </td>
    <td class="neg_score"> <svg></svg></td>
    <td class="neg_avg_score"> <svg></svg></td>
  </tr>
  <tr class="neu">
    <td class="neu_articles"><svg></svg> </td>
    <td class="neu_score"> <svg></svg></td>
    <td class="neu_avg_score"> <svg></svg></td>
  </tr>
  <tr class="total">
    <td class="total_articles_header" colspan="1"> total articles:  </td>
    <td class="total_articles" colspan="2"> <svg></svg> </td>
  </tr>
</table>
    
</template>

<style scoped lang="scss">
th, tr, td {
    border: 1px solid black;
    text-align: center;
}
.node-info-table {
    border-collapse: collapse;
    background-color: white;
    border: solid;
    border-width: 2px;
    border-radius: 5px;
    padding: 5px;
}
svg {
    left: 1px;
}

</style>