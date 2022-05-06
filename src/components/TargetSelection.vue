<script>
import { defineComponent } from '@vue/composition-api'
import TieredMenu from 'primevue/tieredmenu';
export default defineComponent({
    components: {
        TieredMenu
    },
    props:['targets'],
    emits: ["target-selected"],
    data() {
        return {
            items:[]
        }
    },
    watch: {
        targets: function() {
            this.items = this.targets.map(target => Object({label: target}))
        }
    },
    methods: {
        toggle(event) {
            this.$refs.menu.toggle(event);
        },
        targetClicked(event) {
            if(event.target.className == "p-menuitem-text" || event.target.className == "p-menuitem-link")
                this.$emit("target-selected", event.target.textContent)
        }
    }

})
</script>

<template>
    <Button type="button" label="Target" @click="toggle" />
    <TieredMenu id="target_selection" ref="menu" :model="items" :popup="true"
        style="width: auto"
        @click="targetClicked"
    >
        
    </TieredMenu>
</template>
