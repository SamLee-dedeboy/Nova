<script setup lang="ts">
import * as d3 from "d3"
import { OutletNode } from '../types'
import { defineComponent, computed, watch, onMounted, PropType} from 'vue'
import * as SstColors from './ColorUtils'

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
            .attr("height", svgBox[1])
            .attr("filter", `brightness(${SstColors.brightness}%)`)
            .attr("width", (d) => (d/node_articles)*svgBox[0])
            .attr("fill", () => SstColors.color_dict[sst_class])
        },
        update => {
            update.attr("width", (d) => (d/node_articles)*svgBox[0])
        }
    )
    const node_text = svg.selectAll("text")
    .data([`${parseInt(articles)}(${Math.round((articles/node_articles)*100)}%)`])

    node_text.enter()
    .append("text")
    .merge(node_text)
    .text(d => d)
    .attr("x", svgBox[0]/2)
    .attr("y", svgBox[1]/2-1)
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
    <th class="avg_score">avg_score</th>
  </tr>
  <tr class="pos">
    <td class="pos_articles"><svg></svg></td>
    <td class="score"> {{node?.pos_score.toFixed(2)}}</td>
    <td class="avg_score"> {{((node?.pos_score || 0)/(node?.pos_articles || 1)).toFixed(2)}}</td>
  </tr>
  <tr class="neg">
    <td class="neg_articles"><svg></svg> </td>
    <td class="score"> {{node?.neg_score.toFixed(2)}}</td>
    <td class="avg_score"> {{((node?.neg_score || 0)/(node?.neg_articles || 1)).toFixed(2)}}</td>
  </tr>
  <tr class="neu">
    <td class="neu_articles"><svg></svg> </td>
    <td class="score"> {{node?.neu_score.toFixed(2)}}</td>
    <td class="avg_score"> {{((node?.neu_score || 0)/(node?.neu_articles || 1)).toFixed(2)}}</td>
  </tr>
  <tr class="total">
    <td class="total_articles" colspan="3"> total articles: {{total_articles}} </td>
  </tr>
</table>
    
</template>

<style scoped lang="scss">
th, tr, td {
    border: 1px solid black;
}
table {
    border-collapse: collapse;
}

</style>