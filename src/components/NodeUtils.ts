import { OutletNode } from '../types'
import * as SstColors from './ColorUtils'
import * as d3 from "d3";
export function sentiment_classify(node_data: OutletNode) {
const pos = node_data.pos_sent
const neg = Math.abs(node_data.neg_sent)
const neu = Math.abs(node_data.neu_sent)
const max = Math.max(pos, neg, neu) 
if(max == pos) return "positive"
if(max == neg) return "negative"
if(max == neu) return "neutral"
}
export function applyEntityNodeSelectedStyle(nodes: any, selected:Boolean=true) {
if(selected) {
    nodes.selectAll("circle.expand_subnode_entity")
        .style("filter", "brightness(90%)")
} else {
    nodes.selectAll("circle.expand_subnode_entity")
    .style("filter", "brightness(100%)")
}

}

export function applyEntityNodeClickedStyle(nodes: any, clicked:Boolean=true) {
    if(clicked) {
        nodes.selectAll("circle.expand_subnode_entity")
            .style("filter", "brightness(90%)")
            .style("fill", SstColors.entity_selected_color)
        nodes.selectAll("text.subnode_entity")
            .style("fill", "white")
    } else {
        nodes.selectAll("circle.expand_subnode_entity")
        .style("filter", "brightness(100%)")
        .style("fill", "white")
        nodes.selectAll("text.subnode_entity")
        .style("fill", "black")

    }
}

const abbr_dict: { [id: string]: string } = {
    "CNN": "CNN",
    "FoxNews": "FOX",
    "Breitbart": "BRB",
    "ABC News": "ABC",
    "New York Times": "NYT",
    "Washington Post": "WP"
}
const outlet_font = undefined 
const center_font= "cursive"
export function applyNodeStyling(
    node: any, 
    node_level: string, 
    class_name: string,
    r: number=0, 
    useOutletImage: Boolean,
    total_articles: number,
    min_articles: number,
    max_articles: number,
    msg: string="???") {
    if(node.empty()) return 
    //var node = append_flag?enter.append("g"):enter
    // console.log(d3.select(enter).node())
    // ? enter.select("g." + class_name)
    // : enter.append("g").attr("class", class_name)
    // .attr("cx", function(d) { return cx<0?d.x:cx;})
    // .attr("cy", function(d) { return cy<0?d.y:cy;})
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
        .attr("y", function(d) { 
            const center_y = d3.select(this.parentNode).attr("cy"); 
            if(node_level === "node" && r != 0) return center_y - r + 30
            return center_y
        })
        .each(function(d) {
            if(node_level === "node" && class_name === "outlet") {
                d3.select(this).text(d => abbr_dict[d.text])
                .style("opacity", useOutletImage?0:1)
            } else {
                var break_text = d.text.split('_')
                var break_num = break_text.length
                if(break_num >= 4) {
                    break_text = [break_text[0], break_text[1], break_text[2], '...']
                    break_num = 4
                }
                        
                var node_text = d3.select(this)
                node_text.selectAll("tspan")
                .data(break_text)
                .join("tspan")
                .text(d => d)
                .attr("x", node_text.attr("x"))
                .attr("dy", () => (node_level === "node" ? (class_name==="center"?"1.5em":"1.4em"):"1.4em"))
                node_text.attr("y", function(d) { 
                    const center_y = d3.select(this).attr("y")  
                    const offset = 1+(break_num-1)/2
                    if(node_level == "node") return center_y - 27*offset
                    if(node_level == "subnode") return center_y - 14*offset
                })
            }
        })
        .attr("text-anchor", "middle")
        .attr("font-size", () => (node_level === "node" ? (class_name==="center"?"1em":"0.8em"):"0.6em"))
        .attr("font-family", () => (class_name === "center")? center_font:outlet_font)
        .attr("dominant-baseline", "central")

    node.attr("r", function(d) { 
        return articlesToRadius(node_level, total_articles, min_articles, max_articles, d, r)
    })

    // use svg img instead of plain text for outlet nodes
    if(useOutletImage && node_level == "node" && class_name == "outlet") {
        const label_img = 
        ( node.selectAll(`image.label_${node_level}_${class_name}`).node()
        ? node.selectAll(`image.label_${node_level}_${class_name}`)
        : node.append("image").attr("class", `label_${node_level}_${class_name}`))
        label_img.attr("href", (d) => (`src/assets/${abbr_dict[d.text]}.png`))
        .attr("height", function(d) { return r!=0?articlesToRadius(node_level, total_articles, min_articles, max_articles, d, 0)+30:d3.select(this.parentNode).attr("r")})
        .attr("width", function(d) { return r!=0?articlesToRadius(node_level, total_articles, min_articles, max_articles, d, 0)+30:d3.select(this.parentNode).attr("r")})
        .attr("x", function(d) { return d3.select(this.parentNode).attr("cx") - d3.select(this).attr("width")/2})
        .attr("y", function(d) { 
            const center_y = d3.select(this.parentNode).attr("cy") 
            if(node_level === "node" && r != 0) return center_y - d3.select(this.parentNode).attr("r") + 30
            else return center_y - d3.select(this).attr("height")/2 
        })
    }
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
    .attr("fill", () => (class_name === "center"? "#effefd" : "white")) 
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

    outer_ring.style("filter", `brightness(${SstColors.brightness}%)`)
    // positive ring
    const pos_ring = 
    ( outer_ring.select(`path.pos_${node_level}_${class_name}`).node()
    ? outer_ring.select(`path.pos_${node_level}_${class_name}`)
    : outer_ring.append("path").attr("class", `pos_${node_level}_${class_name}`))
    pos_ring.attr("fill", SstColors.pos_color)     
        .attr("transform", function(d) {
            const cx = d3.select(this.parentNode.parentNode).attr("cx")
            const cy = d3.select(this.parentNode.parentNode).attr("cy")
            return "translate(" + cx + "," + cy + ")"
        })
        .transition()
        .duration(animate_duration)
        .tween('ring-effect', function(d) {
            var percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+Math.abs(d.neu_sent))
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
    neg_ring.attr("fill", SstColors.neg_color)     
        .attr("transform", function(d) {
            const cx = d3.select(this.parentNode.parentNode).attr("cx")
            const cy = d3.select(this.parentNode.parentNode).attr("cy")
            return "translate(" + cx + "," + cy + ")"
        })     
        .transition()
        .duration(animate_duration)
        .tween('ring-effect', function(d) {
            var percentage = Math.abs(d.neg_sent)/(d.pos_sent+Math.abs(d.neg_sent)+Math.abs(d.neu_sent))
            var start_percentage = parseFloat(d.pos_sent)/(d.pos_sent+Math.abs(d.neg_sent)+Math.abs(d.neu_sent))
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
    neu_ring.attr("fill", SstColors.neu_color)     
        .attr("transform", function(d) {
            const cx = d3.select(this.parentNode.parentNode).attr("cx")
            const cy = d3.select(this.parentNode.parentNode).attr("cy")
            return "translate(" + cx + "," + cy + ")"
        })     
        .transition()
        .duration(animate_duration)
        .tween('ring-effect', function(d) {
            var percentage = Math.abs(d.neu_sent)/(d.pos_sent+Math.abs(d.neg_sent)+Math.abs(d.neu_sent))
            var start_percentage = parseFloat(d.pos_sent + Math.abs(d.neg_sent))/(d.pos_sent+Math.abs(d.neg_sent)+Math.abs(d.neu_sent))
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
}

export function articlesToRadius(
    node_level: string,
    total_articles: number, 
    min_articles: number,
    max_articles: number,
    d: OutletNode, 
    r: number=0) {
    return r>0?r:(d.dotted?minimum_outlet_radius:(d.isCenter?centerNodeRadius(node_level, total_articles, min_articles, max_articles):normalizedLength(node_level, d.articles.length, min_articles, max_articles, )));
}

function centerNodeRadius(
    node_level: string,
    total_articles: number,
    min_articles: number,
    max_articles: number) {
    return normalizedLength(node_level, total_articles/6, min_articles, max_articles)
}

const minimum_outlet_radius = 20
const maximum_outlet_radius = 80
const minimum_entity_radius = 35 
const maximum_entity_radius = 80
function normalizedLength(
    node_level: string,
    total_articles: number,
    min_articles: number,
    max_articles: number) {
    const articles_ratio = 
    (total_articles - min_articles)/(max_articles+1) 

    const min = (node_level === "node" ? minimum_outlet_radius : minimum_entity_radius)
    const max = (node_level === "node" ? maximum_outlet_radius : maximum_entity_radius)
    return articles_ratio*(max-min) + min
}
