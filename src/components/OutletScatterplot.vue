<template>
    <div :id="id" class="outlet-scatter" >
        <svg :id="svgId" class="outlet-scatterplot" ></svg>
        <!-- <NodeInfo class='nodeinfo' :node="hovered_node_info" :total_articles="total_articles" style="position:absolute; z-index:1000;pointer-events: none;"></NodeInfo> -->
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
    import { useStore } from 'vuex'
    /**
     * utils & types
     */
    import { ScatterNode, Sentiment2D, OutletNodeInfo, EntityScatterView } from '../types'
    import * as SstColors from "./utils/ColorUtils"

    /**
     * components
     */
    import { EntityScatter } from "./scatterPlot"
    import NodeInfo from './NodeInfo.vue'


    // initialization
    const props = defineProps({
        view: EntityScatterView,
        highlight_node_text: String,
        adjust_offset: Number,
        id: String,
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
    const node_radius = 30
    const segment_controller_width = 52
    const show_axes = false
    const zoomable = false
    const show_offset = true
    const show_highlight = true
    const node_clickable = false
    const show_region_label = false
    const emit_at_end = true
    const svgId = "outletSvg"
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
        show_region_label,
        emit_at_end,
        filtered_data, 
        tooltip_content, 
        total_articles, min_articles, max_articles, 
        clicked_node, clicked_node_element, 
        hovered_node_info,
    );

    vue.watch(() => props.view, (new_view, old_view) => {
        entityScatterPlot.updateCanvas(emit) 
    }, {deep: true})
    vue.watch(() => props.highlight_node_text, (new_value, old_value) => {
        entityScatterPlot.updateCanvas(emit) 
    })
    vue.watch(() => props.adjust_offset, (new_value, old_value) => {
        entityScatterPlot.updateSegmentationOffset(new_value || 0.5)
    })

    // vue.watch(() => props.segmentation, (new_value, old_value) => {
    //     let segment_point = {x: entityScatterPlot.xScale(new_value?.pos || 0.5), y: entityScatterPlot.yScale(new_value?.neg || 0.5)}
    //     entityScatterPlot.updateSegmentation(segment_point.x,segment_point.y, true)
    // }, {deep: true}) 
    // vue.watch(() => segmentation.value, (new_value, old_value) => {
    //     if(new_value.pos !== old_value.pos && new_value.neg !== old_value.neg) {
    //         console.log(new_value.pos, old_value.pos, new_value.neg, old_value.neg)
    //         let segment_point = {x: entityScatterPlot.xScale(new_value.pos), y: entityScatterPlot.yScale(new_value.neg)}
    //         entityScatterPlot.updateSegmentation(segment_point.x,segment_point.y, true)
    //     }
    // }, {deep: true}) 
    
    onMounted(() => {
        // Render Scatter
        entityScatterPlot.draw(emit);
    })

    function updateSegmentation(segmentation) {
        let segment_point = {x: entityScatterPlot.xScale(segmentation.pos), y: entityScatterPlot.yScale(segmentation.neg)}
        entityScatterPlot.updateSegmentation(segment_point.x,segment_point.y, true)
    }

    function resetZoom() {
        entityScatterPlot.resetView()
    }
    defineExpose({
        updateSegmentation
    })
    
</script>

<style scoped lang="scss">
.scatter-container {
    width: inherit;
    height:inherit;
}
.scatter-container {
    background-color: white;
}
.outlet-scatterplot {
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
    left: 78.5%;
    top: 0%;
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