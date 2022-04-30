<script>
import * as d3 from "d3";
import Node from "./Node.vue"
export default {
    props: ['graph', 'graph_index'],
    components: {
        Node
    },
    computed: {
        total_articles: function() {
            return this.graph.nodes.reduce((sum, node) => sum + node.dotted? 0:node.articles.length, 0)
        }
    },
    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        this.updateEdges()
    },

    methods: {
        handleNodeClick(node) {
            console.log("node clicked!", node)
        },
        updateEdges() {
            // edges
            var svg = this.canvas
            var circles = svg.selectAll("circle.node")
            const edges = svg.selectAll("line")
            .data(circles)
            .join("line")
            .attr("class", "graph_edge")

            var center_node = svg.select("g.center").select("circle")
            svg.selectAll("line.graph_edge")
                .attr("x1", function(d) { return parseInt(d3.select(d).attr("cx"));})
                .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
                .attr("y1", function(d) { return parseInt(d3.select(d).attr("cy"));})
                .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
                .attr("stroke", "rgb(6,120,155)")
                .attr("stroke-dasharray", function(d) { return parseInt(d3.select(d).attr("stroke-dasharray"))==0 ? 0:2.5; })
            svg.selectAll("line.graph_edge").lower()
        },      
    }
}




</script>
<template>
<svg>
    <Node v-for="(node, index) in graph.nodes"
    :key="node.outlet"
    :id="`node-${index}`"
    :graph_index="this.graph_index"
    :node_index="index"
    :node="node"
    :r="Math.abs(node.sentiment)"
    class="node"
    @node-clicked="handleNodeClick"
    >
    </Node>
    <Node 
    :key="graph.center_node.text"
    :id="`node-center`"
    :graph_index="this.graph_index"
    node_index="center"
    :node="graph.center_node"
    :r="this.total_articles"
    class="center"
    ></Node>
</svg>
</template>
