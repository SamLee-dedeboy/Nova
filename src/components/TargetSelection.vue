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
    mounted() {
        this.items = this.targets.map(target => Object({label: target}))
    },
    watch: {
        targets: function() {
            this.items = this.targets.map(target => Object({label: target}))
        }
    },
    methods: {
        toggle(event) {
            this.$refs.target_menu.toggle(event);
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
    <TieredMenu ref="target_menu" :model="items" :popup="true"
        style="width: auto"
        @click="targetClicked"
    >
        
    </TieredMenu>
</template>
