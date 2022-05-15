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
            this.updateCenterNode()

            this.updateNodes()
            //this.updateEdges()

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
        this.updateCenterNode()

        this.updateNodes()
        //this.updateEdges()

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
                enter => {
                    self.applyNodeStyling(enter, "node")
                },
                update => update,
                exit => {
                    var duration = 1000
                    exit.selectAll("circle")
                    .transition()
                    .duration(duration)
                    .attr("r", 0)
                    .remove()
                    exit.selectAll("text")
                    .transition()
                    .duration(duration)
                    .attr("font-size", "0em")
                    .remove()
                    exit.transition().delay(duration).remove()
                }
            )


            svg.selectAll("g.node")
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
                const width = parseInt(self.canvas.attr("viewBox").split(" ")[2])
                const height = parseInt(self.canvas.attr("viewBox").split(" ")[3])

                // clicked node
                const expanded_r = 0.49*height
                const clickedNode = d3.select(this)
                // clickedNode.attr("transform", function(d) {
                //     const cx = d3.select(this).attr("cx")
                //     const cy = d3.select(this).attr("cy")
                //     const r = d3.select(this).attr("r")
                //     const end_cx = width/2.2
                //     const end_cy = height/2
                //     const end_r = expanded_r
                //     const expand_ratio = expanded_r/r

                //     return 'translate('+((1-expand_ratio)*cx+(end_cx-cx))+","+ ((1-expand_ratio)*cy+(end_cy-cy)) +")"+'scale('+expand_ratio+')';
                //     //return 'translate(' + (1-shrink_ratio)*cx +"," + (1-shrink_ratio)*cy + ")" + 'scale(0.5)'
                // })

                
                clickedNode.select("g.outer_ring").remove()
                clickedNode
                .selectAll("*")
                .transition()
                .duration(1000)
                .attr("transform", function(d) {
                    const element = d3.select(this)
                    var pair = undefined
                    if (element.attr("transform") != null)
                        pair = element.attr("transform").replace(/translate\(/i, "").replace(/\)/i, "").split(",")
                    var x = width/2.2 - (element.attr("cx") || element.attr("x") ||( (pair==undefined)?0:pair[0]) || 0)
                    var y = height/2 - (element.attr("cy") || element.attr("y") || ((pair==undefined)?0:pair[1]) || 0)
                    return "translate(" + x + "," + y + ")";
                })
                .attr("r", expanded_r)
                .remove()
                self.applyNodeStyling(clickedNode, "node", width/2.2, height/2, expanded_r, false)
                
                //other nodes
                const shrink_ratio = 0.5
                const otherNodes = d3.selectAll("g.node").filter((d) => d.outlet != clickedNode.data()[0].outlet)                
                otherNodes.attr("transform", function(d) {
                    var cx = d3.select(this).attr("cx")
                    var cy = d3.select(this).attr("cy")

                    return 'translate(' + (1-shrink_ratio)*cx +"," + (1-shrink_ratio)*cy + ")" + 'scale(0.5)'
                })
                // otherNodes.selectAll("*").remove()
                // self.applyNodeStyling(otherNodes, "node", undefined, undefined, shrink_ratio, false)

                const centerNode = d3.select("g.center")

                //elf.updateEdges()
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
                update => update?update:self.applyNodeStyling(update, "center")
            )
            
        },
        applyNodeStyling(enter, class_name, cx=-1, cy=-1, r=0, append_flag=true) {
            var node = append_flag?enter.append("g"):enter
               
            node.attr("class", class_name)
            .attr("cx", function(d) { return cx<0?d.x:cx;})
            .attr("cy", function(d) { return cy<0?d.y:cy;})
            var self = this
            // add circles for node
            node.append("circle")
                .attr("class", class_name)
                .attr("cx", function(d) { return d3.select(this.parentNode).attr('cx') })
                .attr("cy", function(d) { return d3.select(this.parentNode).attr('cy') })
                .attr("opacity", 0)
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})

            // add label
            node.append("text")
                .attr("class", "node_text")
                .attr("x", function(d) { return d3.select(this.parentNode).attr("cx"); })
                .attr("y", function(d) { return d3.select(this.parentNode).attr("cy"); })
                .attr("text-anchor", "middle")
                .attr("font-size","small")
                .attr("dominant-baseline", "central")
                .text(d => self.abbr_dict[d.outlet] || d.text)

            //set size and styling according to label width
            
            //node.selectAll("circle." + class_name)
                //.attr("r", function(d){  return d3.select(this.parentNode).select("text").node().getComputedTextLength()/1.5 + d.dotted?0:d.articles.length; })

            node.attr("r", function(d) {  return r>0?r:((r<0?r:1)*d3.select(this).select("text").node().getComputedTextLength()/1.5 + 5); })

            node.selectAll("circle." + class_name)
                .attr("r", function(d) { return d3.select(this.parentNode).attr("r")})
            // append outer circle for expand animation
            var outer_circle = node.append("circle")
            .attr("class", "expand")
            .attr("cx", function(d) { return d3.select(this.parentNode).attr("cx"); })
            .attr("cy", function(d) { return d3.select(this.parentNode).attr("cy"); })
            .attr("r",  function(d) { return parseFloat(d3.select(this.parentNode).attr("r"));})
            .attr("stroke", "black")
            .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
            .attr("fill", "white") 
            .lower()

            this.addEdges(node)
            // set outer rings to represent sentiments
            // no outer rings if node is dotted
            var outer_ring = node.filter(function(d) { return !d.dotted})
                .append("g")
                .attr("class", "outer_ring")

            // positive ring
            outer_ring.append("path")
                .attr("fill", this.pos_color_range[1])     
                .attr("transform", function(d) {
                    const cx = d3.select(this.parentNode.parentNode).attr("cx")
                    const cy = d3.select(this.parentNode.parentNode).attr("cy")
                    return "translate(" + cx + "," + cy + ")"
                })
                .transition()
                .duration(1000)
                .tween('ring-effect', function(d) {
                    var percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    //var start_percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var start_percentage = 0

                    var radius = parseFloat(d3.select(this.parentNode.parentNode).attr("r"))

                    let startAngle = 2*Math.PI*start_percentage;
                    let targetAngle = 2 * Math.PI*(start_percentage+percentage);
                    let i = d3.interpolate(startAngle, targetAngle);
                    return function(t) {
                        let currentAngle = i(t);
                    
                        d3.select(this)
                        .attr('d', d3.arc() ({
                                innerRadius: radius-2.5,
                                outerRadius: radius+2.5,
                                startAngle: startAngle,
                                endAngle: currentAngle
                        }))
                    };
                })
                
                
                
            // negative ring
            outer_ring.append("path")
                .attr("fill", this.neg_color_range[0])     
                .attr("transform", function(d) {
                    const cx = d3.select(this.parentNode.parentNode).attr("cx")
                    const cy = d3.select(this.parentNode.parentNode).attr("cy")
                    return "translate(" + cx + "," + cy + ")"
                })     
                .transition()
                .duration(1000)
                .tween('ring-effect', function(d) {
                    var percentage = parseFloat(Math.abs(d.neg_sent))/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var start_percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var radius = parseFloat(d3.select(this.parentNode.parentNode).attr("r"))
                    
                    let startAngle = 2*Math.PI*start_percentage;
                    let targetAngle = 2 * Math.PI*(start_percentage+percentage);
                    let i = d3.interpolate(startAngle, targetAngle);
                    return function(t) {
                        let currentAngle = i(t);
                    
                        d3.select(this)
                        .attr('d', d3.arc() ({
                                innerRadius: radius-2.5,
                                outerRadius: radius+2.5,
                                startAngle: startAngle,
                                endAngle: currentAngle
                        }))
                    }
                })
                
                
            // neutral ring
            outer_ring.append("path")
                .attr("fill", "grey")     
                .attr("transform", function(d) {
                    const cx = d3.select(this.parentNode.parentNode).attr("cx")
                    const cy = d3.select(this.parentNode.parentNode).attr("cy")
                    return "translate(" + cx + "," + cy + ")"
                })     
                .transition()
                .duration(1000)
                .tween('ring-effect', function(d) {
                    var percentage = parseFloat(d.neu_sent)/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var start_percentage = parseFloat(d.pos_sent + Math.abs(d.neg_sent))/(d.pos_sent+Math.abs(d.neg_sent)+d.neu_sent)
                    var radius = parseFloat(d3.select(this.parentNode.parentNode).attr("r"))
                    
                    let startAngle = 2*Math.PI*start_percentage;
                    let targetAngle = 2 * Math.PI*(start_percentage+percentage);
                    let i = d3.interpolate(startAngle, targetAngle);
                    return function(t) {
                        let currentAngle = i(t);
                    
                        d3.select(this)
                        .attr('d', d3.arc() ({
                                innerRadius: radius-2.5,
                                outerRadius: radius+2.5,
                                startAngle: startAngle,
                                endAngle: currentAngle
                        }))
                    };
                })
        },
        addEdges(node) {
            // edges
            var svg = this.canvas
            // bind edges to node circles, so that edges can bind to circle center
            var center_node = svg.select("g.center")

            node.append("line")
            .attr("class", "graph_edge")
            .attr("x1", function(d) { return d3.select(this.parentNode).attr("cx");})
            .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
            .attr("y1", function(d) { return d3.select(this.parentNode).attr("cy")})
            .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
            .attr("stroke", function(d) { return d3.select(this.parentNode).data()[0].dotted?"black":(d3.select(this.parentNode).data()[0].sentiment>0?"blue":"red")})
            .attr("stroke-dasharray", function(d) { return d3.select(this.parentNode).data()[0].dotted ? 2.5:0; })
            .lower()

            center_node.raise()
          
            
        },  
    }
}




</script>
<template>
<svg  class="graph" viewBox="0 0 800 600" :id="id">

</svg>
</template>

<style scoped>
.class {
    width: 100%;
    height: 100%
}
</style>