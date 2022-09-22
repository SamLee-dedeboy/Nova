    <template>
        <div :id="id" class="scatter-container" :class="panel_class">
            <svg id="entitySVG" class="outlet-scatterplot" :class="panel_class"></svg>
            <div class="button-set">
                <Button v-if="expanded" class="reset-zoom p-button-secondary" @click="resetZoom">reset</Button>
            </div>
            <TooltipVue class='tooltip' 
            :id="`${id}-tooltip`" 
            :content="tooltip_content" 
            :hasWordCloud="false" 
            :words_freq="nodes_freq"
            style="z-index: 1000;"></TooltipVue>
            <NodeInfo class='nodeinfo' :node="hovered_node_info" :total_articles="total_articles" style="position:absolute; z-index:1000;pointer-events: none;"></NodeInfo>
            <Menu id="overlay_menu" ref="menu" :model="menu_items" :popup="true" 
            style="position: absolute; width: fit-content;"></Menu>
        
        </div>
    </template>
    
    <script setup lang="ts">
        import * as vue from 'vue'
        import { onMounted, computed, Ref, ref, defineEmits} from 'vue'
        import * as _ from "lodash"
        import * as d3 from "d3"

        import Menu from "primevue/menu"
        import { ScatterNode, PanelView, ViewType, Sentiment2D, OutletNodeInfo } from '../../types'

        import * as SstColors from "../utils/ColorUtils"
        import * as NodeUtils from "../utils/NodeUtils"

        import TooltipVue from "../Tooltip.vue"
        import NodeInfo from '../NodeInfo.vue'
        import {EntityScatter} from "./scatterPlot"
import { filter } from 'lodash'

    
        // initialization
        const props = defineProps({
            view: Object as () => PanelView,
            view_index: Number,
            id: String,
            highlight_nodes: Object as () => String[],
            expanded: Boolean,
            panel_class: String,
            article_num_threshold: Number,
            segment_mode: Boolean,
            segmentation: Sentiment2D, 
        })
        const emit = defineEmits(['node_clicked', 'update:segmentation', 'show_temporal', 'update-weight-ended'])
        const tooltip_content: Ref<string> = ref("") 
        const hovered_node_info: Ref<OutletNodeInfo> = ref(new OutletNodeInfo())

        const max_articles = vue.computed(() => props.view?.data.max_articles)
        const min_articles = vue.computed(() => props.view?.data.min_articles)
        const outlet_article_num_dict: Ref<any> = vue.inject("outlet_article_num_dict") || ref({})
        const total_articles = computed(() => {
            if(props.view?.type === ViewType.EntityScatter) {
                if(props.view.title === "Overall") {
                    return _.sumBy( 
                        Object.keys(outlet_article_num_dict.value), 
                        (outlet) => (outlet_article_num_dict.value[outlet])
                    )
                } else {
                    const outlet = props.view.title
                    return outlet_article_num_dict.value[outlet]
                }
            } else if(props.view?.type === ViewType.OutletScatter) {
                return _.sumBy(props.view?.data.nodes, (node:any) => (node.article_ids.length))
            } else if(props.view?.type === ViewType.CooccurrHex) {
                const outlet = props.view.title.split("-")[0]
                return outlet_article_num_dict.value[outlet]
            } else {
                return undefined
            }
        })

        const filtered_data: Ref<ScatterNode[]> = computed( () => props.view?.data.nodes.filter((node: ScatterNode) => node.article_ids.length > (props.article_num_threshold || 0)))
        const nodes_freq = computed(() => filtered_data.value?.map(node => {return {title: node.text, freq: node.article_ids.length}}))
        const clicked_node: Ref<ScatterNode> = ref(new ScatterNode())
        const clicked_node_element: Ref<any> = ref(undefined)
        const menu = ref()
        const menu_items = ref([
            {
                label: "Show co-occurrence",
                command: () => {
                    emit("node_clicked", {title: props.view?.title, type: ViewType.CooccurrHex, d: clicked_node.value})
                }
            },
        ])
        const viewBox: [number, number] = [1000, 1000]
        const margin = {top: 60, bottom: 60, right:40, left: 80} 

        const entityScatterPlot = new EntityScatter(props,margin,viewBox,filtered_data,tooltip_content,total_articles,min_articles,max_articles,clicked_node,clicked_node_element,hovered_node_info);
        
        vue.watch(() => props.highlight_nodes, (new_value, old_value) => {
            entityScatterPlot.updateCanvas(emit)
        }, {deep: true})
        
        
        vue.watch(() => props.segmentation, (new_value, old_value) => {
            let segment_point = {x: entityScatterPlot.xScale(new_value?.pos || 0.5), y: entityScatterPlot.yScale(new_value?.neg || 0.5)}
            entityScatterPlot.updateSegmentation(segment_point.x,segment_point.y)
        }, {deep: true}) 
        
        vue.watch(() => props.view, (new_view, old_view) => {
            entityScatterPlot.updateCanvas(emit) 
        }, {deep: true})
        
        vue.watch(() => props.article_num_threshold, () => {
            entityScatterPlot.updateCanvas(emit)
            entityScatterPlot.updateOverviewTooltipContent()
        })
        
        vue.watch(() => props.segment_mode, (new_value) => {
            entityScatterPlot.updateSegmentation(0.5,0.5)
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
        background-color: white;
    }
    .outlet-scatterplot {
        // overflow: hidden;
        // height: inherit;
        max-height: 100%;
        aspect-ratio: 1;
        overflow: hidden;
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
    .show-temporal {
        font-size: smaller;
        padding-top: 3px;
        padding-bottom: 3px;
        padding-left: 5px;
        padding-right: 5px;
        margin-left:5px;
    }
    </style>