<script setup lang="ts">
import SelectButton from 'primevue/selectbutton'
import * as vue from "vue"

const props = defineProps({
    targets: Object as () => string[],
    selectedTarget: String,
})
const emit = defineEmits(["update:selectedTarget"])

vue.watch(() => props.selectedTarget, (new_value, old_value) => {
    emit("update:selectedTarget", props.selectedTarget)
})


</script>
<template>
    <div class="temporal-selector-container">
        <SelectButton 
            v-model="selectedTarget" :options="targets"
            >
        </SelectButton>
    </div>
</template>