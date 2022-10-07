import {ComputedRef, Ref} from "vue"
import * as d3 from "d3"
import * as _ from "lodash"
import * as SstColors from "./utils/ColorUtils"

interface Margin {
    top: number,
    bottom: number,
    left: number,
    right: number,
    vertical: number
}
export class Legend {
    props: any;
    svgId: string;
    viewBox: [number, number];
    vbWidth: number;
    vbHeight: number;
    margin: Margin;
    row_height: number;
    font_size: number;
    svg: any;

    public constructor(
        props:any, svgId: string, 
        margin:Margin, viewBox:[number,number], 
        row_height: number,
        font_size: number = 0.8,
        ){
        this.props = props
        this.svgId = svgId
        this.margin = margin;
        this.row_height = row_height
        this.font_size = font_size
        this.viewBox = viewBox;
        this.vbWidth = this.viewBox[0] - this.margin.left - this.margin.right;
        this.vbHeight = this.viewBox[1] - this.margin.top - this.margin.bottom;
    }
    draw(): void {
        this.initScatterSvg(this.svgId)
        this.drawLegend()

    }

    initScatterSvg(svgID:string){
        this.svg = d3.select(`#${svgID}`);
        this.svg.attr("viewBox", `0 0 ${this.viewBox[0]} ${this.viewBox[1]}`);
    }

    drawLegend() {
        const svg = this.svg
        const margin = this.margin
        const row_height = this.row_height
        var index = 0
        for(const [title, color] of Object.entries(this.props.color_dict!)) {
            const circle = svg.append("circle")
                .attr("cx", margin.left)
                .attr("cy", margin.top + index*(2*row_height + margin.vertical))
                .attr("r", row_height)
                // .style("filter", `brightness(${SstColors.brightness}%)`)
                .style("fill", color)
                .style("stroke", 'black')
                .style("stroke-opacity", '15%');

            if(this.props.filter) circle.style("filter", `brightness(${SstColors.brightness}%)`)
            if(title === "no mention") {
                circle.attr("stroke", "black")
                    .attr("stroke-dasharray", 1.5)
            }

            svg.append("text")
                .attr("x", margin.left + 3*row_height)
                .attr("y", margin.top + index*(2*row_height + margin.vertical))
                .text(title)
                .attr("font-size", "0.6rem")
                .attr("dominant-baseline", "middle")
                .style("font-family", 'Roboto')
                .style("font-weight", '100')
                .style("font-size", this.font_size + 'rem')
            // index is used for vertical offset calculation
            index += 1
        }
    }
}