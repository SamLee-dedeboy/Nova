<script>
import * as d3 from "d3";
import Node from "./Node.vue"
import { nextTick } from 'vue'

export default {
    props: ['graph', 'graph_index', "id", "entity_graph", "cooccur_matrix"],
    components: {
        Node
    },
    computed: {
        total_articles() { return this.graph.nodes.filter(node => node.articles).reduce((sum, node) => sum + node.articles.length, 0) },
        center_node() {
            const center_node = this.graph.nodes.filter(node => node.isCenter)[0]
            center_node.pos_sent = this.graph.nodes.reduce((pos_sum, node) => pos_sum + (node.dotted? 0:node.pos_sent), 0)
            center_node.neg_sent = this.graph.nodes.reduce((neg_sum, node) => neg_sum + (node.dotted? 0:node.neg_sent), 0)
            center_node.neu_sent = this.graph.nodes.reduce((neu_sum, node) => neu_sum + (node.dotted? 0:node.neu_sent), 0)
            //console.log(center_node)
            return center_node
        },
        graph_links() {
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
        entity_links() {
            const links = []   
            this.entity_graph.forEach((node_a, index_a) => {
                this.entity_graph.forEach((node_b, index_b) => {
                    if(index_a != index_b) {
                        const edge = {
                            "source": index_a,
                            "target": index_b
                        }
                        links.push(edge)
                    }
                })
            })
            return links
        },
        outlet_set() { return this.graph.nodes.map(node => node.text) },
        graph_dict() {
            var graph_dict = Object.assign({}, ...this.graph.nodes.map((node) => ({[node.text]: node})));
            graph_dict[this.center_node.text] = this.center_node
            return graph_dict
        },
        canvas_width() { return parseInt(this.canvas.attr("viewBox").split(" ")[2]) },
        canvas_height() { return parseInt(this.canvas.attr("viewBox").split(" ")[3]) },
        // outlet
        minimum_outlet_radius() { return 50 },
        maximum_outlet_radius() { return 80 },
        outlet_article_num_list() { return this.graph.nodes.filter(node => !node.isCenter ).map(node => node.dotted? 0:node.articles.length) },
        outlet_avg_articles() { return this.article_num_list.reduce((sum, cur) => sum + cur, 0) / this.article_num_list.length },
        outlet_min_articles() { return Math.min(...this.outlet_article_num_list) },
        outlet_max_articles() { return Math.max(...this.outlet_article_num_list) },
        // entity articles
        minimum_entity_radius() { return 30 },
        maximum_entity_radius() { return 50 },
        entity_article_num_list() { return this.entity_graph.map(node => node.articles.length)  },
        entity_min_articles() { return Math.min(...this.entity_article_num_list) },
        entity_max_articles() { return Math.max(...this.entity_article_num_list) },
        // entity cooccurr freqs
        max_entity_cooccurr() { 
            var max = 0
            for(const [entity_1, cooccurrs] of Object.entries(this.cooccur_matrix)) {
                const max_of_entity_1 = Math.max(...Object.keys(cooccurrs).map(entity_2 => cooccurrs[entity_2]))
                max = Math.max(max, max_of_entity_1)
            }
            return  max
        }
    },
    data() {
        return {
            nodeClicked: false
        }
    },
    watch: {
        graph: async function(new_graph, old_graph) {
            this.updateCenterNode()
            this.updateNodes()
            const center = [this.canvas_width/2, this.canvas_height/2]
            const data = new_graph.nodes.map(node => {
                if(node.isCenter) {
                    node.fx = center[0]
                    node.fy = center[1]
                }
                return node
            })
            this.force_layout(d3.selectAll("g.node.outlet"), [0, 0, this.canvas_width, this.canvas_height], center, 1, data)
            if(this.clickedNodeData && new_graph.nodes.length > old_graph.nodes.length)
                this.handleNodeClick(undefined, this.clickedNodeData)
        },
        entity_graph: function(new_entity_graph, old_entity_graph) {
            var self = this
            const selected_node = this.clickedNode
            const center = [selected_node.attr("cx"), selected_node.attr("cy")]
            const r = selected_node.attr("r")
            const entity_nodes = selected_node.selectAll("g.subnode.entity").data(new_entity_graph, (d) => (d.text))
            .join(
                enter => {
                    const node = enter.append("g")
                    .attr("class", "subnode entity")
                    .attr("cx", center[0])
                    .attr("cy", center[1])
                    self.applyNodeStyling(node, "subnode", "entity", undefined, "enter entity")
                }
            )
            var simulation = d3.forceSimulation(new_entity_graph)
                .alphaMin(0.1)
                .velocityDecay(0.6) 
                // .force("x", d3.forceX().x(center[0]))
                // .force("y", d3.forceY().y(center[1]))
                .force("center", d3.forceCenter(center[0], center[1]).strength(0.1))
                .force("charge", d3.forceManyBody().strength(-180))
                .force("link", d3.forceLink(self.entity_links).strength(function(d) {
                    const entity_1 = d.source.text
                    const entity_2 = d.target.text
                    const freq = self.cooccur_matrix[entity_1][entity_2] || 0
                    const min = 0.00001
                    const max = 0.0001
                    return (max-min)*(freq/self.max_entity_cooccurr) + min
                }))
                .force('collision', d3.forceCollide().iterations(50).radius(d => {
                    const r = self.getRadiusBytext(d.text)
                    return r
                }))
                .on('tick', function() {
                    d3.selectAll("g.subnode.entity")
                    .data(new_entity_graph, (d) => (d.text))
                    .join(
                        enter => {
                            const node = enter.append("g")
                            .attr("class", "subnode entity")
                            .attr("cx", d => d.x)
                            .attr("cy", d => d.y)
                            self.applyNodeStyling(node, "subnode", "entity", undefined, "enter entity")
                            self.add_entity_edges(new_entity_graph, selected_node)
                            // node.append("circle")
                            // .attr("class", "subnode entity")
                            // .attr("cx", d => d.x)
                            // .attr("cy", d => d.y)
                            // node.append("text")
                            // .attr("class", "text entity")
                            // .attr("x", d => d.x)
                            // .attr("y", d => d.y)
                            // .text((d) => (d.text))
                        },
                        update => {
                            var node = d3.selectAll("g.subnode.entity")
                            node.attr("cx", function(d) {   return d.x; })
                            .attr("cy", function(d) { return d.y; })
                            self.applyNodeStyling(node, "subnode", "entity", undefined, "update entity")
                            self.add_entity_edges(new_entity_graph, selected_node)
                            // update.selectAll("circle.subnode.entity")
                            // .attr("cx", d => d.x)
                            // .attr("cy", d => d.y)
                            // update.selectAll("text.entity")
                            // .attr("x", d => d.x)
                            // .attr("y", d => d.y)
                        }
                    )
                })
                .on("end", function() {
                    // self.add_entity_edges(d3.selectAll("g.subnode.entity"))
                })
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
        // tooltip
        this.tooltip = d3.select(".graphContainer").append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("pointer-events", "none")
        .html("tooltip")
        // this.tooltip = this.tooltipContainer.append("text")
        // .style("opacity", 0)
        // .attr("class", "tooltip")
        // .attr("text-anchor", "middle")
        // .attr("font-size","small")
        // .attr("dominant-baseline", "central")
        // .text("tooltip")
        this.updateCenterNode()
        this.updateNodes()
        const width = this.canvas_width
        const height = this.canvas_height
        const center = [this.canvas_width/2, this.canvas_height/2]
        const data = this.graph.nodes.map(node => {
            if(node.isCenter) {
                node.fx = center[0]
                node.fy = center[1]
            }
            return node
        })
        this.force_layout(d3.selectAll("g.node.outlet"), [0, 0, width, height], center, 1, data)
        //this.updateEdges()
    },

    methods: {
        // TODO
        handleNodeClick(e, d) {
            this.nodeClicked = true
            var self = this
            var svg = this.canvas
            const width = parseInt(this.canvas.attr("viewBox").split(" ")[2])
            const height = parseInt(this.canvas.attr("viewBox").split(" ")[3])

            // clicked node
            const expanded_r = 0.49*height
            //const expanded_r = 0.2*height
            const clickedNode = d3.selectAll("g.node.outlet").filter(node => node.text == d.text)
            clickedNode.select("g.outer_ring.node").remove()
            svg.selectAll("line.edge.outlet").filter(line => d3.select(line).data()[0].text == clickedNode.data()[0].text).remove()
            
            clickedNode.selectAll("circle.expand.node").style("filter", "brightness(100%)")

            const clicked_center = [width/2, height/2]
            // animate clicked node
            self.animating_click = true
            // move text
            clickedNode.selectAll("text.node").transition().duration(1000)
                .attr("x", clicked_center[0])
                .attr("y", clicked_center[1])
                // move circles
            const circles = clickedNode.selectAll("circle.node")
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
                self.applyNodeStyling(clickedNode,  "node", "outlet", expanded_r, "on click")
                self.addEdges(d3.selectAll("g.node.outlet"))
                self.animating_click = false
                self.clickedNode = clickedNode
                self.$emit("node-clicked", d)
                self.clickedNodeData = d
            })
            
            const clicked_node_sentiment = clickedNode.data()[0].sentiment
            //other nodes
            const shrink_ratio = 0.45
            const origin_x = {"pos": 0, "neg": 600, "neu": 0}[clicked_node_sentiment]
            const origin_y = 0
            const shrinked_width = 180
            const shrinked_height = 120
            const center_x = origin_x + shrinked_width/2
            const center_y = origin_y + shrinked_height/2
            const otherNodes = d3.selectAll("g.node.outlet").filter((d) => d.text != clickedNode.data()[0].text)                
            //self.moveNodesToCorner(otherNodes, [200, 150], [600, 0], [center_x, center_y], shrink_ratio)
            const center = [center_x, center_y]
            const data = this.graph.nodes.map(node => {
                if(node.isCenter) {
                    node.fx = center[0]
                    node.fy = center[1]
                }
                return node
            })

            self.force_layout(otherNodes, [origin_x, origin_y, shrinked_width, shrinked_height], center, shrink_ratio, data, clickedNode.data()[0].text)

            // draw bounding box for dev
            // svg.append("rect")
            // .attr("x", origin_x) 
            // .attr("y", origin_y)
            // .attr("width", shrinked_width)
            // .attr("height", shrinked_height)
            // .attr("fill", "none")
            // .attr("stroke-width", 5)
            // .attr("stroke", "black")



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
                const new_x = outletToPosDict[elementData.text][0]
                const new_y = outletToPosDict[elementData.text][1]
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
                return outletToPosDict[elementData.text][0]
                
            })
            .attr("cy", function(d) {
                const element = d3.select(this)
                const elementData = element.data()[0]
                return outletToPosDict[elementData.text][1] 
            })
            .on("end", callback)
        },
        updateCenterNode(pos_moved=false) {
            var svg = this.canvas
            var self = this
            const center_node = svg.selectAll("g.node.center")
            .data([this.center_node], function(d) { return d.text; })
            .join(
                enter => {
                    var node = enter.append("g")
                    .attr("class", "node center")
                    .attr("cx", self.canvas_width/2) 
                    .attr("cy", self.canvas_height/2)
                    self.applyNodeStyling(node, "node", "center", undefined, "enter center")
                },
                update => {
                    var node = svg.selectAll("g.node.center")
                    if(pos_moved) {
                        node.attr("cx", function(d) { return d.x; })
                        .attr("cy", function(d) { return d.y; })
                    }
                    self.applyNodeStyling(node, "node",  "center", undefined, "update center")
                }
            )
            
        },
        updateNodes(pos_moved=false, clicked_outlet=null, scale_ratio = 1, add_edges=false) {
            var svg = this.canvas

            var self = this
            const nodes = svg.selectAll("g.node.outlet").filter(node => node.text != clicked_outlet)

            const filtered_nodes = this.graph.nodes.filter(node => !node.isCenter && node.text != clicked_outlet)
            // create g for outlet nodes and bind data
            nodes.data(filtered_nodes, function(d) { return d.text })
            .join(
                enter => {
                    var node = enter.append("g")
                    .attr("class", "node outlet")
                    .attr("cx", self.canvas_width/2)
                    .attr("cy", self.canvas_height/2)
                    self.applyNodeStyling(node, "node", "outlet", undefined, "enter node")
                },
                update => {
                    var node = svg.selectAll("g.node.outlet").filter(node => node.text != clicked_outlet)
                    if(pos_moved) {
                        node.attr("cx", function(d) {   return d.x; })
                        .attr("cy", function(d) { return d.y; })
                    }
                    self.applyNodeStyling(node, "node", "outlet", undefined, "update node")
                    //self.addEdges(update)
                },
                exit => {
                    const duration = 1000
                    exit.selectAll("node.circle")
                    .transition()
                    .duration(duration)
                    .attr("r", 0)
                    .remove()
                    exit.selectAll("text.node")
                    .transition()
                    .duration(duration)
                    .attr("font-size", "0em")
                    .remove()
                    
                    exit.transition().delay(duration).remove()
                    .on("end", function(d) { self.addEdges(d3.selectAll("g.node.outlet")) })
                }
            )
            if(add_edges) this.addEdges(svg.selectAll("g.node.outlet"))

            svg.selectAll("g.node")
            .style("cursor", "pointer")
            .on("mousemove", function(e) {
                const node_data = d3.select(this).data()[0]
                const tooltipText = 
                "outlet: " + (node_data.text) + "<br>" +
                "positive: " + parseFloat(node_data.pos_sent).toFixed(2) + "<br>" + 
                "negative: " + parseFloat(node_data.neg_sent).toFixed(2) + "<br>" +
                "neutral: " +  parseFloat(node_data.neu_sent).toFixed(2 )+ "<br>" +
                "#articles: " + (node_data.articles?.length || self.total_articles) + "<br>" 

                self.tooltip.html(tooltipText)
                .style("left", e.offsetX + 15 + "px")
                .style("top", e.offsetY - 5 + "px")
            })
            .on("mouseover", function(d) {
                if(self.animating_click) return
                self.ite+=1
                
                const container = d3.select(this)
                container.select("circle.expand_node_outlet")
                .transition()
                .duration(100)
                .attr("r", function(d) { return parseFloat(container.select("circle.node_outlet").attr("r")) + 10;})
                
                container.selectAll("circle.expand_node_outlet")
                .style("filter", "brightness(90%)")

                self.tooltip.style("opacity", 1)
            })
            .on("mouseout", function(d) {
                if(self.animating_click) return

                const container = d3.select(this)
                container.select("circle.expand_node_outlet")
                .transition()
                .duration(100)
                .attr("r", function(d) { return parseFloat(container.select("circle.node_outlet").attr("r"));})

                container.selectAll("circle.expand_node_outlet")
                .style("filter", "brightness(100%)")

                self.tooltip.style("opacity", 0)
            })
            svg.selectAll("g.node.outlet").on("click", this.handleNodeClick)

          
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
                   outletToPosDict[eleSelection.data()[0].text] = [parseFloat(eleSelection.attr("cx"))*ratio[0]+new_origin[0],parseFloat( eleSelection.attr("cy"))*ratio[1]+new_origin[1]]
                })
            })
            // update data
            nodes.data().forEach(node => {
                node.x = outletToPosDict[node.text][0]
                node.y = outletToPosDict[node.text][1]
            })
            this.graph.center_node.x = new_center[0]
            this.graph.center_node.y = new_center[1]

            // move the svgs
            this.translateAndScale(nodes, outletToPosDict, scale_ratio)
            const center_node = d3.select("g.node.center")    
            const center_node_pos = {}
            center_node_pos[center_node.data()[0].text] = new_center
            this.translateAndScale(center_node, center_node_pos, scale_ratio)
        },
        force_layout(nodes, boundingBox, center, scale_ratio, data, clicked_outlet=null) {
            const origin = [boundingBox[0], boundingBox[1]]
            const width = boundingBox[2]
            const height = boundingBox[3]
            var self = this
            var tick_num = 0
            const x_center = {"pos": center[0] + width/3, "neg": center[0] - width/3, "neu": center[0]}
            const y_center = {"pos": center[1], "neg": center[1], "neu": 0}
            var simulation = d3.forceSimulation(data)
                .alphaMin(0.1)
                .velocityDecay(0.6) 
                .force("x", d3.forceX().x(function(d) {
                    // console.log(d.dotted?center[0]:(x_center[d.sentiment]))
                    const factor = 8
                    return d.dotted?center[0]:(x_center[d.sentiment]+Math.random()*(width/factor+width/factor)-width/factor)
                    // return d.dotted?center[0]:((d.sentiment > 0)? center[0]+width/3: center[0]-width/3)
                }).strength(0.1))
                .force("y", d3.forceY().y(function(d) {
                    const factor = 8
                    return d.dotted?0:(y_center[d.sentiment]+Math.random()*(height/factor+height/factor)-height/factor ) 
                }).strength(0.1))
                .force("center", d3.forceCenter(center[0], center[1]).strength(0.001))
                .force("charge", d3.forceManyBody().strength(-10))
                .force("link", d3.forceLink(self.graph_links).strength(0.0001))
                .force('collision', d3.forceCollide().iterations(50).radius(d => {
                    const r = self.getRadiusBytext(d.text)*scale_ratio
                    return r
                }))
                .on('tick', function() {
                    tick_num += 1
                    const reigon_height = 100
                    this.nodes().forEach(node => {
                        if((node.x < center[0] + width/5) && (node.x > center[0] - width/5)) { 
                            if(node.y > center[1]-reigon_height && node.y < center[1]) node.y += 3*reigon_height
                        }
                    })
                    // const center_node = this.nodes().filter(node => node.isCenter)[0]
                    // center_node.fx = center[0]
                    // center_node.fy = center[1]
                    if(true || tick_num > 95) {
                        this.nodes().forEach(node => {
                            const radius = self.getRadiusBytext(node.text)*scale_ratio 
                            const bound_x = [origin[0] + radius, origin[0] + width - radius]
                            const bound_y = [origin[1] + radius, origin[1] + height - radius]
                            node.x = Math.max(bound_x[0], Math.min(bound_x[1], node.x))
                            node.y = Math.max(bound_y[0], Math.min(bound_y[1], node.y))
                            if(node.dotted) {
                                node.y = bound_y[0] + radius
                            }
                        })
                    }
                    self.updateNodes(true, clicked_outlet, scale_ratio, true)
                    self.updateCenterNode(true, scale_ratio)
                    nodes.attr("transform-origin", function(d) {
                        const container = d3.select(this)
                        return (container.attr("cx") || container.attr("x")) + " " + (container.attr("cy") || container.attr("y"))
                    }).attr("transform", () => "scale(" + scale_ratio + ")")
                    d3.select("g.node.center").attr("transform-origin", function(d) {
                        const container = d3.select(this)
                        return (container.attr("cx") || container.attr("x")) + " " + (container.attr("cy") || container.attr("y"))
                    }).attr("transform", () => "scale(" + scale_ratio + ")")
                })
                .on("end", function() {
                    // self.addEdges(d3.selectAll("g.node.outlet"))
                })
            
        },
        
        applyNodeStyling(node, node_level, class_name,r=0, msg="???") {
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
            ( node.selectAll(`circle.${node_level}_${class_name}`).node()
            ? node.selectAll(`circle.${node_level}_${class_name}`)
            : node.append("circle").attr("class",`${node_level}_${class_name}`))
            innerCircle.attr("cx", function(d) { return d3.select(this.parentNode).attr('cx') })
                .attr("cy", function(d) { return d3.select(this.parentNode).attr('cy') })
                .attr("opacity", 0)
                .attr("stroke-dasharray", function(d) { return d.dotted? 2.5 : 0})

            // add label
            const nodeText = 
            ( node.selectAll(`text.${node_level}_${class_name}`).node()
            ? node.selectAll(`text.${node_level}_${class_name}`)
            : node.append("text").attr("class", `${node_level}_${class_name}`))
            nodeText.attr("x", function(d) { return d3.select(this.parentNode).attr("cx"); })
                .attr("y", function(d) { return d3.select(this.parentNode).attr("cy"); })
                .each(function(d) {
                    if(node_level === "node" && class_name === "outlet") {
                        d3.select(this).text(d => self.abbr_dict[d.text])
                    } else {
                        const break_text = d.text.split('_')
                        const break_num = break_text.length
                        var node_text = d3.select(this)
                        node_text.selectAll("tspan")
                        .data(break_text)
                        .join("tspan")
                        .text(d => d)
                        .attr("x", node_text.attr("x"))
                        .attr("dy", () => (node_level === "node" ? "1.4em":"1.4em"))
                        node_text.attr("y", function(d) { return d3.select(this).attr("y") - (node_level === "node"? 18:14)*(1+(break_num-1)/2)})
                    }
                })
                .attr("text-anchor", "middle")
                .attr("font-size", () => (node_level === "node" ? "0.8em":"0.6em"))
                .attr("dominant-baseline", "central")
                .style("display:block")
                // .text(d => self.abbr_dict[d.outlet] || d.text)
            // var textLength = nodeText.node().getComputedTextLength()
            // var text = nodeText.text()
            // const maxLength = 80
            // while(textLength > maxLength && text.length > 0) {
            //     text = text.slice(0, -1)
            //     nodeText.text(text + "...")
            //     textLength = nodeText.node().getComputedTextLength()
            // }
            //set size and styling according to label width
            //node.selectAll("circle." + class_name)
                //.attr("r", function(d){  return d3.select(this.parentNode).select("text").node().getComputedTextLength()/1.5 + d.dotted?0:d.articles.length; })
            node.attr("r", function(d) { 
                return self.articlesToRadius(node_level, d, r)
            })
            //return 

            node.selectAll(`circle.${node_level}_${class_name}`)
                .attr("r", function(d) { 
                    return d3.select(this.parentNode).attr("r")
                })
            // append outer circle for expand animation
            const outer_circle = 
            ( node.selectAll(`circle.expand_${node_level}_${class_name}`).node()
            ? node.selectAll(`circle.expand_${node_level}_${class_name}`)
            : node.append("circle").attr("class", `expand_${node_level}_${class_name}`))
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
            // ( node.selectAll(`g.outer_ring`).node()
            // ? node.selectAll(`g.outer_ring`)
            // : node.append("g").attr("class", `outer_ring`))
            ( node.selectAll(`g.outer_ring_${node_level}_${class_name}`).node()
            ? node.selectAll(`g.outer_ring_${node_level}_${class_name}`) 
            : node.append("g").attr("class", `outer_ring_${node_level}_${class_name}`))

            // positive ring
            const pos_ring = 
            ( outer_ring.select(`path.pos_${node_level}_${class_name}`).node()
            ? outer_ring.select(`path.pos_${node_level}_${class_name}`)
            : outer_ring.append("path").attr("class", `pos_${node_level}_${class_name}`))
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
            ( outer_ring.select(`path.neg_${node_level}_${class_name}`).node()
            ? outer_ring.select(`path.neg_${node_level}_${class_name}`)
            : outer_ring.append("path").attr("class", `neg_${node_level}_${class_name}`))
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
            const neu_ring = 
            ( outer_ring.select(`path.neu_${node_level}_${class_name}`).node()
            ? outer_ring.select(`path.neu_${node_level}_${class_name}`)
            : outer_ring.append("path").attr("class", `neu_${node_level}_${class_name}`))
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
        addEdges(node, class_name) {
            if(node.empty()) return
            // edges
            var svg = this.canvas
            // bind edges to node circles, so that edges can bind to circle center
            var center_node = svg.select("g.node.center")

            const edge_color = {"pos": "blue", "neg": "red", "neu": "grey" }
            var edges = svg.selectAll("line.edge.outlet")
            .data(node, function(d) { return d.text})
            .join("line")
            .attr("class", "edge outlet")
            .attr("x1", function(d) { return d3.select(d).attr("cx");})
            .attr("x2", function(d) { return parseInt(center_node.attr("cx")); })
            .attr("y1", function(d) { return d3.select(d).attr("cy")})
            .attr("y2", function(d) { return parseInt(center_node.attr("cy")); })
            .attr("stroke", function(d) { return d3.select(d).data()[0].dotted?"black":(edge_color[d3.select(d).data()[0].sentiment])})
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
        add_entity_edges(entity_graph, clickedNode) {
            var self = this
            const edges = clickedNode.selectAll("line.edge.entity")
            .data(this.entity_links, (d) => (`${d.source.text}-${d.target.text}`))
            edges.enter().append("line").attr("class", "edge entity")
                .merge(edges)
                .attr("x1", function(d) { return d.source.x; })
                .attr("x2", function(d) { return d.target.x; }) 
                .attr("y1", function(d) { return d.source.y; })
                .attr("y2", function(d) { return d.target.y; })
                .attr("stroke", "black") 
                .attr("stroke-width", function(d) {
                    const entity_1 = d.source.text
                    const entity_2 = d.target.text
                    const freq = self.cooccur_matrix[entity_1][entity_2] || 0
                    const min_width = 5
                    const max_width = 30
                    return (max_width-min_width)*(freq/self.max_entity_cooccurr) + min_width  
                })
                .style("stroke-opacity", function(d) {
                    const entity_1 = d.source.text
                    const entity_2 = d.target.text
                    const freq = self.cooccur_matrix[entity_1][entity_2]
                    const min_opacity = 0 
                    const max_opacity = 1 
                    return (max_opacity-min_opacity)*(freq/self.max_entity_cooccurr) + min_opacity  

                })
                .style("stroke-linecap","round")
               
                // enter => {

                //     enter.append("line")
                //     .attr("class", "edge entity")
                //     .attr("x1", function(d) { return entity_graph[d.source].x; })
                //     .attr("x2", function(d) { return entity_graph[d.target].x; }) 
                //     .attr("y1", function(d) { return entity_graph[d.source].y; })
                //     .attr("y2", function(d) { return entity_graph[d.target].y; })
                //     .attr("stroke", "black") 
                // }, 
                // update => {
                //     update
                //     .attr("x1", function(d) { return entity_graph[d.source].x; })
                //     .attr("x2", function(d) { return entity_graph[d.target].x; }) 
                //     .attr("y1", function(d) { return entity_graph[d.source].y; })
                //     .attr("y2", function(d) { return entity_graph[d.target].y; })
                //     .attr("stroke", "black") 
                // }
            // ) 
            clickedNode.selectAll("g.subnode.entity").raise()
        },
        getArticleNumByOutlet(outlet) {
            const node = this.graph.nodes.filter(node => node.text == outlet)
            if(!node) return 0;
            return node[0].articles.length
        },
        getRadiusBytext(label) {
            const target = d3.selectAll("g.node,g.subnode").filter(d => d.text == label)
            return parseFloat(target.attr("r"))
        },
        articlesToRadius(node_level, d, r=0) {
            return r>0?r:(d.dotted?this.minimum_radius:(d.articles?this.normalizedLength(d.articles.length, node_level):this.centerNodeRadius(node_level)));

            // return r>0?r:((r<0?r:1)*d3.select(node).select("text.node_text").node().getComputedTextLength()/1.5 + (d.dotted?5:(d.articles?this.normalizedLength(d.articles.length):this.centerNodeRadius())));
        },
        centerNodeRadius(node_level) {
            return this.normalizedLength(this.total_articles/6, node_level)
        },
        normalizedLength(num_articles, node_level) {
            const articles_ratio = 
            (node_level === "node"
            ? (num_articles - this.outlet_min_articles)/(this.outlet_max_articles+1) 
            : (num_articles - this.entity_min_articles)/(this.entity_max_articles+1))

            const min = (node_level === "node" ? this.minimum_outlet_radius : this.minimum_entity_radius)
            const max = (node_level === "node" ? this.minimum_outlet_radius : this.minimum_entity_radius)
            return articles_ratio*(max-min) + min
        }
    }
}




</script>
<template>
<div class="graphContainer">
    <svg  class="graph" viewBox="0 0 800 600" :id="id">
        
    </svg>
</div>
</template>

<style scoped>
/* .class {
    width: 100%;
    height: 100%;
} */
.graph {
   display: inline-block; 
}
.graphContainer {
    overflow: auto
}
</style>