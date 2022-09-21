import { ViewType, ScatterNode } from "../../types"
import {Ref} from "vue"
import * as d3 from "d3"
import * as _ from "lodash"
import * as SstColors from "../utils/ColorUtils"

interface Margin {
    top: number,
    bottom: number,
    left: number,
    right: number
}

interface SegmentPoint {
    x: number,
    y: number
}


// const viewBox: [number, number] = [1000, 1000]
// const outlet_min_radius = 10
// const outlet_max_radius = 150
// const margin = {top: 60, bottom: 60, right:40, left: 80} 
// var segment_controller_start_x:number
// var segment_controller_start_y:number
// let current_zoom: any = undefined

class entityScatter {
    props: any;
    viewBox: [number, number];
    vbWidth: number;
    vbHeight: number;
    outlet_min_radius: number;
    outlet_max_radius: number;
    margin: Margin;
    segment_controller_width: number;
    node_circle_radius: number;
    
    segment_point: SegmentPoint;
    segment_controller_start: SegmentPoint;


    xScale: d3.ScalePower<number,number,never>;
    yScale: d3.ScalePower<number,number,never>;
    
    zoom: any;
    current_zoom: any;


    public constructor(props:any, margin:Margin, viewBox:[number,number]){
        this.margin = margin;
        this.viewBox = viewBox;
        this.vbWidth = this.viewBox[0] - this.margin.left - this.margin.right;
        this.vbHeight = this.viewBox[1] - this.margin.top - this.margin.bottom;
        this.outlet_min_radius = 10;
        this.outlet_max_radius = 150;
        this.segment_controller_width = 12;
        this.node_circle_radius = 10;
        this.segment_point = {x: 0, y: 0};
        this.segment_controller_start = {x:0, y:0};
        this.current_zoom = undefined;

        this.xScale = d3.scalePow()
            .exponent(1)
            .domain([0, 1])
            .range([this.margin.left, this.vbWidth + this.margin.left]);
        this.yScale =  d3.scalePow()
            .exponent(1)
            .domain([0, 1])
            .range([this.margin.top + this.vbHeight, this.margin.top]);
        
        this.zoom = d3.zoom().scaleExtent([1, 3]).on("zoom", this.handleZoom)
    }

    updateSegmentation(filtered_data:Ref<ScatterNode[]>) : void{
        const svg = d3.select(`#${this.props.id}`).select("svg")
        const segment_group = svg.selectAll("g.segmentation")
        .data([this.segment_point])
    
        segment_group.enter().append("g")
            .attr("class", "segmentation")
            .lower()
    
        // neg
        const neg_rect: any = segment_group.selectAll("rect.neg")
        segment_group.enter().select("g.segmentation").append("rect")
                    .attr("class", "neg")
                    .attr("fill", SstColors.neg_color)
                    .style("filter", `brightness(${SstColors.brightness}%)`)
                    .merge(neg_rect)
                    .attr("x", this.margin.left)
                    .attr("y", this.margin.top)
                    .attr("width", (d) => this.segment_point.x+this.margin.left)
                    .attr("height", (d) => this.segment_point.y+this.margin.top)
                    .lower()
        // neu
        const neu_rect: any = segment_group.selectAll("rect.neu")
        segment_group.enter().select("g.segmentation").append("rect")
                    .attr("class", "neu")
                    .attr("fill", SstColors.neu_color)
                    .style("filter", `brightness(${SstColors.brightness}%)`)
                    .merge(neu_rect)
                    .attr("x", this.margin.left)
                    .attr("y", (d) =>  this.segment_point.y)
                    .attr("width", (d) => this.segment_point.x-this.margin.left)
                    .attr("height", (d) => this.vbHeight-this.segment_point.y+this.margin.top)
    
        // pos
        const pos_rect: any = segment_group.selectAll("rect.pos")
        segment_group.enter().select("g.segmentation").append("rect")
                    .attr("class", "pos")
                    .attr("fill", SstColors.pos_color)
                    .style("filter", `brightness(${SstColors.brightness}%)`)
                    .merge(pos_rect)
                    .attr("x", (d) => this.segment_point.x)
                    .attr("y", (d) => this.segment_point.y)
                    .attr("width", (d) => this.vbWidth-this.segment_point.x+this.margin.left)
                    .attr("height", (d) => this.vbHeight-this.segment_point.y + this.margin.top)
        // mixed
        const mixed_rect: any = segment_group.selectAll("rect.mixed")
        segment_group.enter().select("g.segmentation").append("rect")
                    .attr("class", "mixed")
                    .attr("fill", SstColors.mixed_color)
                    .style("filter", `brightness(${SstColors.brightness}%)`)
                    .merge(mixed_rect)
                    .attr("x", (d) => this.segment_point.x)
                    .attr("y", this.margin.top)
                    .attr("width", (d) => this.vbWidth-this.segment_point.x+this.margin.left)
                    .attr("height", (d) => this.segment_point.y-this.margin.top)
        svg.selectAll("g.segmentation")
            .style("opacity", this.props.segment_mode?1:0)
            .style("pointer-events", "none")
        svg.selectAll("rect.segment-controller")
            .data([{x: this.segment_point.x-this.segment_controller_width/2, y:this.segment_point.y-this.segment_controller_width/2}])
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            // .attr("x", () => (segment_point.x-segment_controller_width/2))
            // .attr("y", () => (segment_point.y-segment_controller_width/2))
        if(this.props.expanded)
            this.updateCategorization(filtered_data)
    }

    updateCategorization(filtered_data:Ref<ScatterNode[]>) :void {
        let bind_data: ScatterNode[] = [];
        if(this.props.view?.type === ViewType.EntityScatter) bind_data = filtered_data.value
        if(this.props.view?.type === ViewType.OutletScatter) bind_data = this.props.view.data.nodes
        // if(props.graph?.type === ViewType.CooccurrScatter) bind_data = props.graph.nodes
    
        const ctg_nodes = _.groupBy(bind_data, this.categorizeNode)
        const svg = d3.select(`#${this.props.id}`).select("svg")
    
        const ctg_info = svg.selectAll("text.ctg_info")
            .data([0])
        ctg_info.enter().append("text").attr("class", "ctg_info")
            .attr("x", this.vbWidth)
            .attr("y", 50)
        const ctgs: any = svg.selectAll("text.ctg_info").selectAll("tspan.ctg")
            .data(Object.keys(ctg_nodes))
        ctgs.enter().append("tspan").attr("class", "ctg")
            .merge(ctgs)
            .attr("x", 1.03*this.vbWidth)
            .attr("dy", 15)
            .text(d => `${d}: ${ctg_nodes[d].length}`)   
    }

    categorizeNode(node) {
        const pos_threshold = this.xScale.invert(this.segment_point.x)
        const neg_threshold = this.yScale.invert(this.segment_point.y)
        if(node.pos_sst < pos_threshold && node.neg_sst < neg_threshold) return "neu"
        if(node.pos_sst < pos_threshold && node.neg_sst > neg_threshold) return "neg"
        if(node.pos_sst > pos_threshold && node.neg_sst < neg_threshold) return "pos"
        if(node.pos_sst > pos_threshold && node.neg_sst > neg_threshold) return "mix"
        return "unknown" 
    }

    showTemporal(filtered_data:Ref<ScatterNode[]>, emit) {
        let emit_data;
        if(this.props.view?.type === ViewType.EntityScatter) emit_data = filtered_data.value
        if(this.props.view?.type === ViewType.OutletScatter) emit_data = this.props.view.data
        emit("show_temporal", emit_data)
    }

    handleZoom(e) {
        const svg = d3.select(`#${this.props.id}`).select("svg")
        const outlet_group = svg.selectAll("g.outlet")
            .attr("transform", e.transform)
        
        outlet_group.selectAll("circle")
            .attr("r", this.node_circle_radius/e.transform.k)
    
        svg.selectAll("g.axis_x")
            .attr("transform", `translate(${e.transform.x},${this.margin.top+this.vbHeight}) scale(${e.transform.k})`)
    
        svg.selectAll("g.axis_y")
            .attr("transform", `translate(${this.margin.left},${e.transform.y}) scale(${e.transform.k})` )
        svg.selectAll("g.segmentation > rect")
            .attr("transform", e.transform)
        const segment_controller = svg.selectAll("rect.segment-controller");
        segment_controller
            .attr("transform", e.transform)
            .attr("width", this.segment_controller_width/e.transform.k)
            .attr("height", this.segment_controller_width/e.transform.k)
            .attr("x", () => (this.segment_point.x - (this.segment_controller_width/e.transform.k)/2))
            .attr("y", () => (this.segment_point.y - (this.segment_controller_width/e.transform.k)/2));
    
        this.current_zoom = e.transform
    }
}
