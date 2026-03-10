let app = new Vue({
    el: '#app',
    data: {
        tasks: []
    },
    methods: {

    }
})

Vue.component('kanban-column', {
    props:{
        title:{
            type:String,
            required:true
        },
        status:{
            type:String,
            required:true
        },
        tasks:{
            type:Array,
            required:true
        }
    },
    template: `
    <div class="column">
            <h2>{{ title }}</h2>
            <div class="task-list">
                <task-card 
                    v-for="task in tasks" 
                    :key="task.id" 
                    :task="task"
                    :current-status="status"
                    @move-task="moveTask"
                    @edit-task="editTask"
                    @delete-task="deleteTask"
                ></task-card>
                <button v-if="status === 'planned'" @click="createTask">+ Добавить задачу</button>
            </div>
        </div>
    `,
    methods: {
        moveTask(payload) {
            this.$emit('move-task', payload);
        },
        editTask(task) {
            this.$emit('edit-task', task);
        },
        deleteTask(id) {
            this.$emit('delete-task', id);
        },
        createTask() {
            this.$emit('create-task', this.status);
        }
    }
})