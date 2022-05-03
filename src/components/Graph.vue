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
            return this.graph.nodes.reduce((sum, node) => sum + (node.dotted? 0:node.articles.length), 0)
        },
        center_node: function() {
            var center_node = this.graph.center_node
            center_node.pos_sent = this.graph.nodes.reduce((pos_sum, node) => pos_sum + (node.dotted? 0:node.pos_sent), 0)
            center_node.neg_sent = this.graph.nodes.reduce((neg_sum, node) => neg_sum + (node.dotted? 0:node.neg_sent), 0)
            center_node.neu_sent = this.graph.nodes.reduce((neu_sum, node) => neu_sum + (node.dotted? 0:node.neu_sent), 0)
            return center_node
        },
    },
    watch: {
        graph: function() {
            console.log("graph updated")
            this.graph.center_node.pos_sent = this.graph.nodes.reduce((pos_sum, node) => pos_sum + node.pos_sent, 0)
            this.graph.center_node.neg_sent = this.graph.nodes.reduce((neg_sum, node) => neg_sum + Math.abs(node.neg_sent), 0)
            this.graph.center_node.neu_sent = this.graph.nodes.reduce((neu_sum, node) => neu_sum + Math.abs(node.pos_sent), 0)

        }
    },
    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        // .call(d3.zoom().on("zoom", function (e) {
        //     d3.select(this).attr("transform", e.transform)
        // }))
        this.updateEdges()
    },

    methods: {
        // TODO
        handleNodeClick(node) {
            console.log("node clicked!", node)
        },
        updateEdges() {
            // edges
            var svg = this.canvas

            // bind edges to node circles, so that edges can bind to circle center
            var circles = svg.selectAll("circle.node")
            const edges = svg.selectAll("line")
            .data(circles)
            .join("line")
            .attr("class", "graph_edge")

            // specify two ends of edges
            // center node
            var center_node = svg.select("g.center").select("circle")

            // outlet node
            svg.selectAll("line.graph_edge")
                .attr("x1", function(d) { return parseInt(d3.select(d).attr("cx"));})
                .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
                .attr("y1", function(d) { return parseInt(d3.select(d).attr("cy"));})
                .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
                .attr("stroke", "rgb(6,120,155)")
                .attr("stroke-dasharray", function(d) { return parseInt(d3.select(d).attr("stroke-dasharray"))==0 ? 0:2.5; })
            
            // lower the z-index of edges to prevent from overlapping nodes
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
    :r="Array(node.articles).length*8"
    class="node"
    @node-clicked="handleNodeClick"
    >
    </Node>
    <Node 
    :key="graph.center_node.text"
    :id="`node-center`"
    :graph_index="this.graph_index"
    node_index="center"
    :node="center_node"
    :r="this.total_articles"
    class="center"
    ></Node>
</svg>
</template>
