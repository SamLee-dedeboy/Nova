<script setup lang="ts">
import SelectButton from 'primevue/selectbutton'
import * as vue from "vue"
import * as _ from 'lodash'
const props = defineProps({
    targets: Object as () => string[],
    selectedTargets: Object as () => String[],
})
const emit = defineEmits(["update:selectedTarget"])

vue.watch(() => props.selectedTargets, (new_value, old_value) => {
    emit("update:selectedTarget", props.selectedTargets)
})


</script>
<template>
    <div class="temporal-selector-container">
        <SelectButton
            class="p-primary select-button-set"
            :multiple="true"
            v-model="selectedTargets" :options="targets"
            >
        </SelectButton>
    </div>
</template>
<style scoped lang="scss">
.select-button-set {
    display: grid !important; 
    top: 50%; 
    transform:translateY(-50%);
}

:deep(.p-button-label) {
    font-size: x-small !important;
}
:deep(.p-buttonset .p-button:not(:last-child)) {
    border-right: 1px solid #ced4da;
}

</style>