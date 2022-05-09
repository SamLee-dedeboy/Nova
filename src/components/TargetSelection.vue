<script>
import { defineComponent } from '@vue/composition-api'
import MegaMenu from 'primevue/megamenu';
export default defineComponent({
    components: {
        MegaMenu
    },
    props:['targets'],
    emits: ["target-selected"],
    data() {
        return {
            items:[
                {
                    label: "Target",
                    items: [[{items:this.targets.map(target => Object({label: target}))}]]
                }
            ]
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
    <MegaMenu :model="items" @click=targetClicked />
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
</style>