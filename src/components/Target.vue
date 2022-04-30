<script>
import * as d3 from "d3";
export default {
    props: ['graph', 'graph_index'],
    computed: {
        total_articles: function() {
            return this.graph.nodes.reduce((sum, node) => sum + node.dotted? 0:node.articles.length, 0)
        }
    },
    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        this.canvas.append("svg")

        this.neg_color_range = ["red", "salmon"]
        this.pos_color_range = ["#7986F8", "#3146F9"]

        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(this.neg_color_range); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(this.pos_color_range);
        this.updateGraph()

    },

    methods: {
        updateEdges() {
            var svg = this.canvas.selectAll("svg")
            var center_node = svg.select("circle.center")

            svg.selectAll("line.graph_edge")
                .attr("x1", function(d) { return parseInt(d3.select(d).attr("cx"));})
                .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
                .attr("y1", function(d) { return parseInt(d3.select(d).attr("cy"));})
                .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
                .attr("stroke", "rgb(6,120,155)")
                .attr("stroke-dasharray", function(d) { return parseInt(d3.select(d).attr("stroke-dasharray"))==0 ? 0:2.5; })
            svg.selectAll("line.graph_edge").lower()
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
                .attr("alignment-baseline", "central")
                .attr("font-size","small")
                .text(function(d) {return d.outlet || d.text; })

            node.selectAll("circle")
                .attr("r", function(d){ return this.parentNode.childNodes[1].getComputedTextLength()/1.5 + Math.abs(d.sentiment*15); })
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                .attr("fill", function(d) { return d.dotted?"white":(d.sentiment<0?color_neg(d.sentiment):color_pos(d.sentiment)); }) 
            
            var center_node = this.canvas.selectAll("svg").selectAll(".center_node")
            var total_articles = this.total_articles
            center_node.append("circle")
                .attr("class", "center")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
        

            center_node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "central")
                .attr("font-size","small")
                .text(function(d) {return d.outlet || d.text; })

            center_node.selectAll("circle")
                .attr("r", function(d) { return this.parentNode.childNodes[1].getComputedTextLength()/1.5 + total_articles; })
                //.attr("r", function(d){  return this.parentNode.childNodes[1].getComputedTextLength()/1.5; })
                .attr("stroke", "black")
                .attr("fill", "white") 

            var outer_ring = center_node.append("g")
                .attr("class", "outer_ring")
                //.attr("style", "transform: rotate(-90deg)")
            outer_ring.append("circle")
                .attr("class", "outer_ring_pos")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r",  function(d) { return parseInt(d3.select(this.parentNode.parentNode.childNodes[0]).attr("r") + 5);})
                .attr("fill", "transparent")
                .attr("stroke", this.pos_color_range[1])
                .attr("stroke-width", 5)
                .attr("stroke-dasharray", function(d) { 
                    var r = d3.select(this).attr("r")
                    var percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neutral_sent)
                    var width = 2*3.14*r*percentage
                    var space = 2*3.14*r
                    return width + " " + space
                })
                
            outer_ring.append("circle")
                .attr("class", "outer_ring_neg")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r",  function(d) { return parseInt(d3.select(this.parentNode.parentNode.childNodes[0]).attr("r") + 5);})
                .attr("fill", "transparent")
                .attr("stroke", this.neg_color_range[1])
                .attr("stroke-width", 5)
                .attr("stroke-dasharray", function(d) { 
                    var r = d3.select(this).attr("r")
                    var percentage = -parseFloat(d.neg_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neutral_sent)
                    var width = 2*3.14*r*percentage
                    var space = 2*3.14*r
                    return width + " " + space
                })
                .attr("transform-origin", function(d) {
                    return d3.select(this).attr("cx") + " " + d3.select(this).attr("cy")
                })
                .attr("style", function(d) {
                    var percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neutral_sent)
                    var degree = percentage * 360
                    return "transform: rotate(" + degree + "deg);"
                })
            outer_ring.append("circle")
                .attr("class", "outer_ring_neu")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r",  function(d) { return parseInt(d3.select(this.parentNode.parentNode.childNodes[0]).attr("r") + 5);})
                .attr("fill", "transparent")
                .attr("stroke", "grey")
                .attr("stroke-width", 5)
                .attr("stroke-dasharray", function(d) { 
                    var r = d3.select(this).attr("r")
                    var percentage = parseFloat(d.neutral_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neutral_sent)
                    var width = 2*3.14*r*percentage
                    var space = 2*3.14*r
                    return width + " " + space
                })
                .attr("transform-origin", function(d) {
                    return d3.select(this).attr("cx") + " " + d3.select(this).attr("cy")
                })
                .attr("style", function(d) {
                    var percentage = parseFloat(d.neutral_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neutral_sent)
                    var degree = -percentage*360
                    return "transform: rotate(" + degree + "deg);"
                })
                //.lower()
        },
        updateGraph() {
            var svg = this.canvas.selectAll("svg")
            var self = this
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
            .on("click", function(e, d) {
                console.log(d.articles)
                self.$emit("node-clicked", d)
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
                var circles = svg.selectAll("circle.nodes")
                const edges = svg.selectAll("line")
                .data(circles)
                .join("line")
                .attr("class", "graph_edge")
            })
            this.updateEdges();

        },
    }
}




</script>
<template>
    <span >
    </span>
</template>
