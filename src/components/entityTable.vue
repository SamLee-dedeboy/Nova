<template>
    <div id="entityList" class="entityList">
        <DataTable :value="entityList" :paginator="true" :rows="5" :rowHover="true"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink ">
            <Column field="entity" header="Topic"></Column>
            <Column field="frequency" header="Frequency"></Column>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { FilterMatchMode, FilterOperator } from "primevue/api";

import { onMounted, computed, Ref, ref, defineEmits } from 'vue'
import { ScatterNode, EntityScatterView } from '../types'


const props = defineProps({
    view: Object as () => EntityScatterView,
    article_num_threshold: Number
})

const filtered_data = computed(() => props.view?.data.nodes.filter((node: ScatterNode) => node.article_ids.length > (props.article_num_threshold || 0))) as Ref<ScatterNode[]>
const entityList = filtered_data.value.map(data => {
    return {
        'entity': data.text,
        'frequency': data.article_ids.length
    }
})

console.log("Entity List", entityList)



</script>