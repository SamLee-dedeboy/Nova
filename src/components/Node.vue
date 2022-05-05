<script>
import * as d3 from "d3";
export default {
    props: ['node','node_index', 'r', 'class', 'graph_index'],
    
    mounted() {
        this.svg = d3.select("#graph-" + this.graph_index)
        this.neg_color_range = ["red", "salmon"]
        this.pos_color_range = ["#7986F8", "#3146F9"]

        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(this.neg_color_range); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(this.pos_color_range);
        this.updateNode()

    },

    methods: {
        updateNode() {
            var svg = this.svg
            var self = this
            // create g and bind data
            const node = svg.select("#node-" + this.node_index)
            .data([this.node])
            .join("g")
            .style("cursor", "pointer")
            .attr("class", this.class)
            .on("mouseover", function(d) {
                    d3.select(this).select("circle.expand")
                    .transition()
                    .duration(100)
                    .attr("opacity", 1)

                    d3.select(this).selectAll("circle")
                    .style("filter", "brightness(90%)")

                })
                .on("mouseout", function(d) {
                    d3.select(this).select("circle.expand")
                    .transition()
                    .duration(100)
                    .attr("opacity", 0)

                    d3.select(this).selectAll("circle")
                    .style("filter", "brightness(100%)")
                })
                .on("click", function(e, d) {
                    self.$emit("node-clicked", d)
                })
            // add circles for node
            node.append("circle")
                .attr("class", "node")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
            
            // add label
            node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "central")
                .attr("font-size","small")
                .text(function(d) {return d.outlet || d.text; })

            // set size and styling according to label width
            node.selectAll("circle.node")
                .attr("r", function(d){ return this.parentNode.childNodes[1].getComputedTextLength()/1.5 + self.r; })
                .attr("stroke", "black")
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
                .attr("fill", "white") 
                
            // set outer rings to represent sentiments
            // no outer rings if node is dotted
            if(this.node.dotted) return

            // create element for outer ring, wrapped in g
            var outer_ring = node.append("g")
                .attr("class", "outer_ring")

            // positive ring
            outer_ring.append("circle")
                .attr("class", "outer_ring_pos")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r",  function(d) { return parseInt(d3.select(this.parentNode.parentNode.childNodes[0]).attr("r"));})
                .attr("fill", "transparent")
                .attr("stroke", this.pos_color_range[1])
                .attr("stroke-width", 5)
                .attr("stroke-dasharray", function(d) { 
                    var r = d3.select(this).attr("r")
                    var percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var width = 2*3.14*r*percentage
                    var space = 2*3.14*r
                    return width + " " + space
                })
            // negative ring
            outer_ring.append("circle")
                .attr("class", "outer_ring_neg")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r",  function(d) { return parseInt(d3.select(this.parentNode.parentNode.childNodes[0]).attr("r"));})
                .attr("fill", "transparent")
                .attr("stroke", this.neg_color_range[0])
                .attr("stroke-width", 5)
                .attr("stroke-dasharray", function(d) { 
                    var r = d3.select(this).attr("r")
                    var percentage = -parseFloat(d.neg_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var width = 2*3.14*r*percentage
                    var space = 2*3.14*r
                    return width + " " + space
                })
                .attr("transform-origin", function(d) {
                    return d3.select(this).attr("cx") + " " + d3.select(this).attr("cy")
                })
                .attr("style", function(d) {
                    var percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var degree = percentage * 360
                    return "transform: rotate(" + degree + "deg);"
                })
            // neutral ring
            outer_ring.append("circle")
                .attr("class", "outer_ring_neu")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r",  function(d) { return parseInt(d3.select(this.parentNode.parentNode.childNodes[0]).attr("r"));})
                .attr("fill", "transparent")
                .attr("stroke", "grey")
                .attr("stroke-width", 5)
                .attr("stroke-dasharray", function(d) { 
                    var r = d3.select(this).attr("r")
                    var percentage = parseFloat(d.neu_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var width = 2*3.14*r*percentage
                    var space = 2*3.14*r
                    return width + " " + space
                })
                .attr("transform-origin", function(d) {
                    return d3.select(this).attr("cx") + " " + d3.select(this).attr("cy")
                })
                .attr("style", function(d) {
                    var percentage = parseFloat(d.neu_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var degree = -percentage*360
                    return "transform: rotate(" + degree + "deg);"
                })
            // append outer circle for expand animation
            var outer_circle = node.append("circle")
            .attr("class", "expand")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r",  function(d) { return parseInt(d3.select(this.parentNode.childNodes[0]).attr("r")) + 10;})
            .attr("stroke", "black")
            .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
            .attr("fill", "white") 
            .attr("opacity", 0)
            .lower()

        },      
    }
}




</script>
<template>
    <g >
    </g>
</template>
