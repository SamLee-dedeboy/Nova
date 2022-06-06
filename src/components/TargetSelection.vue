<script>
import { defineComponent } from '@vue/composition-api'
import MegaMenu from 'primevue/megamenu';
import DataTable from 'primevue/datatable'
import {FilterMatchMode,FilterService} from 'primevue/api';
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
export default defineComponent({
    components: {
        MegaMenu,
        DataTable,
        Column,
        InputText,
    },
    props:['targets'],
    emits: ["target-selected"],
    computed: {
        target_list: function() {
            return this.targets.map(target => Object({label: target}))
        } 
    },
    data() {
        return {
            target_test:[
                {
                    label: "Target",
                    // items: [[{items:this.targets.slice(0,10).map(target => Object({label: target}))}]]
                    items: [[{items:this.targets.map(target => Object({label: target}))}]]
                }
            ],
            selected_target: null,
            filters: {
                'label': {value: null, matchMode: FilterMatchMode.STARTS_WITH}
            }
        }
    },
    mounted() {
        FilterService.register("FuzzyMatch", (value, filter) => {
             if (filter === undefined || filter === null || filter.trim() === '') {
                return true;
            }
    
            if (value === undefined || value === null) {
                return false;
            }
            return value.toString === filter.toSting();
        })
    },
    watch: {
        selected_target: function() {
            this.$emit("target-selected", this.selected_target.label)
        }
    },
    methods: {
        toggle(event) {
            this.$refs.target_menu.toggle(event);
        },
        targetClicked(event) {
            if(this.targets.includes(event.target.textContent)){
                this.$emit("target-selected", event.target.textContent)
            }
        }
    }

})
</script>

<template>
    <!-- <MegaMenu :model="targets" @click=targetClicked /> -->
    <div class="TargetSelection">
        <DataTable 
        :value="target_list" 
        :scrollable="true" 
        v-model:selection="selected_target" selectionMode="single"
        class="p-datatable-sm"
        scrollHeight="300px" 
        responsiveLayout="scroll"
        v-model:filters="filters"
        filterDisplay="row"
        :globalFilterFields="['label']"
        dataKey="label">
            <template #empty>
                No target found.
            </template>
            <Column field="label" header="Target" 
            style="text-overflow:ellipsis; width:250px">

                <template #body="{data}">
                    {{data.label}}
                </template>
                <template #filter="{filterModel, filterCallback}">
                    <InputText type="text" v-model="filterModel.value"  @input="filterCallback()" class="p-column-filter" :placeholder="`Search by name`"/>
                </template>
            </Column>
        </DataTable>
    </div>
</template>
<style>
.p-megamenu .p-megamenu-submenu {
  width: auto !important;
}
.p-megamenu.p-component.p-megamenu-horizontal {
  --margin-horizontal: 10px;
  margin-left: var(--margin-horizontal);
  margin-right: var(--margin-horizontal);
  padding: inherit;
  width:fit-content;
}
.p-megamenu .p-megamenu-submenu-header {
  padding: 0rem !important;
}
.p-megamenu-panel {
  width: max-content;
}
.TargetSelection {

}
</style>