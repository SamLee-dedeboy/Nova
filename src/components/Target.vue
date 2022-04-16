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
            this.nodes = graph.nodes
            this.edges = graph.edges
            // draw edges first for z-index
            this.drawEdges(this.edges, this.canvas)
            this.drawNodes(this.nodes, this.canvas)

        })
    },
    methods: {
        drawNodes(nodes, canvas) {
            var color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(["blue", "white"]); 
            var color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(["white", "red"]);
            canvas.selectAll("circle .nodes")
                .data(nodes)
                .join("svg:circle")
                .attr("class", "nodes")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r", "10px")
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                .attr("fill", function(d) { if(d.isCenter) { return "white"} else return d.sentiment<0?color_neg(d.sentiment):color_pos(d.sentiment); }) 
            canvas.selectAll("text .nodes")
                .data(nodes)
                .join("svg:text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .text(function(d) {return d.outlet || d.text; })
        },
        drawEdges(edges, canvas) {
            canvas.selectAll(".line")
                .data(edges)
                .join("line")
                .attr("x1", function(d) { return d.source.x })
                .attr("y1", function(d) { return d.source.y })
                .attr("x2", function(d) { return d.target.x })
                .attr("y2", function(d) { return d.target.y })
                .attr("stroke", "rgb(6,120,155)")
                .attr("stroke-dasharray", function(d) { return d.target.dotted || d.source.dotted? 2.5 : 0})

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