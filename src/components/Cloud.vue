<script>
import { defineComponent } from '@vue/composition-api'
import * as d3 from "d3";

export default defineComponent({
    setup() {
    },
    props: ['graph', 'graph_index'],
    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        this.canvas.append("svg")

        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(["red", "white"]); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(["white", "yellow"]);
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
                .attr("fill", function(d) { return d.sentiment<0?color_neg(d.sentiment):color_pos(d.sentiment); }) 
            var center_node = this.canvas.selectAll("svg").selectAll(".center_node")
            center_node.append("rect")
                .attr("class", "center")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                
            center_node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("dy", "20")
                .attr("dx", "10")
                .text(function(d) {return d.outlet || d.text; })
            center_node.selectAll("rect")
                .attr("width", function(d){  return this.parentNode.childNodes[1].getComputedTextLength() + 20; })
                .attr("height", "30")
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                .attr("fill", "white") 
        
        }
    }
})
</script>
<template>
    <span >
    </span>
</template>