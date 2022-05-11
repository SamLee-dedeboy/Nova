<script>
import * as d3 from "d3";
import Node from "./Node.vue"
import { nextTick } from 'vue'

export default {
    props: ['graph', 'graph_index', "id"],
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
            //console.log(center_node)
            return center_node
        },
        outlet_set: function() {
            return this.graph.nodes.map(node => node.outlet)
        },
        graph_dict:function() {
            var graph_dict = Object.assign({}, ...this.graph.nodes.map((node) => ({[node.outlet]: node})));
            graph_dict[this.graph.center_node.text] = this.graph.center_node
            return graph_dict
        },
        minimum_radius: function() {
            return 3
           // return Math.max(...this.graph.nodes.map(node => node.outlet.length))
        }
    },
    watch: {
        graph: async function() {
            this.updateNodes()
            this.updateCenterNode()
            this.updateEdges()

        }
    },
    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        // .call(d3.zoom().on("zoom", function (e) {
        //     d3.select(this).attr("transform", e.transform)
        // }))
        this.neg_color_range = ["red", "salmon"]
        this.pos_color_range = ["#7986F8", "#3146F9"]
        this.abbr_dict={
            "CNN": "CNN",
            "FoxNews": "Fox",
            "Breitbart": "Brb",
            "ABC News": "ABC",
            "New York Times": "NYT",
            "Washington Post": "WP"
        }
        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(this.neg_color_range); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(this.pos_color_range);
        this.updateNodes()
        this.updateCenterNode()
        this.updateEdges()

    },

    methods: {
        // TODO
        handleNodeClick(node) {
            console.log("node clicked!", node)
        },
        updateNodes() {
            var svg = this.canvas
            var self = this
            // create g for outlet nodes and bind data
            const nodes = svg.selectAll("g.node")
            .data(this.graph.nodes, function(d) { return d.outlet })
            .join(
                enter => self.applyNodeStyling(enter, "node"),
            )

            svg.selectAll("g")
            .style("cursor", "pointer")
            .on("mouseover", function(d) {
                const container = d3.select(this)
                container.select("circle.expand")
                .transition()
                .duration(100)
                .attr("r", function(d) { return parseFloat(container.select("circle.node").attr("r")) + 10;})
                
                container.selectAll("circle")
                .style("filter", "brightness(90%)")

            })
            .on("mouseout", function(d) {
                const container = d3.select(this)
                container.select("circle.expand")
                .transition()
                .duration(100)
                .attr("r", function(d) { return parseFloat(container.select("circle.node").attr("r"));})

                container.selectAll("circle")
                .style("filter", "brightness(100%)")
            })
            .on("click", function(e, d) {
                self.$emit("node-clicked", d)
            })

        },
        updateCenterNode() {
            var svg = this.canvas
            var self = this
            const center_node = svg.selectAll("g.center")
            .data([this.center_node], function(d) { return d.text; })
            .join(
                enter => self.applyNodeStyling(enter, "center"),
                update => self.applyNodeStyling(update, "center")
            )
        },
        applyNodeStyling(enter, class_name) {
            var node = enter.append("g").attr("class", class_name)
            var self = this
            // add circles for node
            node.append("circle")
                .attr("class", class_name)
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("opacity", 0)
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})

            // add label
            node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; })
                .attr("text-anchor", "middle")
                .attr("font-size","small")

                .attr("dominant-baseline", "central")
                .text(d => self.abbr_dict[d.outlet] || d.text)

            //set size and styling according to label width
            node.selectAll("circle." + class_name)
                //.attr("r", function(d){  return d3.select(this.parentNode).select("text").node().getComputedTextLength()/1.5 + d.dotted?0:d.articles.length; })
                //.attr("r", function(d){  return d3.select(this.parentNode).select("text").node().getComputedTextLength()/1.5 + 5; })
                .attr("r", function(d) { return d.outlet?(self.minimum_radius*6 + (d.articles?d.articles.length*3:0)):d3.select(this.parentNode).select("text").node().getComputedTextLength()/1.5+5})
            // append outer circle for expand animation
            var outer_circle = node.append("circle")
            .attr("class", "expand")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r",  function(d) { return parseFloat(d3.select(this.parentNode).select("circle." + class_name).attr("r"));})
            .attr("stroke", "black")
            .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
            .attr("fill", "white") 
            .lower()
            // set outer rings to represent sentiments
            // no outer rings if node is dotted
            var outer_ring = node.filter(function(d) { return !d.dotted})
                .append("g")
                .attr("class", "outer_ring")

            // positive ring
            outer_ring.append("circle")
                .attr("class", "outer_ring_pos")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .attr("r",  function(d) { return parseFloat(d3.select(this.parentNode.parentNode).select("circle."+class_name).attr("r"));})
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
                .attr("r",  function(d) { return parseFloat(d3.select(this.parentNode.parentNode).select("circle."+class_name).attr("r"));})
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
                .attr("r",  function(d) { return parseFloat(d3.select(this.parentNode.parentNode).select("circle."+class_name).attr("r"));})
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


        },
        updateEdges() {
            // edges
            var svg = this.canvas

            // bind edges to node circles, so that edges can bind to circle center
            var circles = svg.selectAll("circle.node")
            var center_node = svg.select("g.center").select("circle")

            var edges = svg.selectAll("line")
            .data(circles, function(d) { return d3.select(d.parentNode).select("text").text()})
            .join(
                enter => enter.append("line")
                .attr("class", "graph_edge")
                .attr("x1", function(d) { return parseInt(d3.select(d).attr("cx"));})
                .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
                .attr("y1", function(d) { return parseInt(d3.select(d).attr("cy"));})
                .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
                .attr("stroke", function(d) { return d3.select(d).data()[0].dotted?"black":(d3.select(d).data()[0].sentiment>0?"blue":"red")})
                .attr("stroke-dasharray", function(d) { return d3.select(d).data()[0].dotted ? 2.5:0; })
                .lower()
            )
            
        },      
    }
}




</script>
<template>
<svg  viewBox="0 0 800 800" :id="id">

</svg>
</template>
