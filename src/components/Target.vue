<script>
import * as d3 from "d3";
import { onUpdated } from '@vue/runtime-core';
export default {
    data() {
        return {
            nodes:[],
            edges:[]
        }
    }, 
    mounted() {
        this.canvas = d3.select("#graph").append("svg"),

        this.emitter.on("graph-dev", graph => {
            var nodes = graph.nodes
            var center_node = graph.center_node
            // draw edges first for z-index
            this.drawNodes(nodes, center_node, this.canvas)
            var rects = this.canvas.selectAll("rect.nodes")
            var center_rect = this.canvas.select("rect.center")
            this.drawEdges(rects, center_rect, this.canvas)
            this.canvas.selectAll("line.graph_edge").lower()
        })
    },
    methods: {
        drawNodes(nodes, center_node_data, canvas) {
            // define node color
            var color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(["blue", "white"]); 
            var color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(["white", "red"]);

            // create nodes for outlets
            var node = canvas.selectAll("g")
            .data(nodes)
            .join("g")
            node.append("rect")
                .attr("class", "nodes")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
            node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("dy", "20")
                .attr("dx", "10")
                .text(function(d) {return d.outlet || d.text; })

             node.selectAll("rect")
                .attr("width", function(d){ return this.parentNode.childNodes[1].getComputedTextLength() + 20; })
                .attr("height", "30")
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                .attr("fill", function(d) { return d.sentiment<0?color_neg(d.sentiment):color_pos(d.sentiment); }) 
            
            // create center node for noun-phrase
            var center_node = canvas.append("g")
                .data([center_node_data])
                .join("g")
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
                .attr("width", function(d){ return this.parentNode.childNodes[1].getComputedTextLength() + 20; })
                .attr("height", "30")
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                .attr("fill", "white") 

        },
        
        drawEdges(rects, center_rect, canvas) {
            canvas.selectAll("line")
                .data(rects)
                .join("line")
                .attr("class", "graph_edge")
                .attr("x1", function(d) { return parseInt(d3.select(d).attr("x")) + parseInt(d3.select(d).attr("width")/2); })
                .attr("x2", function(d) { return parseInt(center_rect.attr("x")) + parseInt(center_rect.attr("width")/2); })
                .attr("y1", function(d) { return parseInt(d3.select(d).attr("y")) + parseInt(d3.select(d).attr("height")/2); })
                .attr("y2", function(d) { return parseInt(center_rect.attr("y")) + parseInt(center_rect.attr("height")/2); })
                .attr("stroke", "rgb(6,120,155)")
                .attr("stroke-dasharray", function(d) { return parseInt(d3.select(d).attr("stroke-dasharray"))==0 ? 0:2.5; })
            return 
        }
    }
}




</script>
<template>
<div>
    <p>Target Section</p>
    <div id="graph">this is graph</div>
</div>
</template>