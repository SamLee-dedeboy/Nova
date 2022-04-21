<script>
import * as d3 from "d3";
import { onUpdated } from '@vue/runtime-core';
export default {
    props: ['dataset', 'enabled_outlet_set'],
    computed: {
        outlet_set() {
            return this.enabled_outlet_set.filter(outlet => outlet.enabled).map(outlet => outlet.outlet)
        },
        filtered_graphList() {
            return this.dataset.graphList.map(
                graph =>  {
                    return {
                        nodes: graph.nodes.filter(node => this.outlet_set.includes(node.outlet)), 
                        center_node: graph.center_node
                    }
                })
        },
    },
    mounted() {
        this.canvas = d3.select("#graph")
        this.drawGraphList()
        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(["red", "white"]); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(["white", "yellow"]);
    },
    watch: {
        dataset: function() {
            this.drawGraphList()
        },
        enabled_outlet_set: function() {
            console.log("filtered. updating ")
            console.log(this.outlet_set)
            this.updateNode()
            this.updateEdges()
        }
    },
    methods: {
        updateEdges() {
            var svg = this.canvas.selectAll("svg")
            var center_rect = svg.select("rect.center")

            svg.selectAll("line.graph_edge")
                .attr("x1", function(d) { return parseInt(d3.select(d).attr("x")) + parseInt(d3.select(d).attr("width")/2); })
                .attr("x2", function(d) { return parseInt(center_rect.attr("x")) + parseInt(center_rect.attr("width")/2); })
                .attr("y1", function(d) { return parseInt(d3.select(d).attr("y")) + parseInt(d3.select(d).attr("height")/2); })
                .attr("y2", function(d) { return parseInt(center_rect.attr("y")) + parseInt(center_rect.attr("height")/2); })
                .attr("stroke", "rgb(6,120,155)")
                .attr("stroke-dasharray", function(d) { return parseInt(d3.select(d).attr("stroke-dasharray"))==0 ? 0:2.5; })
            svg.selectAll("line.graph_edge").lower()
        }, 
        updateNode() {
            console.log(this.filtered_graphList)
            var node = this.canvas.selectAll("svg").selectAll(".outlet_node")
            const color_pos = this.color_pos
            const color_neg = this.color_neg 
            node.append("rect")
                .attr("class", "nodes")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                

            node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("dy", "15")
                .attr("dx", "7.5")
                .attr("font-size","small")
                .text(function(d) {return d.outlet || d.text; })

            node.selectAll("rect")
                .attr("width", function(d){ return this.parentNode.childNodes[1].getComputedTextLength() + 15; })
                .attr("height", "20")
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
        },
        drawGraphList() {
            console.log("dataset updated", this.dataset)
            console.log(this.filtered_graphList)

            var graphSvg = this.canvas.selectAll("svg")
            .data(this.filtered_graphList)
            .join("svg")
            .each(function(graph) {
                // outlet_node
                var svg = d3.select(this)
                const outlet_nodes = svg.selectAll("g")
                .data(graph.nodes)
                .join("g")
                .style("cursor", "pointer")
                .attr("class", "outlet_node")
                .on("mouseover", function(d) {
                        svg.select("rect").style("filter", "brightness(90%)")
                })
                .on("mouseout", function(d) {
                        svg.select("rect").style("filter", "brightness(100%)")
                })

                // center node
                const center_node_data = graph.center_node
                const center_node = svg.append("g")
                    .data([center_node_data])
                    .join("g")
                    .attr("class", "center_node")
             })
       
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
        
            this.updateEdges();

        },
    }
}




</script>
<template>
<div>
    <p>Target Section</p>
    <div id='graph'>

    </div>
</div>
</template>