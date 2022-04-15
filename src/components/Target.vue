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
            this.drawNodes(this.nodes, this.canvas)
            this.drawEdges(this.edges, this.canvas)
        })
    },
    methods: {
     drawNodes(nodes, canvas) {
        canvas.selectAll("circle .nodes")
            .data(nodes)
            .enter()
            .append("svg:circle")
            .attr("class", "nodes")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", "10px")
            .attr("fill", "black") 
    },
    drawEdges(edges, canvas) {
        canvas.selectAll(".line")
            .data(edges)
            .enter()
            .append("line")
            .attr("x1", function(d) { return d.source.x })
            .attr("y1", function(d) { return d.source.y })
            .attr("x2", function(d) { return d.target.x })
            .attr("y2", function(d) { return d.target.y })
            .style("stroke", "rgb(6,120,155)");
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