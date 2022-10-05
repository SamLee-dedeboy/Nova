<template>
    <div :id="id" class="scatter-container" >
        <svg :id="svgId" class="entity-scatterplot" >
            <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5"/>
                <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
            </pattern>
        </svg>
        <div class="button-set">
            <Button class="reset-zoom p-button-secondary" @click="resetZoom">reset</Button>
        </div>
        <NodeInfo class='nodeinfo' :node="hovered_node_info" :total_articles="total_articles" style="position:absolute; z-index:1000;pointer-events: none;"></NodeInfo>
    
    </div>
</template>

<script setup lang="ts">
    /**
     * libraries
     */
    import * as vue from 'vue'
    import { onMounted, computed, Ref, ref, defineEmits} from 'vue'
    import * as d3 from "d3"
    import * as _ from "lodash"
    /**
     * utils & types
     */
    import { ScatterNode, Sentiment2D, OutletNodeInfo, EntityScatterView } from '../types'
    import * as SstColors from "./utils/ColorUtils"

    /**
     * components
     */
    import NodeInfo from './NodeInfo.vue'
    import {EntityScatter} from "./scatterPlot"


    // initialization
    const props = defineProps({
        view: Object as () => EntityScatterView,
        view_index: Number,
        id: String,
        article_num_threshold: Number,
        segment_mode: Boolean,
        segmentation: Sentiment2D
    })
    const emit = defineEmits(['node_clicked', 'update:segmentation', 'show_temporal', 'update-weight-ended'])
    const tooltip_content: Ref<string> = ref("") 
    const hovered_node_info: Ref<OutletNodeInfo> = ref(new OutletNodeInfo())


    const max_articles = vue.computed(() => props.view?.data.max_articles)
    const min_articles = vue.computed(() => props.view?.data.min_articles)
    const outlet_article_num_dict: Ref<any> = vue.inject("outlet_article_num_dict") || ref({})
    const total_articles = computed(() => {
        return _.sumBy( 
            Object.keys(outlet_article_num_dict.value), 
            (outlet) => (outlet_article_num_dict.value[outlet])
        )
    })

    const filtered_data: Ref<ScatterNode[]> = computed( () => props.view?.data.nodes.filter((node: ScatterNode) => node.article_ids.length > (props.article_num_threshold || 0)))
    const clicked_node: Ref<ScatterNode> = ref(new ScatterNode())
    const clicked_node_element: Ref<any> = ref(undefined)
    const viewBox: [number, number] = [1000, 1000]
    const margin = {top: 60, bottom: 60, right:40, left: 80} 
    const node_radius = 10
    const segment_controller_width = 12
    const show_axes = true
    const show_offset = false
    const show_highlight = false
    const zoomable = true
    const node_clickable = true
    const svgId = "entitySvg"
    const entityScatterPlot = new EntityScatter(
        props, 
        svgId,
        margin, viewBox, 
        node_radius, segment_controller_width,
        show_axes,
        zoomable,
        node_clickable,
        show_offset,
        show_highlight,
        filtered_data, 
        tooltip_content, 
        total_articles, min_articles, max_articles, 
        clicked_node, clicked_node_element, 
        hovered_node_info
    );
    
    
    vue.watch(() => props.view, (new_view, old_view) => {
        entityScatterPlot.updateCanvas(emit) 
    }, {deep: true})
    
    vue.watch(() => props.article_num_threshold, () => {
        entityScatterPlot.updateCanvas(emit)
        // entityScatterPlot.updateOverviewTooltipContent()
    })
    
    vue.watch(() => props.segment_mode, (new_value) => {
        let segment_point = {x: entityScatterPlot.xScale(props.segmentation?.pos || 0.5), y: entityScatterPlot.yScale(props.segmentation?.neg || 0.5)}
        entityScatterPlot.updateSegmentation(segment_point.x, segment_point.y)
        const svg = d3.select(`#${props.id}`).select("svg")
        svg.select("rect.segment-controller").style("opacity", new_value?1:0).raise()
    })
    
    onMounted(() => {
        // Render Scatter
        entityScatterPlot.draw(emit);
    })
    function resetZoom() {
        entityScatterPlot.resetView()
    }
    
</script>

<style scoped lang="scss">
.scatter-container {
    width: inherit;
    height:inherit;
}
.scatter-container {
    background-color: white;
}
.entity-scatterplot {
    // overflow: hidden;
    // height: inherit;
    max-height: 100%;
    aspect-ratio: 1;
    // overflow: hidden;
    // height: auto;
    // width: inherit;
    // aspect-ratio: 1;
    // height: 95vh;
}
.tooltip {
    transform-origin: top left;
    min-width: 200px;
}
.button-set {
    position: absolute;
    right: 2%;
    bottom: 1%;
    display:inline-flex;
}
.reset-zoom {
    font-size: smaller;
    padding-top: 3px;
    padding-bottom: 3px;
    padding-left: 5px;
    padding-right: 5px;
}
</style>