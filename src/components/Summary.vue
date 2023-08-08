<script setup lang="ts">
/**
 * libraries
 */
import * as vue from "vue"
import NoteEditor from '../components/NoteEditor.vue';


/**
 * vue components
 */
import HexCooccurrence from "./HexCooccurrence.vue"
import { useUserDataStore } from "../store/userStore"

const store = useUserDataStore()
const clicked_hexview = vue.computed(() => store.clicked_hexview)
const user_hex_selection = vue.computed(() => store.hex_selection) 
const segmentation = vue.computed(() => store.segmentation)
const notes = vue.computed(() => store.notes)
const note_created = vue.computed(() => Object.keys(notes.value).length > 0)
vue.onMounted(() => {
    console.log('mounted: ', clicked_hexview.value)

})
</script>

<template>

<div v-if="!note_created">
    No summary created yet.
</div>
<div v-else class="page-container" style="display: flex; width: 80vw; height: 80vh; z-index:1000; background-color: white">
    <div class="summary-container" style="display: flex; flex-direction: column; width: 100%">
        <h2 class="component-header summary-header"> 
            Summary
        </h2>
        <div class="content-container" style="display: flex; flex-direction: column; flex: 1; width: 100%; height: 100%; overflow-y:auto;">
            <div v-for="hexview, index in clicked_hexview" class="item-container" style="display: flex; flex-direction: column; height: 100%; width: 100%; min-width: 50%;">
                <div class="hexview-header" style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; height: 10%;">
                    <div class="hexview-title" style="display: flex; flex-direction: row; align-items: center; height: 100%; width: 100%;">
                        <div class="hexview-title-text" style="font-size: 1.5em; font-weight: bold; margin-left: 1em;">{{hexview.outlet}}</div>
                        <div class="hexview-title-text" style="font-size: 1.5em; font-weight: bold; margin-left: 1em;">{{hexview.center_entity}}</div>
                    </div>
                </div>
                <div class="hexview-container" style="display: flex; width: 100%;">
                    <div class="user-hexview-container" style="flex:1">
                        <div class="hive-header user-hive-header" style="left: 47%">Your belief </div>
                        <HexCooccurrence  class="summary-user-hexview" 
                            :id="`summary_user_hexview_${index}`" :entity_cooccurrences="hexview.data"
                            mode="user-fixed"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :segmentation="segmentation" 
                            :show_blink="true"
                            :show_label="true"
                            :user_hex_selection="user_hex_selection[hexview.outlet]">
                        </HexCooccurrence>
                        </div>
                    <div class="data-hexview-container" style="flex:1">
                        <div class="hive-header data-hive-header" style="left: 31%">Data suggested</div>
                        <HexCooccurrence class="summary-data-hexview" 
                            :id="`summary_data_hexview_${index}`" :entity_cooccurrences="hexview.data"
                            mode="data"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :segmentation="segmentation" 
                            :show_blink="true"
                            :show_label="true"
                            :show_hex_appear="false"
                            :user_hex_selection="user_hex_selection[hexview.outlet]">
                        </HexCooccurrence>
                    </div>
                    <div class="summary-notes-container" style="height: 100%; flex: 1.5; display: flex; flex-direction: column;">
                        <h2 class="component-header notes-header">
                            Notes
                            <i class='pi pi-info-circle tooltip'>
                                <span class="tooltiptext right-tooltiptext" style="width: 145px">
                                    <!-- Write down any hypothesis or questions you have.
                                    The system will document that for you. -->
                                    We will record the text you put here for academic user study.
                                    We do not collect any other information from you.
                                </span>
                            </i>
                        </h2>
                        <NoteEditor class="notes-style" style="height: 100%" v-model="notes[hexview.outlet]"></NoteEditor>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.component-header.notes-header {
    background: #f7f7f7;
    margin: 3% 1% 1% 0%;
    padding-left: 2%;
}
</style>