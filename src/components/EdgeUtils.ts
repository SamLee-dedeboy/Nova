import * as d3 from "d3";
import { OutletEdge, OutletNode } from "../types"
import * as SstColors from './ColorUtils'

export function edgeRotation(
    source: OutletNode, 
    target: OutletNode, 
    left_sst: string, 
    right_sst: string) 
    {
    const source_sst = source.sentiment
    const target_sst = target.sentiment
    const p: Array<number | undefined> = (source_sst === right_sst) ? [source.x, source.y]:[target.x, target.y]
    const n: Array<number | undefined> = (source_sst === left_sst) ? [source.x, source.y]:[target.x, target.y]
    const dx = p[0]!-n[0]!
    return (dx > 0) ? 0 : 180 
}
export function applyEntityEdgeSelectedStyle(
    selected_entities: string[],
    edge_group: any,
    selected: Boolean=true) 
    {
    const entities = edge_group.attr("id").split("-")
    const nodes = d3.selectAll("g.subnode.entity")
    .filter(d => entities.includes(d.text))
    .filter(d => !selected_entities.includes(d.text))
    if(selected) {
        nodes.selectAll("circle.expand_subnode_entity")
        .style("filter", "brightness(90%)")

        edge_group.select("line.expand_edge_entity")
        .style("filter", "brightness(90%)")
        .style("stroke-opacity", function(d) { return 0.5; return Math.min(1, parseFloat(edge_group.select("line.edge_entity").style("stroke-opacity"))+0.2) })
        .style("stroke-width", function(d) { return parseFloat(edge_group.select("line.edge_entity").style("stroke-width"))+10 })
    } else {
        nodes.selectAll("circle.expand_subnode_entity")
        .style("filter", "brightness(100%)")
        edge_group.select("line.expand_edge_entity")
        .style("filter", "brightness(100%)")
        .style("stroke-opacity", function(d) { return parseFloat(edge_group.select("line.edge_entity").style("stroke-opacity")) })
        .style("stroke-width", function(d) { return parseFloat(edge_group.select("line.edge_entity").style("stroke-width")) })
    }
}
export function addEdges(svg: any, node: any) {
    if(node.empty()) return
    // edges
    // bind edges to node circles, so that edges can bind to circle center
    var center_node = d3.select("g.node.center")
    const edge_color = {"pos": SstColors.pos_color, "neg": SstColors.neg_color, "neu": SstColors.neu_color }
    var edges = svg.selectAll("line.edge.outlet")
    .data(node, function(d) { return d3.select(d).data()[0].text})
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
}  