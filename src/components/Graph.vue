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
            return this.graph.nodes.filter(node => node.articles).reduce((sum, node) => sum + node.articles.length, 0)
        },
        center_node: function() {
            const center_node = this.graph.nodes.filter(node => node.isCenter)[0]
            center_node.pos_sent = this.graph.nodes.reduce((pos_sum, node) => pos_sum + (node.dotted? 0:node.pos_sent), 0)
            center_node.neg_sent = this.graph.nodes.reduce((neg_sum, node) => neg_sum + (node.dotted? 0:node.neg_sent), 0)
            center_node.neu_sent = this.graph.nodes.reduce((neu_sum, node) => neu_sum + (node.dotted? 0:node.neu_sent), 0)
            //console.log(center_node)
            return center_node
        },
        graph_links: function() {
            const center_node_index = this.graph.nodes.findIndex(node => node.isCenter) 
            const links = []
            this.graph.nodes.forEach((node, index) => {
                if(index != center_node_index) {
                    const edge = {
                        "source": index,
                        "target": center_node_index
                    }
                    links.push(edge)
                }
            })
            return links
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
        },
        article_num_list: function() {
           return this.graph.nodes.filter(node => !node.isCenter ).map(node => node.dotted? 0:node.articles.length)
        },
        avg_articles: function() {
           return this.article_num_list.reduce((sum, cur) => sum + cur, 0) / this.article_num_list.length
        },
        min_articles: function() {
            return Math.min(...this.article_num_list)
        },
        max_articles: function() {
            return Math.max(...this.article_num_list)
        },
        canvas_width: function() {
            return parseInt(this.canvas.attr("viewBox").split(" ")[2])
        },
        canvas_height: function() {
            return parseInt(this.canvas.attr("viewBox").split(" ")[3])
        }
    },
    watch: {
        graph: async function(new_graph, old_graph) {
            this.updateCenterNode()
            this.updateNodes()
            this.force_layout(d3.selectAll("g.node"), [0, 0, this.canvas_width, this.canvas_height], [this.canvas_width/2, this.canvas_height/2], 1)

            if(this.clickedNodeData && new_graph.nodes.length > old_graph.nodes.length)
                this.handleNodeClick(undefined, this.clickedNodeData)

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

        const width = this.canvas_width
        const height = this.canvas_height
        this.updateCenterNode()
        this.updateNodes()
        this.force_layout(d3.selectAll("g.node"), [0, 0, width, height], [width/2, height/2], 1)
        //this.updateEdges()

    },

    methods: {
        // TODO
        handleNodeClick(e, d) {
            var self = this
            var svg = this.canvas
            const width = parseInt(this.canvas.attr("viewBox").split(" ")[2])
            const height = parseInt(this.canvas.attr("viewBox").split(" ")[3])

            // clicked node
            const expanded_r = 0.49*height
            //const expanded_r = 0.2*height
            const clickedNode = d3.selectAll("g.node").filter(node => node.outlet == d.outlet)
            clickedNode.select("g.outer_ring").remove()
            svg.selectAll("line.graph_edge").filter(line => d3.select(line).data()[0].outlet == clickedNode.data()[0].outlet).remove()
            
            clickedNode.selectAll("circle").style("filter", "brightness(100%)")

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
            .attr("transform", "scale(1)")
            .on("end", function() {
                self.applyNodeStyling(clickedNode, "node", expanded_r, "on click")
                self.addEdges(d3.selectAll("g.node"))
                self.animating_click = false
            })
            // update edges
            
            const clicked_node_sentiment = clickedNode.data()[0].sentiment > 0
            //other nodes
            const shrink_ratio = 0.45
            const origin_x = clicked_node_sentiment? 0:600
            const origin_y = 0
            const shrinked_width = 180
            const shrinked_height = 120
            const center_x = origin_x + shrinked_width/2
            const center_y = origin_y + shrinked_height/2
            const otherNodes = d3.selectAll("g.node").filter((d) => d.outlet != clickedNode.data()[0].outlet)                
            //self.moveNodesToCorner(otherNodes, [200, 150], [600, 0], [center_x, center_y], shrink_ratio)
            self.force_layout(otherNodes, [origin_x, origin_y, shrinked_width, shrinked_height], [center_x, center_y], shrink_ratio, clickedNode.data()[0].outlet)

            // draw bounding box for dev
            // svg.append("rect")
            // .attr("x", origin_x) 
            // .attr("y", origin_y)
            // .attr("width", shrinked_width)
            // .attr("height", shrinked_height)
            // .attr("fill", "none")
            // .attr("stroke-width", 5)
            // .attr("stroke", "black")

            const center_node = d3.select("g.center")    
            const center_node_pos = {}
            center_node_pos[center_node.data()[0].text] = [center_x, center_y]
            //self.translateAndScale(center_node, center_node_pos, shrink_ratio)

            self.$emit("node-clicked", d)
            self.clickedNodeData = d

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
                    .attr("cx", self.canvas_width/2) 
                    .attr("cy", self.canvas_height/2)
                    self.applyNodeStyling(node, "center", undefined, "enter center")
                },
                update => {
                    var node = svg.selectAll("g.center")
                    if(pos_moved) {
                        node.attr("cx", function(d) { return d.x; })
                        .attr("cy", function(d) { return d.y; })
                    }
                    self.applyNodeStyling(node, "center", undefined, "update center")
                }
            )
            
        },
        updateNodes(pos_moved=false, clicked_outlet=null, scale_ratio = 1, add_edges=false) {
            var svg = this.canvas

            var self = this
            const nodes = svg.selectAll("g.node").filter(node => node.outlet != clicked_outlet)

            const filtered_nodes = this.graph.nodes.filter(node => !node.isCenter && node.outlet != clicked_outlet)
            // create g for outlet nodes and bind data
            nodes.data(filtered_nodes, function(d) { return d.outlet })
            .join(
                enter => {
                    var node = enter.append("g")
                    .attr("class", "node")
                    .attr("cx", self.canvas_width/2)
                    .attr("cy", self.canvas_height/2)
                    self.applyNodeStyling(node, "node", undefined, "enter node")
                },
                update => {
                    var node = svg.selectAll("g.node").filter(node => node.outlet != clicked_outlet)
                    if(pos_moved) {
                        node.attr("cx", function(d) {   return d.x; })
                        .attr("cy", function(d) { return d.y; })
                    }
                    self.applyNodeStyling(node, "node", undefined, "update node")
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
            if(add_edges) this.addEdges(svg.selectAll("g.node"))


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
            .on("click", this.handleNodeClick)
          
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
        force_layout(nodes, boundingBox, center, scale_ratio, clicked_outlet=null) {
            const origin = [boundingBox[0], boundingBox[1]]
            const width = boundingBox[2]
            const height = boundingBox[3]
            var self = this
            var tick_num = 0
            var simulation = d3.forceSimulation(this.graph.nodes)
                    .alphaMin(0.1)
                    // .alphaMin(0.1)
                    .force("x", d3.forceX().x(function(d) {
                        return d.dotted?center[0]:((d.sentiment > 0)? center[0]+width/3: center[0]-width/3)
                    }).strength(0.1))
                    .force("y", d3.forceY(center[1]).strength(0.8))
                    .force("center", d3.forceCenter(center[0], center[1]).strength(0.001))
                    .force("charge", d3.forceManyBody().strength(-100))
                    .force("link", d3.forceLink(self.graph_links).strength(0.0001))
                    .force('collision', d3.forceCollide().radius(d => self.getRadiusBytext(d.outlet?d.outlet:d.text)*scale_ratio))
                    .on('tick', function() {
                        tick_num += 1
                        const center_node = this.nodes().filter(node => node.isCenter)[0]
                        center_node.x = center[0]
                        center_node.y = center[1]
                        if(true || tick_num > 95) {
                            this.nodes().forEach(node => {
                                const radius = self.getRadiusBytext(node.outlet?node.outlet:node.text)*scale_ratio 
                                const bound_x = [origin[0] + radius, origin[0] + width - radius]
                                const bound_y = [origin[1] + radius, origin[1] + height - radius]
                                node.x = Math.max(bound_x[0], Math.min(bound_x[1], node.x))
                                node.y = Math.max(bound_y[0], Math.min(bound_y[1], node.y))
                                if(node.dotted) {
                                    node.y = bound_y[0] + radius
                                }
                            })
                        }
                        self.updateNodes(true, clicked_outlet, scale_ratio, false)
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
                    .on("end", function() {
                        self.addEdges(d3.selectAll("g.node"))
                    })
            
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
            const animate_duration = 1000
            const outer_ring = 
                ((node.select("g.outer_ring").node())
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
                .duration(animate_duration)
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
                .duration(animate_duration)
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
                .duration(animate_duration)
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
        getRadiusBytext(label) {
            const target = d3.selectAll("text").filter(d => (d.outlet?d.outlet:d.text) == label)
            return parseFloat(d3.select(target.node().parentNode).attr("r"))
        },
        articlesToRadius(node, d, r=0) {
            return r>0?r:((r<0?r:1)*d3.select(node).select("text").node().getComputedTextLength()/1.5 + (d.dotted?5:(d.articles?this.normalizedLength(d.articles.length):this.centerNodeRadius())));
        },
        centerNodeRadius() {
            return this.normalizedLength(this.total_articles)/6
        },
        normalizedLength(length) {
            return ((length - this.min_articles)/(this.max_articles+1)) * 60 + 10 
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