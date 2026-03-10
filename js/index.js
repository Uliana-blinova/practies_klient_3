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

Vue.component('task-card', {
    props:{
        task:{
            type:Object,
            required:true
        },
        currentStatus: {
            type: String,
            required: true
        }
    },
    template: `
    <div class="card" :class="{ 'overdue': isOverdue }">
            <h3>{{ task.title }}</h3>
            <p>{{ task.description }}</p>
            <div class="meta">
                <p>Создано: {{ task.createdAt }}</p><br>
                <p>Обновлено: {{ task.updatedAt }}</p><br>
                <p>Дэдлайн: {{ task.deadline }}</p>
                <div v-if="isOverdue" class="badge">Просрочено</div>
                <div v-else-if="currentStatus === 'done'" class="badge success">В срок</div>
            </div>
            
            <div class="actions">
                <button @click="edit">Редактировать</button>
                <button @click="remove">Удалить</button>
                <button v-if="currentStatus === 'planned'" @click="move('in_progress')">В работу</button>
                
                <button v-if="currentStatus === 'in_progress'" @click="move('testing')">На тестирование</button>
                
                <button v-if="currentStatus === 'testing'" @click="move('done')">Готово</button>
                <button v-if="currentStatus === 'testing'" @click="requestReturn">Вернуть в работу</button>
            </div>
            <p v-if="task.returnReason" class="reason">Причина возврата: {{ task.returnReason }}</p>
        </div>
`,
    computed: {
        isOverdue() {
            if (this.currentStatus !== 'done') return false;
            const now = new Date();
            const deadline = new Date(this.task.deadline);
            return now > deadline;
        }
    },
    methods: {
        move(newStatus) {
            this.$emit('move-task', { id: this.task.id, status: newStatus, reason: '' });
        },
        requestReturn() {
            const reason = prompt("Укажите причину возврата во второй столбец:");
            if (reason) {
                this.$emit('move-task', { id: this.task.id, status: 'in_progress', reason: reason });
            }
        },
        edit() {
            this.$emit('edit-task', this.task);
        },
        remove() {
            this.$emit('delete-task', this.task.id);
        }
    }

})