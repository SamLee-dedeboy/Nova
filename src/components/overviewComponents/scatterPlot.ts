import { ViewType, ScatterNode, OutletNodeInfo } from "../../types"
import {ComputedRef, Ref} from "vue"
import * as d3 from "d3"
import * as _ from "lodash"
import * as SstColors from "../utils/ColorUtils"
import * as NodeUtils from "../utils/NodeUtils"

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
    svg: any;
    
    segment_point: SegmentPoint;
    segment_controller_start: SegmentPoint;


    xScale: d3.ScalePower<number,number,never>;
    yScale: d3.ScalePower<number,number,never>;
    
    zoom: any;
    current_zoom: any;

    filtered_data:Ref<ScatterNode[]>
    tooltip_content: Ref<string>
    total_articles: ComputedRef<any>
    min_articles: ComputedRef<any>
    max_articles: ComputedRef<any>
    clicked_node: Ref<ScatterNode>
    clicked_node_element: Ref<any>
    hovered_node_info: Ref<OutletNodeInfo>

    public constructor(props:any, margin:Margin, viewBox:[number,number], filtered_data:Ref<ScatterNode[]>, tooltip_content: Ref<string>, 
        total_articles: ComputedRef<any>, min_articles: ComputedRef<any>, max_articles: ComputedRef<any>, clicked_node: Ref<ScatterNode>, clicked_node_element: Ref<any>,
        hovered_node_info: Ref<OutletNodeInfo>){
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

        this.filtered_data = filtered_data;
        this.tooltip_content = tooltip_content;
        this.total_articles = total_articles;
        this.min_articles = min_articles;
        this.max_articles = max_articles;
        this.clicked_node = clicked_node;
        this.clicked_node_element = clicked_node_element;
        this.hovered_node_info = hovered_node_info;

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

    draw(emit) : void {
        if(this.props.expanded) { 
            this.drawSegementation(emit)
        } else {
            this.drawDefault()
        }
        this.drawAxis(emit)
    }

    /* Exposed for event handling */
    resetView(){
        
    }

    updateCanvas(emit:any) {
        if(this.props.expanded)
            this.updateExpandedScatter(emit)
        else 
            this.updateOverviewScatter(emit)
    } 

    updateSegmentation() : void{
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
            this.updateCategorization()
    }

    updateCategorization() :void {
        let bind_data: ScatterNode[] = [];
        if(this.props.view?.type === ViewType.EntityScatter) bind_data = this.filtered_data.value
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

    showTemporal(emit) {
        let emit_data;
        if(this.props.view?.type === ViewType.EntityScatter) emit_data = this.filtered_data.value
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
    initScatterSvg(svgID:string){
        this.svg = d3.select(`#${svgID}`);
        this.svg.attr("viewBox", `0 0 ${this.viewBox[0]} ${this.viewBox[1]}`);
        d3.select(`#${this.props.id}`).select("div.tooltip").style("opacity", 0);
        d3.select(`#${this.props.id}`).select(".nodeinfo").style("opacity", 0);
        this.svg.append("g").attr("class", "node_group");

        this.updateOverviewTooltipContent();
        this.segment_point = {x: this.xScale(this.props.segmentation?.pos || 0.5), y: this.yScale(this.props.segmentation?.neg || 0.5)}
        this.updateSegmentation()
    }

    drawSegementation(emit){
        this.svg.call(this.zoom)
        const drag = d3.drag()
            .on("start", (e, d)=>{ 
                this.segment_controller_start.x = e.x
                this.segment_controller_start.y = e.y
                d3.select('rect.segment-controller').attr("stroke", "black")
            })
            .on("drag", (e:any, d:any) => { 
                let current_scale;
                const segmentRect = d3.select('rect.segment-controller');
                //select element by id
                if (segmentRect.attr("transform") === null){
                    current_scale = 1; 
                } 
                //case where we have transformed the circle 
                else {
                    const current_scale_string = segmentRect.attr("transform")?.split(' ')[1] || "";
                    current_scale = +current_scale_string.substring(6,current_scale_string.length-1);
                }
                const end_x = this.segment_controller_start.x + ((e.x - this.segment_controller_start.x) / current_scale) 
                const end_y = this.segment_controller_start.y + ((e.y - this.segment_controller_start.y) / current_scale) 
                segmentRect
                    // .attr("x", d.x=(end_x-segment_controller_width/2) + (segment_controller_width-segment_controller_width/(current_zoom?.k || 1))/2)
                    // .attr("y", d.y=(end_y-segment_controller_width/2) + (segment_controller_width-segment_controller_width/(current_zoom?.k || 1))/2)
                    .attr("x", d.x=(end_x-(this.segment_controller_width/(this.current_zoom?.k || 1))/2))
                    .attr("y", d.y=(end_y-(this.segment_controller_width/(this.current_zoom?.k || 1))/2))
                    .raise();

                this.segment_point = {x: Math.max(this.margin.left, Math.min(end_x, this.vbWidth)), y: Math.max(this.margin.top, Math.min(end_y, this.vbHeight))} 
                emit("update:segmentation", {pos: this.xScale.invert(this.segment_point.x), neg: this.yScale.invert(this.segment_point.y)})
                this.updateSegmentation()
            })
            .on("end", function(e, d) { d3.select(this).attr("stroke", null)})

        //Segment Controller Rect
        this.svg.append("rect")
            .data([{x: this.segment_point.x-this.segment_controller_width/2, y:this.segment_point.y-this.segment_controller_width/2}])
            .attr("class", "segment-controller")
            .attr("id", "segment-controller")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("width", this.segment_controller_width)
            .attr("height", this.segment_controller_width)
            .attr("fill", "white")
            .style("cursor", "pointer")
            .style("opacity", this.props.segment_mode?1:0)
            .call(drag as any)
            .on("mouseover", function(e, d) {
                d3.select(this).attr("stroke", "black")
            })
            .on("mouseout", function(e, d) {
                d3.select(this).attr("stroke", null)
            })
    }

    drawAxis(emit:any){
        this.updateCanvas(emit)
        this.updateExpandedScatter(emit) // if(tutorial_mode.value && tutorial_step.value === 0) {}

        this.svg.append("g")
            .attr("class", "axis_x")
            .attr("transform", `translate(0, ${this.margin.top+this.vbHeight})`)
            .call(d3.axisBottom(this.xScale));

        this.svg.append("text")
            .attr("class", "axis_x_label")
            .attr("transform", `translate(${this.margin.left+this.vbWidth-15}, ${this.margin.top+this.vbHeight+5})`)
            .attr("text-anchor", "middle")
            .text("positive score")
            .attr("fill", SstColors.pos_color);

        this.svg.append("g")
            .attr("class", "axis_y")
            .attr("transform", `translate(${this.margin.left},0)`)
            .call(d3.axisLeft(this.yScale))
            .raise();

        this.svg.append("text")
            .attr("class", "axis_y_label")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top-10})`)
            .attr("text-anchor", "middle")
            .text("negative score")
            .attr("fill", SstColors.neg_color)
    }

    drawDefault(){
        let break_text = this.props.view?.title.split('_') || "known"
        var break_num = break_text.length
        if(break_num >= 4) {
            break_text = [break_text[0], break_text[1], break_text[2], '...']
            break_num = 4
        }
        this.svg.append("text")
            .selectAll("tspan")
            .data(break_text)
            .join("tspan")
            .text(d => d)
            .attr("x", this.viewBox[0]/2.1)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("font-size", "4em")
            .attr("dominant-baseline", "hanging");

        this.svg.on("mousemove", (e, d) => {
            d3.select(`#${this.props.id}`).select("div.tooltip")
            .style("left", e.offsetX + 15 + "px")
            .style("top", e.offsetY - 5 + "px")
            })
            .on("mouseover", (e, d) => {
                // if(tutorial_mode.value && tutorial_step.value === 0) return
                this.svg.style("filter", "brightness(80%)")
                .style("background-color", "rgb(191,189,189)")
                d3.select(`#${this.props.id}`).select("div.tooltip")
                .style("opacity", 1)
            })
            .on("mouseout", (e, d) => {
                this.svg.style("filter", "brightness(100%)")
                .style("background-color", "white")
                d3.select(`#${this.props.id}`).select("div.tooltip")
                .style("opacity", 0)
            })
    }           

    updateOverviewTooltipContent() {
        const nodes = this.filtered_data.value! 
        const title = this.props.view?.title
        const entity_num = nodes.length || 0
        const avg_pos_sst = _.mean(nodes.map(node => node.pos_sst))
        const avg_neg_sst = _.mean(nodes.map(node => node.neg_sst))
        nodes.sort((node_a, node_b) => -(node_a.article_ids.length - node_b.article_ids.length))
        this.tooltip_content.value = 
        `${title}: <br>` + 
        `&nbsp #entities: ${entity_num} <br>` +
        `&nbsp top entities:<ol>` 
        for(let i = 0; i < Math.min(3, nodes.length); ++i) {
            this.tooltip_content.value +=
            `<li>${nodes[i].text.split("-")[0]}</li>`
        }
        this.tooltip_content.value += "</ol>" +
        `&nbsp avg_sst: (${avg_pos_sst.toFixed(2)}, ${avg_neg_sst.toFixed(2)}) <br>` 
        if(this.props.view?.type === ViewType.EntityScatter) {
            this.tooltip_content.value += `&nbsp total_articles: ${this.total_articles.value} <br>`
        }
        // tooltip_content.value += `<svg id='${props.id}-wordcloud' class='tooltip_canvas' width='250px' height='100px'></svg>`
        
    }

    updateOverviewScatter(emit:any) {
        const svg = d3.select(`#${this.props.id}`).select("svg")
        const article_radius_scale = d3.scalePow()
        .exponent(1)
        .domain([ this.min_articles.value, this.max_articles.value ])
        .range([ this.outlet_min_radius, this.outlet_max_radius ]);
    
        let bind_data: ScatterNode[] = [];
        if(this.props.view?.type === ViewType.EntityScatter) bind_data = this.filtered_data.value
        if(this.props.view?.type === ViewType.OutletScatter) bind_data = this.props.view.data
        if(this.props.view?.type === ViewType.CooccurrHex) bind_data = this.filtered_data.value
    
        const node_group = svg.select("g.node_group")
        node_group.selectAll("g.outlet")
        .data(bind_data, function(d: any) {return d.text})
        .join( 
            enter => { 
                enter.append("g").attr("class", "outlet").append("circle")
                    .attr("class", "outlet_circle")
                    .attr("r", this.node_circle_radius/(this.current_zoom?.k || 1))
                    .attr("cx", (d) => this.xScale(d.pos_sst))
                    .attr("cy", (d) => this.yScale(Math.abs(d.neg_sst)))
                    // .attr("fill", (d) => SstColors.outlet_color_dict[d.text])
                    .attr("fill", (d) => d.article_ids.length === 0? "white" :SstColors.article_num_color_scale(d.article_ids.length/this.max_articles.value))
                    .attr("opacity", 0.8)
                    .raise();

                enter.append("g").attr("class", "outlet").append("circle")
                    .attr("class", "expand_circle")
                    .attr("r", this.node_circle_radius/(this.current_zoom?.k || 1))
                    .attr("cx", (d) => this.xScale(d.pos_sst))
                    .attr("cy", (d) => this.yScale(Math.abs(d.neg_sst)))
                    .attr("fill", "white")
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", (d) => d.article_ids.length === 0? 2.5 : 0)
                    .lower();

                enter.append("g").attr("class", "outlet").append("image")
                    .attr("class", "outlet_image")
                return enter;
            },
            update => {
                update.select("circle.outlet_circle")
                    .transition().duration(1000)
                    // .attr("r", node_circle_radius/(current_zoom?.k || 1))
                    .attr("cx", (d: any) => this.xScale(d.pos_sst))
                    .attr("cy", (d: any) => this.yScale(Math.abs(d.neg_sst)))
    
                update.select("circle.expand_circle")
                    .transition().duration(1000)
                    // .attr("r", node_circle_radius/(current_zoom?.k || 1))
                    .attr("cx", (d: any) => this.xScale(d.pos_sst))
                    .attr("cy", (d: any) => this.yScale(Math.abs(d.neg_sst)))
                .on("end", function() {
                    emit("update-weight-ended")
                })
                update.selectAll("circle.outlet_circle")
                .attr("fill", (d: any) => SstColors.article_num_color_scale(d.article_ids.length/this.max_articles.value))
                return update;
            }
        ) 
        const dots = svg.selectAll("g.outlet")
        dots.sort((da: any, db: any) => (da.article_ids.length - db.article_ids.length))
        if(this.current_zoom) {
            dots.attr("transform", this.current_zoom)
        }
        if(this.props.view?.type === ViewType.EntityScatter) {
            const highlight_circle = svg.selectAll("circle.outlet_circle").filter((d: any) => (this.props.highlight_nodes!.includes(d.text.split("-")[0])))
            highlight_circle.attr("fill", "blue")
        }
    }

    updateExpandedScatter(emit:any) {
        this.updateOverviewScatter(emit)
        const applyExpandStyle = this.applyExpandStyle;
        const updateNodeInfo = this.updateNodeInfo;
        const removeExpandedStyle = this.removeExpandedStyle;
        const cvThis = this; //to let events have access to the class vars

        // const svg = d3.select(`#${this.props.id}`).select("svg")
    
        // add events
        this.svg.selectAll("circle.outlet_circle")
            .style("cursor", "pointer")
            .on("mousemove", (e, d) => {
                let align_image_offset = 0
                if(this.props.view?.type === ViewType.OutletScatter) align_image_offset = 50 - 15
                d3.select(`#${this.props.id}`).select(".nodeinfo")
                    .style("left", e.offsetX + align_image_offset + 15 + "px")
                    .style("top", e.offsetY - 5 - align_image_offset + "px")
            })
            .on("mouseover", function(e, d) {
                const parentNode: any = (this as HTMLElement).parentNode
                const container: any = d3.select(parentNode)
                applyExpandStyle(container)
    
                // update tooltip
                updateNodeInfo(d as ScatterNode)
                d3.select(`#${cvThis.props.id}`).select(".nodeinfo")
                    .style("opacity", 1)
            })
            .on("mouseout", function(e, d) {
                d3.select(`#${cvThis.props.id}`).select(".nodeinfo")
                    .style("opacity", 0)
                if((d as ScatterNode).text === cvThis.clicked_node.value.text) return
                const parentNode: any = (this as HTMLElement).parentNode
                const container: any = d3.select(parentNode)
                removeExpandedStyle(container)
    
            })
            .on("click", function (e, d) {
                // if(tutorial_mode.value && tutorial_step.value < 7) { return }
                if(cvThis.clicked_node_element.value !== undefined) {
                    const parentNode: any = (cvThis.clicked_node_element.value as HTMLElement).parentNode
                    const container: any = d3.select(parentNode)
                    removeExpandedStyle(container)
                }
                cvThis.clicked_node_element.value = this
                cvThis.clicked_node.value = d as ScatterNode
                emit("node_clicked", {title: cvThis.props.view?.title, type: ViewType.CooccurrHex, d: cvThis.clicked_node.value})
            })
    
        // add images if comparing across outlets
        if(this.props.view?.type === ViewType.OutletScatter) {
            const outlets = this.svg.selectAll("g.outlet")
            const image_size = 100
            outlets.selectAll("image.outlet_image")
                .attr("href", (d: any) => `src/assets/${NodeUtils.abbr_dict[d.text.split("-")[1]]}.png`)
                .attr("height", image_size)
                .attr("width", image_size)
                .attr("x", (d: any) => this.xScale(d.pos_sst)-image_size/2)
                .attr("y", (d: any) => this.yScale(Math.abs(d.neg_sst))-image_size/2)
                .attr("opacity", 0.3)
                .attr("pointer-events", "none")
                .lower()
                .lower()
        }
    }

    applyExpandStyle(container: any) {
        container.style("filter", "brightness(90%)")
        // apply hover effect
        container.selectAll("circle.expand_circle")
            .transition().duration(100)
            .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r"))*1.5 ))
        const target_node_text = container.data()[0].text
        const other_nodes_container = d3.select(`#${this.props.id}`).selectAll("g.outlet").filter((d: any) => d.text != target_node_text)
        other_nodes_container.selectAll("image")
            .attr("opacity", 0)
        container.selectAll("image")
            .transition().duration(100)
            .attr("opacity", 0.8)
    }
    
    removeExpandedStyle(container: any) {
        container.style("filter", "brightness(100%)")
        container.selectAll("circle.expand_circle")
            .transition().duration(100)
            .attr("r", (d) => (parseFloat(container.select("circle.outlet_circle").attr("r"))))
        const target_node_text = container.data()[0].text
        const other_nodes_container = d3.select(`#${this.props.id}`).selectAll("g.outlet").filter((d: any) => d.text != target_node_text)
        other_nodes_container.selectAll("image")
            .attr("opacity", 0.3)
        container.selectAll("image")
            .transition().duration(100)
            .attr("opacity", 0.3)
    }
    
    updateNodeInfo(node_data: ScatterNode) {
        this.hovered_node_info.value = {
            text: node_data.text,
            pos_articles: node_data.pos_article_ids.length,
            neg_articles: node_data.neg_article_ids.length,
            pos_score: node_data.pos_sst,
            neg_score: node_data.neg_sst,
        }
    }

}
