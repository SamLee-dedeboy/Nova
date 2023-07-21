import { ScatterNode, OutletNodeInfo, Sentiment2D } from "../types"
import { ComputedRef, Ref } from "vue"
import * as d3 from "d3"
import * as d3_fisheye from "d3-fisheye"
import * as _ from "lodash"
import * as SstColors from "./utils/ColorUtils"
// import * as d3_fisheye from "./utils/fisheye"
import { EnterElement } from "d3"

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
d3.selection.prototype.conditionalTransition =
    function (flag, duration, delay) {
        return flag ? this.transition().duration(duration).delay(delay) : this;
    };



// var segment_controller_start_x:number
// var segment_controller_start_y:number
// let current_zoom: any = undefined

export class EntityScatter {
    props: any;
    svgId: string;
    viewBox: [number, number];
    vbWidth: number;
    vbHeight: number;
    entity_min_radius: number;
    entity_max_radius: number;
    margin: Margin;
    segment_controller_width: number;
    node_circle_radius: number;
    svg: any;
    highlight_nodes: any[];

    segment_point: SegmentPoint;
    segment_controller_start: SegmentPoint;


    show_axes: boolean;
    show_offset: boolean;
    xScale: d3.ScalePower<number, number, never>;
    yScale: d3.ScalePower<number, number, never>;
    xMax: number;
    xMin: number
    yMax: number;
    yMin: number

    zoom: any;
    current_zoom: any;

    filtered_data: Ref<ScatterNode[]>
    tooltip_content: Ref<string>
    total_articles: ComputedRef<any>
    min_articles: ComputedRef<any>
    max_articles: ComputedRef<any>
    clicked_node: Ref<ScatterNode>
    clicked_node_element: Ref<any>
    hovered_node_info: Ref<OutletNodeInfo>
    zoomable: boolean
    node_clickable: boolean
    show_highlight: boolean
    showRegionLabel: boolean
    emit_at_end: boolean
    manualTooltip: boolean
    manualTooltipID: string
    fisheye_enabled: boolean

    public constructor(
        props: any, svgId: string,
        margin: Margin, viewBox: [number, number],
        node_radius: number, segment_controller_width: number,
        show_axes: boolean,
        zoomable: boolean,
        node_clickable: boolean,
        show_offset: boolean,
        show_highlight: boolean,
        showRegionLabel: boolean,
        emit_at_end: boolean,
        filtered_data: Ref<ScatterNode[]>,
        tooltip_content: Ref<string>,
        total_articles: ComputedRef<any>,
        min_articles: ComputedRef<any>, max_articles: ComputedRef<any>,
        clicked_node: Ref<ScatterNode>, clicked_node_element: Ref<any>,
        hovered_node_info: Ref<OutletNodeInfo>,
        manualTooltip: boolean, manualTooltipID: string
    ) {
        this.props = props
        this.svgId = svgId
        this.margin = margin;
        this.viewBox = viewBox;
        this.vbWidth = this.viewBox[0] - this.margin.left - this.margin.right;
        this.vbHeight = this.viewBox[1] - this.margin.top - this.margin.bottom;
        this.segment_controller_width = segment_controller_width;
        this.node_circle_radius = node_radius;
        this.segment_point = { x: 0, y: 0 };
        this.segment_controller_start = { x: 0, y: 0 };
        this.current_zoom = undefined;
        this.highlight_nodes = []

        this.show_axes = show_axes
        this.zoomable = zoomable
        this.node_clickable = node_clickable
        this.show_offset = show_offset
        this.show_highlight = show_highlight
        this.showRegionLabel = showRegionLabel
        this.emit_at_end = emit_at_end
        this.filtered_data = filtered_data;
        this.tooltip_content = tooltip_content;
        this.total_articles = total_articles;
        this.min_articles = min_articles;
        this.max_articles = max_articles;
        this.clicked_node = clicked_node;
        this.clicked_node_element = clicked_node_element;
        this.hovered_node_info = hovered_node_info;
        this.manualTooltip = manualTooltip;
        this.manualTooltipID = manualTooltipID

        this.xMin = this.margin.left
        this.xMax = this.vbWidth + this.margin.left
        this.xScale = d3.scalePow()
            .exponent(1)
            .domain([0, 1])
            .range([this.xMin, this.xMax])
            .clamp(true)

        this.yMin = this.margin.top + this.vbHeight
        this.yMax = this.margin.top
        this.yScale = d3.scalePow()
            .exponent(1)
            .domain([0, 1])
            .range([this.yMin, this.yMax])
            .clamp(true)


        var self = this
        this.zoom = d3.zoom().scaleExtent([1, 3]).on("zoom", function (e) {
            self.handleZoom(e, self.svg)
        })
        this.fisheye_enabled = false
    }

    draw(emit): void {
        const cvThis = this
        this.initScatterSvg(this.svgId)
        let segment_point = { x: this.xScale(this.props.segmentation?.pos || 0.5), y: this.yScale(this.props.segmentation?.neg || 0.5) }
        this.updateSegmentation(segment_point.x, segment_point.y)
        this.drawSegementationController(emit)
        this.updateCanvas(emit)
        if (this.show_axes)
            this.drawAxis(emit)
        // if (this.show_offset)
        //     this.updateSegmentationOffset(this.props.adjust_offset)
        const fisheye = d3_fisheye.circular()
            .radius(200)
            .distortion(2)
            .smoothing(0.5);
        var self = this
        const svg = d3.select(`#${this.props.id}`).select("svg")
        const fisheye_indicator = svg.append("circle").attr("class", "fisheye") 
        svg.on("mousemove", function(e) {
            if(self.fisheye_enabled) {
                fisheye.focus(d3.pointer(e));
                svg.selectAll("circle.entity_circle").each(function(d: any) {
                    const fisheye_coord = fisheye([d.x, d.y])
                    d3.select(this)
                        .transition().duration(0)
                        .attr("cx", fisheye_coord[0])
                        .attr("cy", fisheye_coord[1])
                        .attr("r", (d: ScatterNode) => (1+(fisheye_coord[2]-1)/2)*self.node_circle_radius)
                })
                svg.selectAll("circle.expand_circle").each(function(d: any) {
                    const fisheye_coord = fisheye([d.x, d.y])
                    d3.select(this)
                        .transition().duration(0)
                        .attr("cx", fisheye_coord[0])
                        .attr("cy", fisheye_coord[1])
                        .attr("r", (d: ScatterNode) => (1+(fisheye_coord[2]-1)/2)*1.5*self.node_circle_radius)
                        .attr("opacity", (d: ScatterNode) => cvThis.highlight_nodes.includes(d.text)? 1:0 )
                })
                fisheye_indicator
                    .attr("cx", d3.pointer(e)[0])
                    .attr("cy", d3.pointer(e)[1])
                    .attr("r", 100)
                    .attr("stroke", "black")
                    .attr("stroke-width", "1")
                    .attr("fill", "none")

            }
        });
    }

    checkProximity(d: any, focus_point: any, range: number=100) {
        const x = this.xScale(d.pos_sst)
        const y = this.yScale(Math.abs(d.neg_sst))
        return Math.abs(x - focus_point[0]) < range && Math.abs(y - focus_point[1]) < range
    }

    /* Exposed for event handling */
    resetView() {
        const svg = d3.select(`#${this.props.id}`).select("svg")
        svg.call(this.zoom.transform, d3.zoomIdentity)
        svg.selectAll("g.axis_x")
            .call(this.zoom.transform, d3.zoomIdentity)
        svg.selectAll("g.axis_y")
            .call(this.zoom.transform, d3.zoomIdentity)
        svg.selectAll("g.entity")
            .call(this.zoom.transform, d3.zoomIdentity)
        this.current_zoom = d3.zoomIdentity
    }

    updateCanvas(emit: any) {
        this.updateExpandedScatter(emit)
    }

    updateSegmentation(x: number, y: number, animation = false): void {
        this.segment_point.x = x;
        this.segment_point.y = y;

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
            .conditionalTransition(animation, 1000, 0)
            .attr("x", this.margin.left)
            .attr("y", this.margin.top)
            .attr("width", (d) => this.segment_point.x - this.margin.left)
            .attr("height", (d) => this.segment_point.y - this.margin.top)
        // .lower()
        // neu
        const neu_rect: any = segment_group.selectAll("rect.neu")
        segment_group.enter().select("g.segmentation").append("rect")
            .attr("class", "neu")
            .attr("fill", SstColors.neu_color)
            .style("filter", `brightness(${SstColors.brightness}%)`)
            .merge(neu_rect)
            .conditionalTransition(animation, 1000, 0)
            .attr("x", this.margin.left)
            .attr("y", (d) => this.segment_point.y)
            .attr("width", (d) => this.segment_point.x - this.margin.left)
            .attr("height", (d) => this.vbHeight - this.segment_point.y + this.margin.top)

        // pos
        const pos_rect: any = segment_group.selectAll("rect.pos")
        segment_group.enter().select("g.segmentation").append("rect")
            .attr("class", "pos")
            .attr("fill", SstColors.pos_color)
            .style("filter", `brightness(${SstColors.brightness}%)`)
            .merge(pos_rect)
            .conditionalTransition(animation, 1000, 0)
            .attr("x", (d) => this.segment_point.x)
            .attr("y", (d) => this.segment_point.y)
            .attr("width", (d) => this.vbWidth - this.segment_point.x + this.margin.left)
            .attr("height", (d) => this.vbHeight - this.segment_point.y + this.margin.top)
        // mixed
        const mixed_rect: any = segment_group.selectAll("rect.mixed")
        segment_group.enter().select("g.segmentation").append("rect")
            .attr("class", "mixed")
            .attr("fill", "url(#diagonalHatch)")//SstColors.mixed_color)
            .style("filter", `brightness(${SstColors.brightness}%)`)
            .merge(mixed_rect)
            .conditionalTransition(animation, 1000, 0)
            .attr("x", (d) => this.segment_point.x)
            .attr("y", this.margin.top)
            .attr("width", (d) => this.vbWidth - this.segment_point.x + this.margin.left)
            .attr("height", (d) => this.segment_point.y - this.margin.top)
        svg.selectAll("g.segmentation")
            .style("opacity", this.props.segment_mode ? 1 : 0)
            .style("pointer-events", "none")
        svg.selectAll("rect.segment-controller")
            .data([{ x: this.segment_point.x - this.segment_controller_width / 2, y: this.segment_point.y - this.segment_controller_width / 2 }])
            .conditionalTransition(animation, 1000, 0)
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
        // .attr("x", () => (segment_point.x-segment_controller_width/2))
        // .attr("y", () => (segment_point.y-segment_controller_width/2))
        // if(this.props.expanded)
        //     this.updateCategorization()
        if (this.showRegionLabel)
            this.updateRegionLabel(this.segment_point)
    }

    updateRegionLabel(segment_point: SegmentPoint) {
        const svg = d3.select(`#${this.props.id}`).select("svg")
        //
        // set each label individually for positions & colors
        //

        // positive
        svg.selectAll("text.pos-region-label")
            .data(["Positive"])
            .join("text")
            .attr("class", " region-label pos-region-label")
            .attr("x", (segment_point.x + this.xMax) / 2)
            .attr("y", (segment_point.y + this.yMin) / 2)
            .attr("fill", SstColors.pos_color)
            .text(d => d)

        // negative
        svg.selectAll("text.neg-region-label")
            .data(["Negative"])
            .join("text")
            .attr("class", " region-label neg-region-label")
            .attr("x", (segment_point.x + this.xMin) / 2)
            .attr("y", (segment_point.y + this.yMax) / 2)
            .attr("fill", SstColors.neg_color)
            .text(d => d)

        // neutral
        svg.selectAll("text.neu-region-label")
            .data(["Neutral"])
            .join("text")
            .attr("class", " region-label neu-region-label")
            .attr("x", (segment_point.x + this.xMin) / 2)
            .attr("y", (segment_point.y + this.yMin) / 2)
            .attr("fill", SstColors.neu_color)
            .text(d => d)

        // mixed
        svg.selectAll("text.mix-region-label")
            .data(["Mixed"])
            .join("text")
            .attr("class", " region-label mix-region-label")
            .attr("x", (segment_point.x + this.xMax) / 2)
            .attr("y", (segment_point.y + this.yMax) / 2)
            .attr("fill", SstColors.mixed_color)
            .text(d => d)

        //
        // set all label styles together
        //
        svg.selectAll("text.region-label")
            .attr("text-anchor", "middle")
            .attr("font-size", "4rem")
            .attr("opacity", "0.5")
            .attr("filter", "brightness(50%)")
            // .attr("font-family", "Comic Sans MS")
            // .attr("font-family", "Impact")
            // .attr("font-family", "Segoe Script")
            .attr("font-family", "MV Boli")
            .attr("font-weight", "bold")
            .attr("pointer-events", "none")
    }

    updateCategorization(): void {
        let bind_data: ScatterNode[] = this.filtered_data.value
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
            .attr("x", 1.03 * this.vbWidth)
            .attr("dy", 15)
            .text(d => `${d}: ${ctg_nodes[d].length}`)
    }

    categorizeNode(node) {
        const pos_threshold = this.xScale.invert(this.segment_point.x)
        const neg_threshold = this.yScale.invert(this.segment_point.y)
        if (node.pos_sst < pos_threshold && node.neg_sst < neg_threshold) return "neu"
        if (node.pos_sst < pos_threshold && node.neg_sst > neg_threshold) return "neg"
        if (node.pos_sst > pos_threshold && node.neg_sst < neg_threshold) return "pos"
        if (node.pos_sst > pos_threshold && node.neg_sst > neg_threshold) return "mix"
        return "unknown"
    }


    handleZoom(e, svg) {
        // const svg = d3.select(`#${props.id}`).select("svg")
        const entity_group = svg.selectAll("g.entity")
            .attr("transform", e.transform)

        entity_group.selectAll("circle")
            .attr("r", this.node_circle_radius / e.transform.k)

        svg.selectAll("g.axis_x")
            .attr("transform", `translate(${e.transform.x},${this.margin.top + this.vbHeight}) scale(${e.transform.k})`)

        svg.selectAll("g.axis_y")
            .attr("transform", `translate(${this.margin.left},${e.transform.y}) scale(${e.transform.k})`)
        svg.selectAll("g.segmentation > rect")
            .attr("transform", e.transform)
        const segment_controller = svg.selectAll("rect.segment-controller");
        segment_controller
            .attr("transform", e.transform)
            .attr("width", this.segment_controller_width / e.transform.k)
            .attr("height", this.segment_controller_width / e.transform.k)
            .attr("x", () => (this.segment_point.x - (this.segment_controller_width / e.transform.k) / 2))
            .attr("y", () => (this.segment_point.y - (this.segment_controller_width / e.transform.k) / 2));

        this.current_zoom = e.transform
    }
    initScatterSvg(svgID: string) {
        this.svg = d3.select(`#${svgID}`);
        this.svg.attr("viewBox", `0 0 ${this.viewBox[0]} ${this.viewBox[1]}`);
        d3.select(`#${this.props.id}`).select("div.tooltip").style("opacity", 0);
        d3.select(`#${this.props.id}`).select(".nodeinfo").style("opacity", 0);
        this.svg.append("g").attr("class", "node_group");

        // this.updateOverviewTooltipContent();
    }

    drawSegementationController(emit) {
        var svg = this.svg
        var self = this
        if (this.zoomable) {
            svg.call(this.zoom)
                .on("mousedown.zoom", null)
                .on("touchstart.zoom", null)
                .on("touchmove.zoom", null)
                .on("touchend.zoom", null);
        }
        const drag = d3.drag()
            .on("start", (e, d) => {
                self.segment_controller_start.x = e.x
                self.segment_controller_start.y = e.y
                svg.select('rect.segment-controller').attr("stroke", "black")
            })
            .on("drag", (e: any, d: any) => {
                let current_scale;
                const segmentRect = svg.select('rect.segment-controller');
                //select element by id
                if (segmentRect.attr("transform") === null) {
                    current_scale = 1;
                }
                //case where we have transformed the circle 
                else {
                    const current_scale_string = segmentRect.attr("transform")?.split(' ')[1] || "";
                    current_scale = +current_scale_string.substring(6, current_scale_string.length - 1);
                }
                const end_x = self.segment_controller_start.x + ((e.x - self.segment_controller_start.x) / current_scale)
                const end_y = self.segment_controller_start.y + ((e.y - self.segment_controller_start.y) / current_scale)
                segmentRect
                    // .attr("x", d.x=(end_x-segment_controller_width/2) + (segment_controller_width-segment_controller_width/(current_zoom?.k || 1))/2)
                    // .attr("y", d.y=(end_y-segment_controller_width/2) + (segment_controller_width-segment_controller_width/(current_zoom?.k || 1))/2)
                    .attr("x", d.x = (end_x - (self.segment_controller_width / (self.current_zoom?.k || 1)) / 2))
                    .attr("y", d.y = (end_y - (self.segment_controller_width / (self.current_zoom?.k || 1)) / 2))
                    .raise();

                let segment_point = { x: Math.max(self.margin.left, Math.min(end_x, self.vbWidth + self.margin.left)), y: Math.max(self.margin.top, Math.min(end_y, self.vbHeight)) }
                // let segment_point = {x: end_x, y: end_y}
                self.updateSegmentation(segment_point.x, segment_point.y)
                // //console.log({pos: self.xScale.invert(self.segment_point.x), neg: self.yScale.invert(self.segment_point.y)})
                // self.setSegmentation({pos: self.xScale.invert(self.segment_point.x), neg: self.yScale.invert(self.segment_point.y)})
                if (!self.emit_at_end)
                {
                  let segementPoint : Sentiment2D =  { pos: self.xScale.invert(self.segment_point.x), neg: self.yScale.invert(self.segment_point.y) }
                  emit("update:segmentation", segementPoint) 
                }  
                   
            })
            .on("end", function (e, d) {
                d3.select(this).attr("stroke", null)
                if (self.emit_at_end){
                    let segementPoint : Sentiment2D = { pos: self.xScale.invert(self.segment_point.x), neg: self.yScale.invert(self.segment_point.y) }
                    emit("update:segmentation", segementPoint)
                }
            })

        //Segment Controller Rect
        this.svg.append("rect")
            .data([{ x: this.segment_point.x - this.segment_controller_width / 2, y: this.segment_point.y - this.segment_controller_width / 2 }])
            .attr("class", "segment-controller")
            .attr("id", "segment-controller")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("width", this.segment_controller_width)
            .attr("height", this.segment_controller_width)
            .attr("fill", "white")
            .style("cursor", "pointer")
            .style("opacity", this.props.segment_mode ? 1 : 0)
            .call(drag as any)
            .on("mouseover", function (e, d) {
                d3.select(this).attr("stroke", "black")
            })
            .on("mouseout", function (e, d) {
                d3.select(this).attr("stroke", null)
            })
    }

    drawAxis(emit: any) {
        this.svg.append("g")
            .attr("class", "axis_x")
            .attr("transform", `translate(0, ${this.margin.top + this.vbHeight})`)
            .call(d3.axisBottom(this.xScale));

        this.svg.append("text")
            .attr("class", "axis_x_label")
            .attr("transform", `translate(${this.margin.left + this.vbWidth - 70}, ${this.margin.top + this.vbHeight - 30})`)
            .attr("text-anchor", "middle")
            // .text("+ Sentiment")
            .text("Pos Polarization")
            .attr("fill", '#2c8c94')
            .style("font-weight", "bold");


        this.svg.append("g")
            .attr("class", "axis_y")
            .attr("transform", `translate(${this.margin.left},0)`)
            .call(d3.axisLeft(this.yScale))
            .raise();

        this.svg.append("text")
            .attr("class", "axis_y_label")
            .attr("transform", `translate(${this.margin.left + 70}, ${this.margin.top + 30})`)
            .attr("text-anchor", "middle")
            // .text("- Sentiment")
            .text("Neg Polarization")
            .attr("fill", "#e37213")
            .style("font-weight", "bold")
    }

    enterEntityScatter(enter, colorScale) {
        const duration = 100
        enter.append("g").attr("class", "entity")
        .call(g => g.append("circle")
                .attr("class", "expand_circle")
                .attr("r", this.node_circle_radius*1.5 / (this.current_zoom?.k || 1))
                .attr("opacity", 0)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("stroke-dasharray", (d) => d.article_ids.length === 0 ? 2.5 : 0)
                .attr("cx", (d) => this.xScale(d.pos_sst) || 0)
                .attr("cy", (d) => this.yScale(Math.abs(d.neg_sst)) || 0)
        )
        .call(g => g.append("circle")
            .attr("class", "entity_circle")
            .attr("r", this.node_circle_radius / (this.current_zoom?.k || 1))
            .attr("fill", (d) => {
                let color = colorScale(d.article_ids.length) || 0
                return (d.article_ids.length === 0 || color === 0) ? "white" : color
            })
            .attr("stroke", "black")
            .attr("opacity", 1)
            .attr("cx", (d) => this.xScale(d.pos_sst) || 0)
            .attr("cy", (d) => this.yScale(Math.abs(d.neg_sst)) || 0)
        )
        .call(g => g.append("text")
            .attr("class", "node_label")
            .attr("x", (d: any) => this.xScale(d.pos_sst) || 0)
            .attr("y", (d: any) => this.yScale(Math.abs(d.neg_sst)) || 0)
            .text((d) => {return d.text})
            .attr("font-size", "1.5rem")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
            .attr("pointer-events", "none")
            .attr("opacity", 0)
        )
    }

    updateOverviewScatter(emit: any) {
        const svg = d3.select(`#${this.props.id}`).select("svg")

        let bind_data: ScatterNode[] = this.filtered_data.value
        bind_data.sort((a, b) => a.article_ids.length - b.article_ids.length)
        // //console.log(bind_data)
        var self = this

        const colorScale = d3.scaleLog().domain([1, this.max_articles.value]).range(['#FFFFFF', '#5e0053']);
        // const colorScale = d3.scaleSequential( (d) => d3.interpolateReds(logScale(d)))

        const node_group = svg.select("g.node_group")
        const duration = 20
        const corners_x = [0, this.xMax]
        const corners_y = [0, this.yMax]
        let animated_num = 0
        node_group.selectAll("g.entity")
            .data(bind_data, function (d: any, i) { 
                d.x = self.xScale(d.pos_sst)
                d.y = self.yScale(Math.abs(d.neg_sst))
                d.i = i
                return d.text 
            })
            .join(
                enter =>  this.enterEntityScatter(enter, colorScale),
                update => {
                    update.call(g => g.select("circle.entity_circle")
                        // .transition().duration(1000)
                        // .attr("cx", (d: any) => this.xScale(d.pos_sst))
                        // .attr("cy", (d: any) => this.yScale(Math.abs(d.neg_sst))))
                        .attr("opacity", 0)
                        .attr("cx", () => corners_x[Math.floor(Math.random() * 2)])
                        .attr("cy", () => corners_y[Math.floor(Math.random() * 2)])
                        .transition()
                        .delay((d) => d.i*duration)
                        .duration(duration)
                        .attr("opacity", 1)
                        .attr("cx", (d) => this.xScale(d.pos_sst) || 0)
                        .attr("cy", (d) => this.yScale(Math.abs(d.neg_sst)) || 0)
                        .on("end", () => {
                            animated_num += 1
                            if(animated_num === bind_data.length)
                                this.fisheye_enabled = true
                        })
                        .call(g => g.select("circle.expand_circle")
                            .transition().duration(1000)
                            .attr("cx", function (d: any) {
                                return self.xScale(d.pos_sst)
                            })
                            .attr("cy", (d: any) => this.yScale(Math.abs(d.neg_sst)))
                        )
                        .call(g => g.selectAll("circle.entity_circle")
                            .attr("fill", (d: any) => d.article_ids.length === 0 ? "white" : colorScale(d.article_ids.length))
                        )
                    )
                }
            )
    }

    updateExpandedScatter(emit: any) {
        this.updateOverviewScatter(emit)
        const updateNodeInfo = this.updateNodeInfo;
        const cvThis = this; //to let events have access to the class vars

        // const svg = d3.select(`#${this.props.id}`).select("svg")

        // add events
        var svg = this.svg
        svg.selectAll("circle.entity_circle")
            .style("cursor", "pointer")
            .on("mousemove", (e, d) => {
                let align_image_offset = 0
                // if(this.props.view?.type === ViewType.OutletScatter) align_image_offset = 50 - 15
                d3.select(`#${this.props.id}`).select(".nodeinfo")
                    .style("left", e.offsetX + align_image_offset + 15 + "px")
                    .style("top", e.offsetY - 5 - align_image_offset + "px")
            })
            .on("mouseover", function (e, d) {
                const parentNode: any = (this as HTMLElement).parentNode
                const container: any = d3.select(parentNode)
                cvThis.applyExpandStyle(container)

                if (cvThis.manualTooltip) {
                    const text = container.data()[0].text
                    d3.select(cvThis.manualTooltipID).text(text.replaceAll("_", " "))
                    return true;
                }


                // update tooltip
                updateNodeInfo(d as ScatterNode, cvThis)
                d3.select(`#${cvThis.props.id}`).select(".nodeinfo")
                    .style("opacity", 1)
                if (cvThis.show_highlight) {
                    if (!cvThis.highlight_nodes.includes(d.text)) {
                        const cancel_highlight_node = svg.selectAll("g.entity").filter((d: any) => !cvThis.highlight_nodes.includes(d.text))
                        cvThis.removeNodeLabel(cancel_highlight_node, cvThis)
                        cvThis.removeExpandedStyle(cancel_highlight_node)
                    }
                    cvThis.addNodeLabel(container, cvThis)
                }
            })
            .on("mouseout", function (e, d) {
                d3.select(`#${cvThis.props.id}`).select(".nodeinfo")
                    .style("opacity", 0)
                if (cvThis.highlight_nodes.includes(d.text)) return
                const parentNode: any = (this as HTMLElement).parentNode
                const container: any = d3.select(parentNode)

                if (!cvThis.show_highlight || !cvThis.highlight_nodes.includes(d.text)) {
                    cvThis.removeExpandedStyle(container)
                }
                if (cvThis.show_highlight) {
                    cvThis.removeNodeLabel(container, cvThis)
                    const highlight_node = svg.selectAll("g.entity").filter((d: any) => cvThis.highlight_nodes.includes(d.text))
                        .raise()
                    cvThis.applyExpandStyle(highlight_node)
                    // cvThis.addNodeLabel(highlight_node, cvThis)
                }
            })
            .on("click", function (e, d) {
                if (!cvThis.node_clickable) return
                // if the clicked element is already highlighted, remove highlight
                if (cvThis.highlight_nodes.includes(d.text)) {
                    if(cvThis.props.selected_entity_name === d.text) return
                    cvThis.highlight_nodes.splice(cvThis.highlight_nodes.indexOf(d.text), 1)
                    const container = d3.select(this.parentNode)
                    cvThis.removeExpandedStyle(container)
                } else {
                    emit("update:selected_entity_name", d.text)
                }
            })
    }

    applyExpandStyle(container: any) {
        container.style("filter", "brightness(90%)")
        // apply hover effect
        container.select("circle.expand_circle")
            .transition().duration(100)
            // .attr("r", (d) => (parseFloat(container.select("circle.entity_circle").attr("r")) * 1.5))
            .attr("r", (d) => (this.node_circle_radius * 1.5))
            .attr("opacity", 1)
        this.addNodeLabel(container, this)
    }

    removeExpandedStyle(container: any) {
        container.style("filter", "brightness(100%)")
        container.select("circle.expand_circle")
            .transition().duration(100)
            // .attr("r", (d) => (parseFloat(container.select("circle.entity_circle").attr("r"))))
            .attr("r", (d) => (this.node_circle_radius))
            .attr("opacity", 0)
        this.removeNodeLabel(container, this)

        // const target_node_text = container.data()[0].text
        // const other_nodes_container = d3.select(`#${cvThis.props.id}`).selectAll("g.entity").filter((d: any) => d.text !== target_node_text)
        // other_nodes_container.selectAll("image")
        //     .attr("opacity", 0.3)
        // container.selectAll("image")
        //     .transition().duration(100)
        //     .attr("opacity", 0.3)
    }

    setHighlightNode(node_text, emit) {
        // if (!this.node_clickable) return
        // if (this.clicked_node_element.value) {
        //     const parentNode: any = (this.clicked_node_element.value as HTMLElement).parentNode
        //     const container: any = d3.select(parentNode)
        //     this.removeExpandedStyle(container)
        // }
        // const highlight_node: any = d3.selectAll("g.entity").filter((d: any) => d.text == node_text).nodes()[0]
        // this.applyExpandStyle(d3.select(highlight_node))

        // this.clicked_node_element.value = d3.select(highlight_node).select("circle.entity_circle").node()
        // this.clicked_node.value = d3.select(highlight_node).data()[0] as ScatterNode
        // emit("node_clicked", this.clicked_node.value.text)

        // if the clicked element is already highlighted, remove highlight
        if (this.highlight_nodes.includes(node_text)) {
            const highlight_node: any = d3.selectAll("g.entity").filter((d: any) => d.text === node_text).nodes()[0]
            console.log("remove highlight", node_text, highlight_node)
            this.removeExpandedStyle(d3.select(highlight_node))
        } else {
            this.highlight_nodes.push(node_text)
            const highlight_node: any = d3.selectAll("g.entity").filter((d: any) => d.text === node_text).nodes()[0]
            this.applyExpandStyle(d3.select(highlight_node))
        }

    }

    updateNodeInfo(node_data: ScatterNode, cvThis) {
        cvThis.hovered_node_info.value = {
            text: node_data.text,
            pos_articles: node_data.pos_article_ids.length,
            neg_articles: node_data.neg_article_ids.length,
            pos_score: node_data.pos_sst,
            neg_score: node_data.neg_sst,
        }
    }

    addNodeLabel(container: any, cvThis) {
        container.select("text.node_label").attr("opacity", 1)
        return
        container.selectAll("text.node_label")
            .data((d) => [d])
            .join("text")
            .attr("class", "node_label")
            .attr("x", (d: any) => cvThis.xScale(d.pos_sst))
            .attr("y", (d: any) => cvThis.yScale(Math.abs(d.neg_sst)))
            .text((d) => d.text)
            .attr("font-size", "1.5rem")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
            .attr("pointer-events", "none")
    }
    removeNodeLabel(container: any, cvThis) {
        container.select("text.node_label").attr("opacity", 0)
        // container.selectAll("text.node_label").remove()
    }
}
