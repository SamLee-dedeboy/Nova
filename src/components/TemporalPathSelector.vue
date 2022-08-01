<script setup lang="ts">
import SelectButton from 'primevue/selectbutton'
import ScrollPanel from "primevue/scrollpanel"
import * as vue from "vue"
import * as _ from 'lodash'
import {Article} from "../types"
const props = defineProps({
    temporalBins: Object as () => {[id: string]: {[id: string]:Article[]}},
    selectedTargets: Object as () => String[],
    color_dict: Object as () => {[id: string]: string},
    closable: Boolean, 
})
const emit = defineEmits(["update:selectedTargets", "update:targets"])

const targets = vue.computed(() => Object.keys(props.temporalBins || {}))
vue.watch(() => props.selectedTargets, (new_value, old_value) => {
    emit("update:selectedTargets", props.selectedTargets)
})

vue.onMounted(() => {
    console.log(props.temporalBins)
    console.log(props.closable)
})
function getSelectorColor(label) {
    return props.color_dict?props.color_dict[label] : "black"
}

function handleCloseTab(e, d) {
    e.preventDefault()
    const index_targets = targets.value.indexOf(d)
    if (index_targets !== -1 && index_targets !== undefined && props.temporalBins !== undefined) {
        delete props.temporalBins[d]
    }
    var index_selected = props.selectedTargets?.indexOf(d)
    if (index_selected !== -1 && index_selected !== undefined) {
        props.selectedTargets?.splice(index_selected, 1);
    }
    emit("update:targets", props.temporalBins)
}
</script>
<template>
    <div class="temporal-selector-container">
        <ScrollPanel class="select-button-set-container" >
            <SelectButton class="p-primary select-button-set"
                :multiple="true"
                v-model="selectedTargets" :options="targets" >
                <template #option="slotProps">
                    <div class="selector-option">
                        <svg viewBox="0 0 100 100" width="10px" height="10px">
                            <circle cx="50" cy="50" :fill="getSelectorColor(slotProps.option)" r="40"></circle>
                        </svg>
                        <div class="selector-label">{{slotProps.option}}</div>
                        <Button v-if="closable"
                        icon="pi pi-times" class="p-button-rounded p-button-danger p-button-text p-button-sm"
                        @click="handleCloseTab($event, slotProps.option)"/>
                    </div>
                </template>
            </SelectButton>
        </ScrollPanel>
    </div>
</template>
<style scoped lang="scss">
.select-button-set {
    display: grid !important; 
}

:deep(.selector-option) {
    font-size: x-small !important;
    display: inline-flex;
    align-items: center;
    width: 100%;
}
.selector-label {
    margin-left: 10px;
}
:deep(.p-buttonset) {
    border: 1px solid #ced4da;
}

:deep(.p-scrollpanel-wrapper) {
  border-right: 9px solid #f4f4f4;
}
:deep(.p-scrollpanel-bar) {
  background-color: #ced4da !important;
  opacity: 1;
  transition: background-color .3s;
}
:deep(.p-scrollpanel-bar:hover) {
  background-color: #135ba1;
}
.select-button-set-container {
    width: 100%;
    height: 100%;
}
:deep(.p-button.p-button-sm .p-button-icon) {
    font-size: 0.575rem !important;
}
:deep(.p-button.p-button-icon-only.p-button-rounded) {
    height: 1.357rem !important;
    margin-left: auto;
    margin-right: 0;
}
</style>