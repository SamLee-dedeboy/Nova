<script>
import { defineComponent } from '@vue/composition-api'
import * as d3 from "d3";

export default defineComponent({
    setup() {
    },
    props: ['graph', 'graph_index'],
    computed: {
        center_node_gradient() {
            var pos_score = this.graph.nodes.filter(node => node.sentiment > 0).reduce((pos, node) => pos + Math.abs(node.sentiment), 0)
            var neg_score = this.graph.nodes.filter(node => node.sentiment < 0).reduce((neg, node) => neg + Math.abs(node.sentiment), 0)
            console.log(this.graph_index, neg_score / (pos_score + neg_score))
            return neg_score / (pos_score + neg_score)
        }
    },
    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        this.canvas.append("svg")

        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(["red", "salmon"]); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(["khaki", "yellow"]);
        this.updateGraph()
    },
    methods: {
        updateGraph() {
            var svg = this.canvas.selectAll("svg")
            // outlet_node
            const outlet_nodes = svg.selectAll("g")
            .data(this.graph.nodes)
            .join("g")
            .style("cursor", "pointer")
            .attr("class", "outlet_node")
            .on("mouseover", function(d) {
                d3.select(this).select("rect").style("filter", "brightness(90%)")
            })
            .on("mouseout", function(d) {
                d3.select(this).select("rect").style("filter", "brightness(100%)")
            })

            // center node
            const center_node_data = this.graph.center_node
            const center_node = svg.append("g")
                .data([center_node_data])
                .join("g")
                .attr("class", "center_node")
             
       
            this.updateNode();

            // edges
            this.canvas.selectAll("svg").each(function(graph) {
                var svg = d3.select(this)
                var rects = svg.selectAll("rect.nodes")
                const edges = svg.selectAll("line")
                .data(rects)
                .join("line")
                .attr("class", "graph_edge")
            })
            //this.updateEdges();


        },
        updateNode() {
            var node = this.canvas.selectAll("svg").selectAll(".outlet_node")
            const color_pos = this.color_pos
            const color_neg = this.color_neg 
            node.append("circle")
                .attr("class", "nodes")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                

            node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("font-size","small")
                .text(function(d) {return d.outlet || d.text; })

            node.selectAll("circle")
                .attr("r", function(d){ return this.parentNode.childNodes[1].getComputedTextLength()/1.5 + Math.abs(d.sentiment*20); })
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                .attr("fill", function(d) { return d.dotted?"white":(d.sentiment<0?color_neg(d.sentiment):color_pos(d.sentiment)); }) 
            
            
            var center_node = this.canvas.selectAll("svg").selectAll(".center_node")
            var gradient = center_node.append("defs").append("linearGradient")
            .attr("id", "rectSentimentGradient-"+this.graph_index)
         
            gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "red")
            gradient.append("stop")
            .attr("offset", this.center_node_gradient)
            .attr("stop-color", "salmon")
            gradient.append("stop")
            .attr("offset", this.center_node_gradient)
            .attr("stop-color", "khaki")
            gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "yellow")
            center_node.append("rect")
                .attr("class", "center")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("fill", "url(#rectSentimentGradient-"+this.graph_index+")")
            center_node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("dy", "20")
                .attr("dx", "10")
                .text(function(d) {return d.outlet || d.text; })

            center_node.selectAll("rect")
                .attr("width", function(d){ return this.parentNode.childNodes[2].getComputedTextLength() + 20; })
                .attr("height", "30")
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                //.attr("fill", "white") 
        
        }
    }
})
</script>
<template>
    <span >
    </span>
</template>