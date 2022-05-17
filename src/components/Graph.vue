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
            const center_node = this.graph.nodes.filter(node => node.isCenter)[0]
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
            graph_dict[this.center_node.text] = this.center_node
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
        this.animating_click = false

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
        translateAndScale(node, outletToPosDict, scale, callback) {
            node.selectAll("*").attr("transform-origin", function(d) {
                const container = d3.select(this)
                return (container.attr("cx") || container.attr("x")) + " " + (container.attr("cy") || container.attr("y"))
            })
            // .transition()
            // .duration(500)
            .attr("transform", function(d) {
                const element = d3.select(this)
                const elementData = element.data()[0]
                const new_x = outletToPosDict[elementData.outlet || elementData.text][0]
                const new_y = outletToPosDict[elementData.outlet || elementData.text][1]
                //element.attr("cx", new_x).attr("cy", new_y)
                var pair = undefined
                if (element.attr("transform") != null) {
                    pair = element.attr("transform").replace(/translate\(/i, "").replace(/\)/i, "").split(",")

                    var x = new_x - (element.attr("cx") || element.attr("x") || ((pair==undefined)?0:pair[0]) || 0)
                    var y = new_y - (element.attr("cy") || element.attr("y") || ((pair==undefined)?0:pair[1]) || 0)
                } else {
                    var x = 0
                    var y = 0
                } 
                return "translate(" + x + "," + y + ")" + ' scale(' + scale + ")"
                //return "translate(" + (new_x-cx) + "," + (new_y-cy) +")" + " " + 'scale(' + shrink_ratio + ")"
            })
            node.attr("cx", function(d) {
                const element = d3.select(this)
                const elementData = element.data()[0]
                return outletToPosDict[elementData.outlet || elementData.text][0]
                
            })
            .attr("cy", function(d) {
                const element = d3.select(this)
                const elementData = element.data()[0]
                return outletToPosDict[elementData.outlet || elementData.text][1] 
            })
            .on("end", callback)
        },
        updateCenterNode(pos_moved=false) {
            var svg = this.canvas
            var self = this
            const center_node = svg.selectAll("g.center")
            .data([this.center_node], function(d) { return d.text; })
            .join(
                enter => {
                    var node = enter.append("g")
                    .attr("class", "center")
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; })
                    self.applyNodeStyling(node, "center", undefined, "enter center")
                },
                update => {
                    if(pos_moved) {
                        var node = svg.selectAll("g.center")
                        .attr("cx", function(d) { return d.x; })
                        .attr("cy", function(d) { return d.y; })
                        self.applyNodeStyling(node, "center", undefined, "update center")
                    }
                }
            )
            
        },
        updateNodes(pos_moved=false, clicked_outlet=null, scale_ratio = 1) {
            var svg = this.canvas
            this.previousData = d3.local();

            var self = this
            const nodes = svg.selectAll("g.node").filter(node => node.outlet != clicked_outlet)

            const filtered_nodes = this.graph.nodes.filter(node => !node.isCenter && node.outlet != clicked_outlet)
            // create g for outlet nodes and bind data
            nodes.data(filtered_nodes, function(d) { return d.outlet })
            .join(
                enter => {
                    var node = enter.append("g")
                    .attr("class", "node")
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; })
                    self.applyNodeStyling(node, "node", undefined, "enter node")
                },
                update => {
                    if(pos_moved) {
                        var node = svg.selectAll("g.node").filter(node => node.outlet != clicked_outlet)
                        node.attr("cx", function(d) {   return d.x; })
                        .attr("cy", function(d) { return d.y; })
                        self.applyNodeStyling(node, "node", undefined, "update node")
                    }
                    //self.addEdges(update)
                },
                exit => {
                    const duration = 1000
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
                    .on("end", function(d) { self.addEdges(d3.selectAll("g.node")) })
                }
            )
            this.addEdges(svg.selectAll("g.node"))


            svg.selectAll("g.node")
            .style("cursor", "pointer")
            .on("mouseover", function(d) {
                if(self.animating_click) return
                const container = d3.select(this)
                container.select("circle.expand")
                .transition()
                .duration(100)
                .attr("r", function(d) { return parseFloat(container.select("circle.node").attr("r")) + 10;})
                
                container.selectAll("circle")
                .style("filter", "brightness(90%)")

            })
            .on("mouseout", function(d) {
                if(self.animating_click) return

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
                //const expanded_r = 0.2*height
                const clickedNode = d3.select(this)
                clickedNode.select("g.outer_ring").remove()
                svg.selectAll("line.graph_edge").filter(line => d3.select(line).data()[0].outlet == clickedNode.data()[0].outlet).remove()
                
                const clicked_center = [width/2, height/2]
                // animate clicked node
                self.animating_click = true
                // move text
                clickedNode.selectAll("text").transition().duration(1000)
                .attr("x", clicked_center[0])
                .attr("y", clicked_center[1])
                // move circles
                const circles = clickedNode.selectAll("circle")
                circles.transition().duration(1000)
                .attr("cx", clicked_center[0])
                .attr("cy", clicked_center[1])
                .attr("r", expanded_r)
                // move container
                clickedNode
                .transition().duration(1000)
                .attr("cx", clicked_center[0])
                .attr("cy", clicked_center[1])
                .attr("r", expanded_r)
                .on("end", function() {
                    self.applyNodeStyling(clickedNode, "node", expanded_r, "on click")
                    self.addEdges(d3.selectAll("g.node"))
                    self.animating_click = false
                })
                // update edges
                
                const clicked_node_sentiment = clickedNode.data()[0].sentiment > 0
                //other nodes
                const shrink_ratio = 0.5
                const center_x = clicked_node_sentiment? 100:700
                const center_y = 100
                const origin_x = clicked_node_sentiment? 0:600
                const origin_y = 0
                const shrinked_width = 180
                const shrinked_height = 150
                const otherNodes = d3.selectAll("g.node").filter((d) => d.outlet != clickedNode.data()[0].outlet)                
                //self.moveNodesToCorner(otherNodes, [200, 150], [600, 0], [center_x, center_y], shrink_ratio)
                self.force_layout(otherNodes, [origin_x, origin_y, shrinked_width, shrinked_height], [center_x, center_y], shrink_ratio, clickedNode.data()[0].outlet)
               
               //self.translateAndScale(otherNodes, [new_x, new_y], shrink_ratio)

                const center_node = d3.select("g.center")    
                const center_node_pos = {}
                center_node_pos[center_node.data()[0].text] = [center_x, center_y]
                //self.translateAndScale(center_node, center_node_pos, shrink_ratio)
  
                self.$emit("node-clicked", d)
            })

        },
        moveNodesToCorner(nodes, boundingBox, new_origin, new_center, scale_ratio) {
            const original_width = parseInt(this.canvas.attr("viewBox").split(" ")[2])
            const original_height = parseInt(this.canvas.attr("viewBox").split(" ")[3])
            const ratio = [boundingBox[0]/original_width, boundingBox[1]/original_height]
            
            // construct dict with key: outletname, value: position
            const outletToPosDict = {}
            d3.select(nodes).nodes().forEach(node => {
                node.nodes().forEach(ele => {
                   const eleSelection = d3.select(ele)
                   outletToPosDict[eleSelection.data()[0].outlet] = [parseFloat(eleSelection.attr("cx"))*ratio[0]+new_origin[0],parseFloat( eleSelection.attr("cy"))*ratio[1]+new_origin[1]]
                })
            })
            // update data
            nodes.data().forEach(node => {
                node.x = outletToPosDict[node.outlet][0]
                node.y = outletToPosDict[node.outlet][1]
            })
            this.graph.center_node.x = new_center[0]
            this.graph.center_node.y = new_center[1]

            // move the svgs
            this.translateAndScale(nodes, outletToPosDict, scale_ratio)
            const center_node = d3.select("g.center")    
            const center_node_pos = {}
            center_node_pos[center_node.data()[0].text] = new_center
            this.translateAndScale(center_node, center_node_pos, scale_ratio)
        },
        force_layout(nodes, boundingBox, center, scale_ratio, clicked_outlet) {
            const origin = [boundingBox[0], boundingBox[1]]
            const width = boundingBox[2]
            const height = boundingBox[3]
            const collision_radius = 25
            var self = this
            
            var simulation = d3.forceSimulation(this.graph.nodes)
                    .alphaMin(0.3)

                    .force("x", d3.forceX().x(function(d) {
                        return d.dotted?center[0]:((d.sentiment > 0)? center[0]+width/3: center[0]-width/3)
                    }))
                    .force("y", d3.forceY(height / 4).strength(.08))
                    .force("center", d3.forceCenter(center[0], center[1]))
                    .force("charge", d3.forceManyBody())
                    .force("link", d3.forceLink().distance(100).strength(1))
                    .force('collision', d3.forceCollide().radius(collision_radius))
                    .on('tick', function() {
                        //console.log(this.nodes())
                        const center_node = this.nodes().filter(node => node.isCenter)[0]
                        center_node.x = center[0]
                        center_node.y = center[1]
                        this.nodes().forEach(node => {
                            const bound_x = [origin[0], origin[0]+width - collision_radius]
                            const bound_y = [origin[1], origin[1]+height - collision_radius]
                            if(node.x < bound_x[0]) node.x = bound_x[0]
                            if(node.x > bound_x[1]) node.x = bound_x[1]
                            if(node.y < bound_y[0]) node.y = bound_y[0]
                            if(node.y > bound_y[1]) node.y = bound_y[1]
                        })
                        self.updateNodes(true, clicked_outlet, scale_ratio)
                        self.updateCenterNode(true, scale_ratio)
                        nodes.attr("transform-origin", function(d) {
                            const container = d3.select(this)
                            return (container.attr("cx") || container.attr("x")) + " " + (container.attr("cy") || container.attr("y"))
                        }).attr("transform", () => "scale(" + scale_ratio + ")")
                        d3.select("g.center").attr("transform-origin", function(d) {
                            const container = d3.select(this)
                            return (container.attr("cx") || container.attr("x")) + " " + (container.attr("cy") || container.attr("y"))
                        }).attr("transform", () => "scale(" + scale_ratio + ")")
                    })
                    // .on("end", function() {
                    //     console.log("end", self.graph.nodes)
                    //     self.updateNodes(true)
                    //     self.updateCenterNode(true)
                    // })
                    //     const outletToPosDict = Object.assign({}, ...this.nodes().map((node) => ({[node.outlet||node.text]: [node.x, node.y]})));
                    //     self.translateAndScale(nodes, outletToPosDict, scale_ratio)
                    //     self.translateAndScale(d3.select("g.center"), outletToPosDict, scale_ratio, () => self.addEdges(d3.selectAll("g.node")))
                    //     console.log(outletToPosDict)
                    //     self.canvas.append("circle")
                    //     .attr("cx", 700)
                    //     .attr("cy", 100)
                    //     .attr("r", 10)
                    //     .attr("fill", "black")

                    // })
            
        },
        
        applyNodeStyling(node, class_name,r=0, msg="???") {
            if(node.empty()) return 
            //var node = append_flag?enter.append("g"):enter
            // console.log(d3.select(enter).node())
            // ? enter.select("g." + class_name)
            // : enter.append("g").attr("class", class_name)
            // .attr("cx", function(d) { return cx<0?d.x:cx;})
            // .attr("cy", function(d) { return cy<0?d.y:cy;})
            var self = this
            // add circles for node
            const innerCircle = 
            (node.selectAll("circle." + class_name).node()
            ? node.selectAll("circle." + class_name)
            : node.append("circle").attr("class", class_name))
            innerCircle.attr("cx", function(d) { return d3.select(this.parentNode).attr('cx') })
                .attr("cy", function(d) { return d3.select(this.parentNode).attr('cy') })
                .attr("opacity", 0)
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})

            // add label
            const nodeText = 
            (node.selectAll("text.node_text").node()
            ? node.selectAll("text.node_text")
            : node.append("text").attr("class", "node_text"))
            nodeText.attr("x", function(d) { return d3.select(this.parentNode).attr("cx"); })
                .attr("y", function(d) { return d3.select(this.parentNode).attr("cy"); })
                .attr("text-anchor", "middle")
                .attr("font-size","small")
                .attr("dominant-baseline", "central")
                .text(d => self.abbr_dict[d.outlet] || d.text)

            //set size and styling according to label width
            //node.selectAll("circle." + class_name)
                //.attr("r", function(d){  return d3.select(this.parentNode).select("text").node().getComputedTextLength()/1.5 + d.dotted?0:d.articles.length; })
            node.attr("r", function(d) { 
                return self.articlesToRadius(this, d, r)
            })
            //return 

            node.selectAll("circle." + class_name)
                .attr("r", function(d) { 
                    return d3.select(this.parentNode).attr("r")
                })
            // append outer circle for expand animation
            const outer_circle = 
            (node.select("circle.expand").node()
            ? node.select("circle.expand")
            : node.append("circle").attr("class", "expand"))
            outer_circle.attr("cx", function(d) { return d3.select(this.parentNode).attr("cx"); })
            .attr("cy", function(d) { return d3.select(this.parentNode).attr("cy"); })
            .attr("r",  function(d) { return parseFloat(d3.select(this.parentNode).attr("r"));})
            .attr("stroke", "black")
            .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})
            .attr("fill", "white") 
            .lower()

            // set outer rings to represent sentiments
            // no outer rings if node is dotted
            const outer_ring = 
                ((node.filter(function(d) { return !d.dotted}).select("g.outer_ring").node())
                ? node.select("g.outer_ring")
                : node.append("g").attr("class", "outer_ring"))
            // positive ring
            const pos_ring = 
            (outer_ring.select("path.pos").node()
            ? outer_ring.select("path.pos")
            : outer_ring.append("path").attr("class", "pos"))
            pos_ring.attr("fill", this.pos_color_range[1])     
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
            const neg_ring = 
            (outer_ring.select("path.neg").node()
            ? outer_ring.select("path.neg")
            : outer_ring.append("path").attr("class", "neg"))
            neg_ring.attr("fill", this.neg_color_range[0])     
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
            const neu_ring =( outer_ring.select("path.neu").node()
            ? outer_ring.select("path.neu")
            : outer_ring.append("path").attr("class", "neu"))
            neu_ring.attr("fill", "grey")     
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
            if(node.empty()) return
            // edges
            var svg = this.canvas
            // bind edges to node circles, so that edges can bind to circle center
            var center_node = svg.select("g.center")

            var edges = svg.selectAll("line")
            .data(node, function(d) { return d.outlet})
            .join("line")
            .attr("class", "graph_edge")
            .attr("x1", function(d) { return d3.select(d).attr("cx");})
            .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
            .attr("y1", function(d) { return d3.select(d).attr("cy")})
            .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
            .attr("stroke", function(d) { return d3.select(d).data()[0].dotted?"black":(d3.select(d).data()[0].sentiment>0?"blue":"red")})
            .attr("stroke-dasharray", function(d) { return d3.select(d).data()[0].dotted ? 2.5:0; })
            .lower()
            // node.append("line")
            // .attr("class", "graph_edge")
            // .attr("x1", function(d) { return d3.select(this.parentNode).attr("cx");})
            // .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
            // .attr("y1", function(d) { return d3.select(this.parentNode).attr("cy")})
            // .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
            // .attr("stroke", function(d) { return d3.select(this.parentNode).data()[0].dotted?"black":(d3.select(this.parentNode).data()[0].sentiment>0?"blue":"red")})
            // .attr("stroke-dasharray", function(d) { return d3.select(this.parentNode).data()[0].dotted ? 2.5:0; })
            // .lower()

            center_node.raise()
          
            
        },  
        articlesToRadius(node, d, r=0) {
            return r>0?r:((r<0?r:1)*d3.select(node).select("text").node().getComputedTextLength()/1.5 + (d.dotted?5:(d.articles?d.articles.length+5:5)));
        }
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