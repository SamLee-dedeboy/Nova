<script setup lang="ts">
import * as d3 from "d3";
import Node from "./Node.vue"
import OpacityController from "./OpacityController.vue";
import Tooltip from "./Tooltip.vue";
import Legend from './Legend.vue'
import InputSwitch from 'primevue/inputswitch';
import InfoButtonVue from "./InfoButton.vue";
import NodeInfo from "./NodeInfo.vue";

import { defineComponent, nextTick , PropType} from 'vue'
import { OutletNode, OutletEdge } from '../types'
import { edgeRotation,
         applyEntityEdgeSelectedStyle, 
         addEdges,
        } from './EdgeUtils'
import { applyEntityNodeSelectedStyle,
         applyEntityNodeClickedStyle,
         applyNodeStyling,
         articlesToRadius,
       } from './NodeUtils'
import * as SstColors from "./ColorUtils"

const props = defineProps({
    graph: { 
        type: Object as () => {
            nodes: OutletNode[], 
        }
    },
    graph_index: Number,
    id: String,
    entity_graph: Array as PropType<Array<Node>>,
    cooccur_matrix: {
        type: Object as () => {
            [id1: string] : { [id2: string]: number }
        }
    },
})
</script>
<script lang="ts">
export default defineComponent({
    computed: {
        hovered_node_info() {
            const node = this.hovered_node
            if(!node) return undefined
            return {
                text: node.text,
                pos_articles: node.pos_articles,
                neg_articles: node.neg_articles,
                neu_articles: node.neu_articles,
                pos_score: node.pos_sent,
                neg_score: node.neg_sent,
                neu_score: node.neu_sent,
            }
        },
        total_articles() { return this.graph.nodes.filter(node => node.articles).reduce((sum, node) => sum + node.articles.length, 0) },
        center_node() { return this.graph.nodes.filter(node => node.isCenter)[0] },
        graph_links() {
            const center_node_index = this.graph.nodes.findIndex(node => node.isCenter) 
            const links: OutletEdge[] = []
            this.graph.nodes.forEach((node, index) => {
                if(index != center_node_index) {
                    const edge: OutletEdge = {
                        source: index,
                        target: center_node_index
                    } 
                    links.push(edge)
                }
            })
            return links
        },
        entity_links() {
            const links: OutletEdge[] = []   
            this.entity_graph.forEach((node_a, index_a) => {
                this.entity_graph.forEach((node_b, index_b) => {
                    if(index_a != index_b) {
                        const edge: OutletEdge = {
                            source: index_a,
                            target: index_b
                        } 
                        links.push(edge)
                    }
                })
            })
            return links
        },
        undirected_entity_links() {
            const links: OutletEdge[] = []   
            this.entity_graph.forEach((node_a, index_a) => {
                this.entity_graph.forEach((node_b, index_b) => {
                    if(index_a < index_b) {
                        const edge: OutletEdge = {
                            source: index_a,
                            target: index_b
                        } 
                        links.push(edge)
                    }
                })
            })
            return links

        },
        outlet_set() { return this.graph.nodes.map(node => node.text) },
        canvas_width() { return parseInt(this.canvas.attr("viewBox").split(" ")[2]) },
        canvas_height() { return parseInt(this.canvas.attr("viewBox").split(" ")[3]) },
        // outlet
        outlet_article_num_list() { return this.graph.nodes.filter(node => !node.isCenter ).map(node => node.dotted? 0:node.articles.length) },
        outlet_avg_articles() { return this.article_num_list.reduce((sum, cur) => sum + cur, 0) / this.article_num_list.length },
        outlet_min_articles() { return Math.min(...this.outlet_article_num_list) },
        outlet_max_articles() { return Math.max(...this.outlet_article_num_list) },
        // entity articles
        entity_article_num_list() { return this.entity_graph.map(node => node.articles.length)  },
        entity_min_articles() { return Math.min(...this.entity_article_num_list) },
        entity_max_articles() { return Math.max(...this.entity_article_num_list) },
        // entity cooccurr freqs
        min_entity_cooccurr() { 
            var min = 0
            for(const entity_1 in this.cooccur_matrix) {
                const cooccurrs = this.cooccur_matrix[entity_1]
                const min_of_entity_1 = Math.min(...Object.keys(cooccurrs).map(entity_2 => cooccurrs[entity_2]))
                min = Math.min(min, min_of_entity_1)
            }   
            return  min
        },
        max_entity_cooccurr() { 
            var max = 0
            for(const entity_1 in this.cooccur_matrix) {
                const cooccurrs = this.cooccur_matrix[entity_1]
                const max_of_entity_1 = Math.max(...Object.keys(cooccurrs).filter(entity_2 => entity_2 != entity_1).map(entity_2 => cooccurrs[entity_2]))
                max = Math.max(max, max_of_entity_1)
            }   
            return  max
        },
        mean_entity_cooccurr() {
            var sum = 0
            var count = 0 
            for(const entity_1 in this.cooccur_matrix) {
                const cooccurrs = this.cooccur_matrix[entity_1]
                for(const entity_2 in cooccurrs) {
                    const freq = cooccurrs[entity_1]
                    sum += freq
                    count += 1
                }
            }
            return sum/count
        },
        std_entity_cooccurr() {
            var sum = 0
            var count = 0
            for(const entity_1 in this.cooccur_matrix) {
                const cooccurrs = this.cooccur_matrix[entity_1]
                for(const entity_2 in cooccurrs) {
                    const freq = cooccurrs[entity_2]
                    sum += Math.pow(freq - this.mean_entity_cooccurr, 2)
                    count += 1
                }
            }
            return Math.sqrt(sum)/count
        },
    },
    data() {
        return {
            nodeClicked: false,
            opacityThreshold: 0,
            useOutletImage: true,
            tooltip_content: "",
            selected_entities: [],
            brightness: 0,
            selected_entity_edge: undefined,
            hovered_node: undefined,
        }
    },
    watch: {
        useOutletImage(new_value: Boolean, old_value: Boolean) {
            const nodes = d3.selectAll("g.node.outlet")
            if(old_value === true) nodes.selectAll("image").remove()
            applyNodeStyling(nodes, "node", "outlet", undefined, new_value, this.total_articles, this.outlet_min_articles, this.outlet_max_articles, "update node label")
        },

        opacityThreshold(new_value: Number, old_value: Number) {
            if(!this.nodeClicked) return 
            var self = this
            d3.selectAll("g.edge_group").selectAll("line")
            .each(function(d) {
                d3.select(this).style("stroke-opacity", function(d) {
                    const entity_1 = self.entity_graph[d.source].text
                    const entity_2 = self.entity_graph[d.target].text
                    const freq = self.cooccur_matrix[entity_1][entity_2]
                    const min_opacity = 0.1
                    const max_opacity = 0.9
                    const powerScale = d3.scalePow().exponent(1.8)
                        .domain([self.min_entity_cooccurr, self.max_entity_cooccurr])
                        .range([min_opacity, max_opacity])

                    const opacity = (powerScale(freq) > self.opacityThreshold)?powerScale(freq):0
                    if(opacity == 0) { d3.select(this.parentNode).style("pointer-events", "none") }
                    else { d3.select(this.parentNode).style("pointer-events", undefined)}
                    return opacity

                })
            })
        },

        graph: function(new_graph, old_graph) {
            if(this.clickedNode) {
                this.clickedNode.selectAll("g.subnode, g.edge_group").remove()
                this.clickedNode = undefined
            }
            this.updateOutletGraph()
            // if(this.clickedNodeData && new_graph.nodes.length > old_graph.nodes.length)
            //     this.handleNodeClick(undefined, this.clickedNodeData)
        },

        entity_graph: function(new_entity_graph, old_entity_graph) {
            this.updateEntityGraph()
        }
    },

    mounted() {
        this.canvas = d3.select("#graph-" + this.graph_index)
        this.animating_click = false
        // handle canvas clicked
        this.canvas.on("click", () => {
            if(this.animating_click) return
            if(this.clickedNode) {
                this.clickedNode.selectAll("g.subnode, g.edge_group").remove()
                this.updateOutletGraph()
                this.clickedNode = undefined
                this.nodeClicked = false
            }
        })
        // tooltip
        // this.tooltip = d3.select("div.tooltip").style("scale", 0)
        this.hovered_node = this.graph.nodes[0]
        this.tooltip = d3.select("table.node-info").style("scale", 0)
        
        // create gradient for entity graph
        var svg = this.canvas
        const steps = 11
        const interpolation = [...Array(steps).keys()].map(p => p/(steps-1))
        // neg-pos
        const gradient_neg2pos = svg.append("defs").append("linearGradient")
        gradient_neg2pos.attr("id", "neg-pos") 
        interpolation.forEach(step_percentage => {
            gradient_neg2pos.append('stop')
            .attr("offset", `${step_percentage*100}%`)
            .attr("stop-color", () => ( SstColors.sst_range((step_percentage<0.5)? Math.min(step_percentage, 0.2):Math.max(step_percentage, 0.8)) ))
        })
        // neu to pos 
        const gradient_neu2pos = svg.append("defs").append("linearGradient")
        gradient_neu2pos.attr("id", "neu-pos") 
        interpolation.forEach(step_percentage => {
            gradient_neu2pos.append('stop')
            .attr("offset", `${step_percentage*100}%`)
            .attr("stop-color", () => ( SstColors.sst_range(Math.min(0.8+step_percentage/2, 1)) ))
        })
        // neg to neu
        const gradient_neg2neu = svg.append("defs").append("linearGradient")
        gradient_neg2neu.attr("id", "neg-neu") 
        interpolation.forEach(step_percentage => {
            gradient_neg2neu.append('stop')
            .attr("offset", `${step_percentage*100}%`)
            .attr("stop-color", () => ( SstColors.sst_range(Math.min(0+step_percentage/2, 0.2)) ))
        })
        this.updateOutletGraph()
    },

    methods: {
        updateEntityGraph() { 
            var self = this
            const selected_node = this.clickedNode
            const bounded_r = selected_node.attr("r")
            const center = [parseFloat(selected_node.attr("cx")), parseFloat(selected_node.attr("cy"))]
            const entity_nodes = selected_node.selectAll("g.subnode.entity").data(this.entity_graph, (d) => (d.text))
            .join(
                enter => {
                    const node = enter.append("g")
                    .attr("class", "subnode entity")
                    .attr("cx", center[0])
                    .attr("cy", center[1])
                    applyNodeStyling(node, "subnode", "entity", undefined, self.useOutletImage, self.total_articles, self.entity_min_articles, self.entity_max_articles, "enter entity")
                }
            )
            d3.selectAll("g.subnode.entity").selectAll("text.subnode_entity")
                .style("pointer-events", "none")
            d3.selectAll("g.subnode.entity")
            .style("cursor", "pointer")
            .on("mousemove", function(e) {
                const node_data = d3.select(this).data()[0]
                const tooltip_title = "entity"
                const tooltipText = 
                `${tooltip_title}: ${(node_data.text)} <br>` + 
                `#posArticle/score: ${node_data.pos_articles}/${parseFloat(node_data.pos_sent).toFixed(2)}  <br>` + 
                `#negArticle/score: ${node_data.neg_articles}/${parseFloat(node_data.neg_sent).toFixed(2)} <br>` +
                `#neuArticle/score: ${node_data.neu_articles}/(${parseFloat(node_data.neu_neg_sent).toFixed(2)},${parseFloat(node_data.neu_pos_sent).toFixed(2)}) <br>` +
                `#articles: ${(node_data.articles.length)} <br>` 

                self.tooltip_content = tooltipText
                self.tooltip
                .style("left", e.offsetX + 15 + "px")
                .style("top", e.offsetY - 5 + "px")
            })
            .on("mouseover", function(d) {
                if(self.animating_click) return
                self.tooltip.transition().duration(100).style("scale", 1)
                const container = d3.select(this)
                // container.select("circle.expand_subnode_entity")
                // .transition()
                // .duration(100)
                // .attr("r", function(d) { return parseFloat(container.select("circle.subnode_entity").attr("r")) + 10;})
                
                container.selectAll("circle.expand_subnode_entity")
                .style("filter", "brightness(90%)")
            })
            .on("mouseout", function(d) {
                if(self.animating_click) return
                self.tooltip.transition().duration(100).style("scale", 0)
                const container = d3.select(this)
                const entity_name = container.data()[0].text
                if(self.selected_entities.find(entity => entity == entity_name)) return
                
                container.selectAll("circle.expand_subnode_entity")
                .style("filter", "brightness(100%)")
            })
            .on("click", function(e, d) {
                e.stopPropagation() 
                if(self.animating_click) return
                const container = d3.select(this)
                const selected_entity = container.data()[0].text

                // clicking on an already selected node, should unselect it
                // and remove from selected list
                if(self.selected_entities.includes(selected_entity)) {
                    applyEntityNodeClickedStyle(container, false)
                    const index = self.selected_entities.indexOf(selected_entity);
                    if (index > -1) { self.selected_entities.splice(index, 1); }
                    return
                }
                // clicking on an unselected node
                applyEntityNodeClickedStyle(container, true)
                self.selected_entities.push(d.text)
                // can only select 2 nodes. remove the first node in list
                if(self.selected_entities.length > 2) {
                    const first_element = self.selected_entities[0]
                    const unselect_node = d3.selectAll("g.subnode.entity").filter(d => (d.text == first_element))
                    applyEntityNodeClickedStyle(unselect_node, false)
                    // update previous selected edge style
                    const entity_1 = CSS.escape(self.selected_entities[0])
                    const entity_2 = CSS.escape(self.selected_entities[1])
                    const edge_group = d3.select(`#${entity_1}-${entity_2},#${entity_2}-${entity_1}`)
                    applyEntityEdgeSelectedStyle(self.selected_entities, edge_group, false)
                    self.selected_entities.shift()
                }
                // highlight selected edge if two nodes are selected
                if(self.selected_entities.length == 2) {
                    const entity_1 = CSS.escape(self.selected_entities[0])
                    const entity_2 = CSS.escape(self.selected_entities[1])
                    const edge_group = d3.select(`#${entity_1}-${entity_2},#${entity_2}-${entity_1}`)
                    applyEntityEdgeSelectedStyle(self.selected_entities, edge_group, false)
                }
            })
            this.entity_graph.forEach(node => {
                node.x = center[0]
                node.y = center[1]
            })
            var simulation = d3.forceSimulation(this.entity_graph)
                .alphaMin(0.2)
                .velocityDecay(0.6) 
                // .force("x", d3.forceX().x(center[0]))
                // .force("y", d3.forceY().y(center[1]))
                .force("center", d3.forceCenter(center[0], center[1]).strength(0.1))
                .force("charge", d3.forceManyBody().strength(-120))
                .force("link", d3.forceLink(self.entity_links).strength(function(d) {
                    const entity_1 = d.source.text
                    const entity_2 = d.target.text
                    const freq = self.cooccur_matrix[entity_1][entity_2] || 0
                    var res = (freq - self.mean_entity_cooccurr)/self.std_entity_cooccurr
                    res = 1 / (1 + Math.exp(-res));
                    const min = 0.001
                    const max = 0.005
                    res = (max-min)*res + min
                    return res 
                }))
                .force('collision', d3.forceCollide().iterations(50).radius(d => {
                    const r = self.getRadiusBytext("subnode", d.text)
                    return r
                }))
                .on('tick', function() {
                    this.nodes().forEach(node => {
                        const distance = Math.sqrt(Math.pow(node.x-center[0], 2) + Math.pow(node.y-center[1], 2))
                        const r = bounded_r-self.getRadiusBytext("subnode", node.text) - 10
                        if(distance > r) {
                            node.x = (node.x-center[0])*r/distance + center[0]
                            node.y = (node.y-center[1])*r/distance + center[1]
                        }
                    })
                    d3.selectAll("g.subnode.entity")
                    .data(self.entity_graph, (d) => (d.text))
                    .join(
                        enter => {
                            const node = enter.append("g")
                            .attr("class", "subnode entity")
                            .attr('cx', function (d) { 
                                return d.x
                            })
                            .attr('cy', function (d) { 
                                return d.y
                            });
                            applyNodeStyling(node, "subnode", "entity", undefined,self.useOutletImage, self.total_articles, self.entity_min_articles, self.entity_max_articles,  "enter entity")
                            self.add_entity_edges(self.entity_graph, selected_node)
                        },
                        update => {
                            var node = d3.selectAll("g.subnode.entity")
                            .attr('cx', function (d) { 
                                return d.x
                            })
                            .attr('cy', function (d) { 
                                return d.y
                            });
                            applyNodeStyling(node, "subnode", "entity", undefined,self.useOutletImage, self.total_articles, self.entity_min_articles, self.entity_max_articles,  "update entity")
                            self.add_entity_edges(self.entity_graph, selected_node)
                        }
                    )
                })
                .on("end", function() {
                    self.animating_click=false
                })
        },

        updateOutletGraph() {
            this.updateCenterNode()
            this.updateNodes()
            const width = this.canvas_width - 100
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
        },

        handleNodeClick(e, d) {
            var self = this
            e.stopPropagation()
            if(this.animating_click) return
            if(this.clickedNode?.data()[0].text == d.text) {
                // in this case, clear all the selected subnodes
                const selected_nodes = d3.selectAll("g.subnode.entity").filter(d => this.selected_entities.includes(d.text))
                applyEntityNodeClickedStyle(selected_nodes, false)
                // if(this.selected_entities.length == 2) {
                //     const entity_1 = CSS.escape(self.selected_entities[0])
                //     const entity_2 = CSS.escape(self.selected_entities[1])
                //     const edge_group = d3.select(`#${entity_1}-${entity_2},#${entity_2}-${entity_1}`)
                //     this.applyEntityEdgeSelectedStyle(edge_group, false)
                // }
                this.selected_entities = []
                return
            }
            this.nodeClicked = true
            var self = this
            var svg = this.canvas
            const width = parseInt(this.canvas.attr("viewBox").split(" ")[2])
            const height = parseInt(this.canvas.attr("viewBox").split(" ")[3])
            // remove previous clicked nodes' subnodes
            if(this.clickedNode) {
                this.clickedNode.selectAll("g.subnode, g.edge_group").remove()
            }
            // animate clicked node
            this.animating_click = true
            // remove tooltip
            d3.selectAll("div.tooltip").style("scale", 0)
            // clicked node
            const expanded_r = 0.49*height
            const clickedNode = d3.selectAll("g.node.outlet").filter(node => node.text == d.text)
            this.clickedNode = clickedNode
            // remove sentiment rings
            clickedNode.select("g.outer_ring_node_outlet").remove()
            // remove edges
            svg.selectAll("line.edge.outlet").filter(line => d3.select(line).data()[0].text == clickedNode.data()[0].text).remove()
            // restore clicked node styling from hovering
            clickedNode.selectAll("circle.expand_node_outlet").style("filter", "brightness(100%)")
            // start animation
            const clicked_center = [width/2, height/2]
            // move text
            if(this.useOutletImage) {
                clickedNode.selectAll("image.label_node_outlet").transition().duration(1000)
                    .attr("x", function(d) { return clicked_center[0] - d3.select(this).attr("width")/2; })
                    .attr("y", clicked_center[1] - expanded_r + 30)
                    .attr("width", function(d) { return articlesToRadius("node", self.total_articles, self.outlet_min_articles, self.outlet_max_articles, d, 0) + 30})
                    .attr("height", function(d) { return articlesToRadius("node", self.total_articles, self.outlet_min_articles, self.outlet_max_articles, d, 0) + 30})
            } else {
                clickedNode.selectAll("text.node_outlet").transition().duration(1000)
                    .attr("x", clicked_center[0])
                    .attr("y", clicked_center[1] - expanded_r + 30)
            }
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
                applyNodeStyling(clickedNode,  "node", "outlet", expanded_r, self.useOutletImage, self.total_articles, self.outlet_min_articles, self.outlet_max_articles, "on click")
                addEdges(self.canvas, d3.selectAll("g.node.outlet"))
                self.animating_click = false
                self.$emit("node-clicked", d)
                self.clickedNodeData = d
            })
            // handle other nodes
            const clicked_node_sentiment = clickedNode.data()[0].sentiment
            // define shrunk variables
            const shrink_ratio = 0.45
            const origin_x = {"pos": 0, "neg": 600, "neu": 0}[clicked_node_sentiment]
            const origin_y = 0
            const shrinked_width = 180
            const shrinked_height = 120
            const center_x = origin_x + shrinked_width/2
            const center_y = origin_y + shrinked_height/2
            const otherNodes = d3.selectAll("g.node.outlet").filter((d) => d.text != clickedNode.data()[0].text)                
            // center nodes before starting force layout
            const center = [center_x, center_y]
            const data = this.graph.nodes.map(node => {
                if(node.isCenter) {
                    node.fx = center[0]
                    node.fy = center[1]
                }
                return node
            })
            self.force_layout(otherNodes, [origin_x, origin_y, shrinked_width, shrinked_height], center, shrink_ratio, data, clickedNode.data()[0].text)
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
                    applyNodeStyling(node, "node", "center", undefined,  self.useOutletImage, self.total_articles, self.outlet_min_articles, self.outlet_max_articles, "enter center")
                },
                update => {
                    var node = svg.selectAll("g.node.center")
                    if(pos_moved) {
                        node.attr("cx", function(d) { return d.x; })
                        .attr("cy", function(d) { return d.y; })
                    }
                    applyNodeStyling(node, "node",  "center", undefined,  self.useOutletImage, self.total_articles, self.outlet_min_articles, self.outlet_max_articles, "update center")
                }
            )
            
        },

        updateNodes(pos_moved=false, clicked_outlet=null, scale_ratio = 1, add_edges=false) {
            var svg = this.canvas
            var self = this
            const nodes = svg.selectAll("g.node.outlet").filter(node => node.text != clicked_outlet)
            // filter out clicked node and center node
            const filtered_nodes = this.graph.nodes.filter(node => !node.isCenter && node.text != clicked_outlet)
            // create g for outlet nodes and bind data
            nodes.data(filtered_nodes, function(d) { return d.text })
            .join(
                enter => {
                    var node = enter.append("g")
                    .attr("class", "node outlet")
                    .attr("cx", self.canvas_width/2)
                    .attr("cy", self.canvas_height/2)
                    applyNodeStyling(node, "node", "outlet", undefined,  self.useOutletImage, self.total_articles, self.outlet_min_articles, self.outlet_max_articles, "enter node")
                },
                update => {
                    var node = svg.selectAll("g.node.outlet").filter(node => node.text != clicked_outlet)
                    if(pos_moved) {
                        node.attr("cx", function(d) {   return d.x; })
                        .attr("cy", function(d) { return d.y; })
                    }
                    applyNodeStyling(node, "node", "outlet", undefined,  self.useOutletImage, self.total_articles, self.outlet_min_articles, self.outlet_max_articles, "update node")
                },
                exit => {
                    exit.remove()
                }
            )
            // add edges
            if(add_edges) addEdges(svg, svg.selectAll("g.node.outlet"))
            // remove text pointer events to prevent interfering with node mouse event
            svg.selectAll("g.node").selectAll("text.node_outlet,text.node_center")
                .style("pointer-events", "none")
            // add mouse events
            svg.selectAll("g.node")
            .style("cursor", "pointer")
            .on("mousemove", function(e) {
                if(self.nodeClicked) return
                // update tooltip (if node changes)
                const node_data = d3.select(this).data()[0]
                const tooltip_title = node_data.isCenter? "entity":"outlet"
                const tooltipText = 
                `${tooltip_title}: ${(node_data.text)} <br>` + 
                `#posArticle/score: ${node_data.pos_articles}/${parseFloat(node_data.pos_sent).toFixed(2)}  <br>` + 
                `#negArticle/score: ${node_data.neg_articles}/${parseFloat(node_data.neg_sent).toFixed(2)} <br>` +
                `#neuArticle/score: ${node_data.neu_articles}/(${parseFloat(node_data.neu_neg_sent).toFixed(2)},${parseFloat(node_data.neu_pos_sent).toFixed(2)}) <br>` +
                `#articles: ${node_data.dotted?0:(node_data.articles?.length || self.total_articles)} <br>` 
                self.tooltip_content = tooltipText
                self.tooltip
                .style("left", e.offsetX + 15 + "px")
                .style("top", e.offsetY - 5 + "px")
            })
            .on("mouseover", function(d) {
                if(self.animating_click) return
                // animate hovering effect 
                const container = d3.select(this)
                if(container.data()[0].text === self.clickedNode?.data()[0].text) return
                container.select("circle.expand_node_outlet")
                .transition()
                .duration(100)
                .attr("r", function(d) { return parseFloat(container.select("circle.node_outlet").attr("r")) + 10;})
                container.selectAll("circle.expand_node_outlet")
                .style("filter", "brightness(90%)")
                // show tooltip 
                if(self.nodeClicked) return
                self.hovered_node = container.data()[0]
                self.tooltip.transition().duration(100).style("scale", 1)
            })
            .on("mouseout", function(d) {
                if(self.animating_click) return
                // restore hovering effect
                const container = d3.select(this)
                if(container.data()[0].text === self.clickedNode?.data()[0].text) return
                container.select("circle.expand_node_outlet")
                .transition()
                .duration(100)
                .attr("r", function(d) { return parseFloat(container.select("circle.node_outlet").attr("r"));})
                container.selectAll("circle.expand_node_outlet")
                .style("filter", "brightness(100%)")
                // hide tooltip
                if(self.nodeClicked) return
                self.tooltip.transition().duration(100).style("scale", 0)
            })
            // no click event on center node          
            svg.selectAll("g.node.outlet").on("click", this.handleNodeClick)
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
                    const r = self.getRadiusBytext("node", d.text)*scale_ratio
                    return r+5
                }))
                .on('tick', function() {
                    tick_num += 1
                    const reigon_height = 100
                    this.nodes().forEach(node => {
                        if((node.x < center[0] + width/5) && (node.x > center[0] - width/5)) { 
                            if(node.y > center[1]-reigon_height && node.y < center[1]) node.y += 3*reigon_height
                        }
                    })
                    // clip nodes to border
                    if(true || tick_num > 95) {
                        this.nodes().forEach(node => {
                            const radius = self.getRadiusBytext("node", node.text)*scale_ratio 
                            const bound_x = [origin[0] + radius, origin[0] + width - radius]
                            const bound_y = [origin[1] + radius, origin[1] + height - radius]
                            node.x = Math.max(bound_x[0], Math.min(bound_x[1], node.x))
                            node.y = Math.max(bound_y[0], Math.min(bound_y[1], node.y))
                            if(node.dotted) {
                                node.y = bound_y[0] + radius
                            }
                        })
                    }
                    // update node stylings
                    self.updateNodes(true, clicked_outlet, scale_ratio, true)
                    self.updateCenterNode(true, scale_ratio)
                    // apply scale_ratio on shrunk nodes
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
        
        add_entity_edges(entity_graph, clickedNode) {
            var self = this
            // bind links to undirected edges
            const edge_group = clickedNode.selectAll("g.edge_group")
                .data(this.undirected_entity_links, (d) => (`${entity_graph[d.source].text}-${entity_graph[d.target].text}`))
                .join(
                    enter => {
                        const edge_group = enter.append("g").attr("class", "edge_group").attr("id", (d) => (`${entity_graph[d.source].text}-${entity_graph[d.target].text}`))
                        edge_group.append("line").attr("class", "expand_edge_entity").attr("stroke", "grey").lower()
                        edge_group.append("line").attr("class", "edge_entity")
                    }
                )
                .selectAll("line.edge_entity")
                .style("cursor", "pointer")
                .attr("x1", function(d) { 
                    const x = entity_graph[d.source].x 
                    d3.select(this.parentNode).select("line.expand_edge_entity").attr("x1", x)
                    return x
                })
                .attr("x2", function(d) { 
                    const x = entity_graph[d.target].x 
                    d3.select(this.parentNode).select("line.expand_edge_entity").attr("x2", x)
                    return x
                }) 
                .attr("y1", function(d) {
                    const y = entity_graph[d.source].y 
                    d3.select(this.parentNode).select("line.expand_edge_entity").attr("y1", y)
                    return y
                })
                .attr("y2", function(d) {
                    const y = entity_graph[d.target].y 
                    d3.select(this.parentNode).select("line.expand_edge_entity").attr("y2", y)
                    return y
                })
                .attr("stroke", (d) => {
                    const source_sst = entity_graph[d.source].sentiment
                    const target_sst = entity_graph[d.target].sentiment
                    if(source_sst == 'pos' && target_sst == 'pos') return SstColors.pos_color                    
                    if(source_sst == 'neg' && target_sst == 'neg') return SstColors.neg_color                    
                    if(source_sst == 'neu' && target_sst == 'neu') return SstColors.neu_color                    
                    // apply gradient colors defined in mounted()
                    // neu-pos
                    if((source_sst == 'pos' && target_sst == 'neu') ||
                        source_sst == 'neu' && target_sst == 'pos') return `url(#neu-pos)`
                    // neg-neu
                    if((source_sst == 'neg' && target_sst == 'neu') ||
                        source_sst == 'neu' && target_sst == 'neg') return `url(#neg-neu)`
                    // neg-pos
                    if((source_sst == 'neg' && target_sst == 'pos') ||
                        source_sst == 'pos' && target_sst == 'neg') return `url(#neg-pos)`
                })
                .attr("transform", (d) => {
                    // edges need to be rotated to make sure target and source sentiments
                    // aligned with the edge colors
                    // because gradient always starts from left to right
                    const source = entity_graph[d.source] 
                    const target = entity_graph[d.target] 
                    const source_sst = source.sentiment
                    const target_sst = target.sentiment
                    const mid_point = [(source.x + target.x)/2, (source.y + target.y)/2]
                    var angle = 0
                    if(source_sst == 'pos' && target_sst == 'pos') angle = 0 
                    if(source_sst == 'neg' && target_sst == 'neg') angle = 0
                    if(source_sst == 'neu' && target_sst == 'neu') angle = 0 
                    // neu-pos
                    if((source_sst == 'pos' && target_sst == 'neu') ||
                       (source_sst == 'neu' && target_sst == 'pos')) { angle = edgeRotation(source, target, 'neu', 'pos')}
                    // neg-neu
                    if((source_sst == 'neg' && target_sst == 'neu') ||
                       (source_sst == 'neu' && target_sst == 'neg')) { angle = edgeRotation(source, target, 'neg', 'neu')}
                    // neg-pos
                    if((source_sst == 'neg' && target_sst == 'pos') ||
                       (source_sst == 'pos' && target_sst == 'neg')) { angle = edgeRotation(source, target, 'neg', 'pos')}
                    return (angle==180)?`rotate(${angle}, ${mid_point[0]}, ${mid_point[1]})`:0
                })
                .style("stroke-width", function(d) {
                    const entity_1 = entity_graph[d.source].text
                    const entity_2 = entity_graph[d.target].text
                    const freq = self.cooccur_matrix[entity_1][entity_2] || 0
                    const min_width = 5
                    const max_width = 30
                    const width = (max_width-min_width)*(freq/self.max_entity_cooccurr) + min_width  
                    d3.select(this.parentNode).select("line.expand_edge_entity").style("stroke-width", width)
                    return width
                })
                .style("stroke-opacity", function(d) {
                    const entity_1 = entity_graph[d.source].text
                    const entity_2 = entity_graph[d.target].text
                    const freq = self.cooccur_matrix[entity_1][entity_2]
                    const min_opacity = 0.1
                    const max_opacity = 0.9
                    const powerScale = d3.scalePow().exponent(1.8)
                        .domain([self.min_entity_cooccurr, self.max_entity_cooccurr])
                        .range([min_opacity, max_opacity])
                    const opacity = (powerScale(freq) > self.opacityThreshold)?powerScale(freq):0
                    if(opacity == 0) { d3.select(this.parentNode).style("pointer-events", "none") }
                    d3.select(this.parentNode).select("line.expand_edge_entity").style("stroke-opacity", opacity)
                    return opacity 
                })
                .style("stroke-linecap","round")
                .on("mousemove", function(e) {
                    // update tooltip location on moved
                    const edge_data = d3.select(this).data()[0]
                    const entity_1 = entity_graph[edge_data.source].text
                    const entity_2 = entity_graph[edge_data.target].text
                    const freq = self.cooccur_matrix[entity_1][entity_2] || 0
                    const tooltipText = 
                    `entity_1: ${entity_1} <br>` +
                    `entity_2: ${entity_2} <br>` + 
                    `#co-occur: ${freq} <br>` 
                    self.tooltip_content = tooltipText
                    self.tooltip
                    .style("left", e.offsetX + 15 + "px")
                    .style("top", e.offsetY - 5 + "px")
                })
                .on("mouseover", function(d) {
                    // skip 0 opacity edges
                    if(d3.select(this).style("stroke-opacity") == 0) return
                    if(self.animating_click) return
                    // apply tooltip
                    self.tooltip.transition().duration(100).style("scale", 1)
                    // apply hovered edge style changes
                    const edge_group = d3.select(this.parentNode)
                    applyEntityEdgeSelectedStyle(self.selected_entities, edge_group, true)
                })
                .on("mouseout", function(d) {
                    if(self.animating_click) return
                    // hide tooltip
                    self.tooltip.transition().duration(100).style("scale", 0)
                    // remove hovered edge style changes
                    const edge_group = d3.select(this.parentNode)
                    applyEntityEdgeSelectedStyle(self.selected_entities, edge_group, false)
                })
                .on("click", function(e, d) {
                    // skip 0 opacity edges
                    if(d3.select(this).style("stroke-opacity") == 0) return
                    e.stopPropagation()
                    if(self.animating_click) return
                    // apply selected style changes
                    const edge_group = d3.select(this.parentNode)
                    applyEntityEdgeSelectedStyle(self.selected_entities, edge_group, true)
                    // record selected edge
                    self.selected_entity_edge = this
                    // unclick previous nodes 
                    const prev_nodes = d3.selectAll("g.subnode.entity").filter(d => self.selected_entities.includes(d.text))
                    applyEntityNodeClickedStyle(prev_nodes, false)

                    // apply click style changes on new nodes
                    self.selected_entities = edge_group.attr("id").split("-")
                    const new_nodes = d3.selectAll("g.subnode.entity").filter(d => self.selected_entities.includes(d.text))
                    applyEntityNodeClickedStyle(new_nodes, true)
                })
            clickedNode.selectAll("g.subnode.entity").raise()
        },

        getArticleNumByOutlet(outlet) {
            const node = this.graph.nodes.filter(node => node.text == outlet)
            if(!node) return 0;
            return node[0].articles.length
        },

        getRadiusBytext(node_level, label) {
            const target = d3.selectAll(`g.${node_level}`).filter(d => d.text == label)
            return parseFloat(target.attr("r"))
        },

        RGBToHex(rgb) {
            // Choose correct separator
            let sep = rgb.indexOf(",") > -1 ? "," : " ";
            // Turn "rgb(r,g,b)" into [r,g,b]
            rgb = rgb.substr(4).split(")")[0].split(sep);

            let r = (+rgb[0]).toString(16),
                g = (+rgb[1]).toString(16),
                b = (+rgb[2]).toString(16);

            if (r.length == 1)
                r = "0" + r;
            if (g.length == 1)
                g = "0" + g;
            if (b.length == 1)
                b = "0" + b;

            return "#" + r + g + b;
        }

    }
})
</script>
<template>
<div class="graphContainer">
    <svg  class="graph" viewBox="0 0 800 600" :id="id">
        
    </svg>
    <div class="controll-panel">
        <div v-if="!nodeClicked" class="outlet-image-controller-container">
            <div class="outlet-image-controller-header" >Logo mode</div>
            <InputSwitch class='outlet-image-controller' 
            v-model="useOutletImage" 
            :disabled="nodeClicked" 
            style="margin-top:10px" ></InputSwitch>
            
        </div>
        <OpacityController class="opacity-controller" v-if="nodeClicked" 
        v-model:opacityThreshold="opacityThreshold"
        ></OpacityController>
    </div>
    <!-- <Tooltip :content="tooltip_content" style="z-index: 1000;"></Tooltip> -->
    <Legend style="position:absolute;left:83%;top:80%;"></Legend>
    <InfoButtonVue :info_content="'Explanation of the graph'" style="position:absolute; left:95%; top:79%"></InfoButtonVue>
    <NodeInfo class="node-info" :node="hovered_node_info" :total_articles="total_articles" style="z-index: 1000"></NodeInfo>

</div>
</template>

<style scoped lang="scss">
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
.controll-panel {
    min-width: 110px;
    border: solid;
    border-width: 2px;
    border-radius: 5px;
    background-color: #a1bff8;
    text-align:center;
    position:absolute;
    left: 88%;
    top: 30%;
}
.outlet-image-controller-container {
    text-align:center;
}
:deep(.p-inputswitch .p-inputswitch-slider) {
    vertical-align:center;
    border-radius: 15px;
}
:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
    background: #0768cf !important;

}
:deep(.p-inputswitch .p-inputswitch-slider::before) {
    border-radius: 10px;
}
:deep(.info-button-container > .tooltip) {
    position:relative;
    white-space: nowrap;
    max-width: 200px;
    left:-140px; 
    top:-55px;
}
.node-info {
    position:absolute;
//     left: 60%;
//     top: 50%;
} 
</style>