<script setup lang="ts">
import SelectButton from 'primevue/selectbutton'
import ScrollPanel from "primevue/scrollpanel"
import * as vue from "vue"
import * as _ from 'lodash'
const props = defineProps({
    targets: Object as () => string[],
    selectedTargets: Object as () => String[],
    color_dict: Object as () => {[id: string]: string},
})
const emit = defineEmits(["update:selectedTarget"])

vue.watch(() => props.selectedTargets, (new_value, old_value) => {
    emit("update:selectedTarget", props.selectedTargets)
})

function getSelectorColor(label) {
    return props.color_dict?props.color_dict[label] : "black"
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
</style>