Vue.component('kanban-column', {
    props: {
        title: { type: String, required: true },
        status: { type: String, required: true },
        tasks: { type: Array, required: true }
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
                
                <button v-if="status === 'planned'" class="add-btn" @click="createTask">+ Добавить задачу</button>
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
});


Vue.component('task-card', {
    props: {
        task: { type: Object, required: true },
        currentStatus: { type: String, required: true }
    },
    template: `
    <div class="card">
            <h3>{{ task.title }}</h3>
            <p>{{ task.description }}</p>
            <div class="meta">
                <p>Создано: {{ task.createdAt }}</p>
                <p>Обновлено: {{ task.updatedAt }}</p>
                
                <div class="deadline-block">
                    <p>Дэдлайн: {{ formatDeadline(task.deadline) }}</p>
                    
                    <p v-if="task.deadline" class="deadline-status" :class="isOverdue ? 'overdue' : 'on-time'">
                        {{ isOverdue ? 'Просрочено' : 'Выполнено в срок' }}
                    </p>
                </div>
            </div>
            
            <div class="actions">
                <button @click="edit" class="btn">Редактировать</button>
                
                <button v-if="currentStatus === 'planned'" @click="remove" class="btn">Удалить</button>
                
                <button v-if="currentStatus === 'planned'" @click="move('in_progress')" class="btn">В работу</button>
                
                <button v-if="currentStatus === 'in_progress'" @click="move('testing')" class="btn">На тестирование</button>
                
                <button v-if="currentStatus === 'testing'" @click="move('done')" class="btn">Готово</button>
                <button v-if="currentStatus === 'testing'" @click="requestReturn" class="btn">Вернуть</button>
            </div>
            <p v-if="task.returnReason" class="reason">Причина возврата: {{ task.returnReason }}</p>
        </div>
`,
    computed: {
        isOverdue() {
            if (!this.task.deadline) return false;

            const now = new Date();
            const deadline = new Date(this.task.deadline);
            return now > deadline;
        }
    },
    methods: {
        formatDeadline(deadlineString) {
            if (!deadlineString) return '';
            const date = new Date(deadlineString);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
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
            if(confirm('Уверены, что хотите удалить задачу?')) {
                this.$emit('delete-task', this.task.id);
            }
        }
    }
});

Vue.component('task-form', {
    props: {
        task: { type: Object, required: true }
    },
    template: `
    <div class="form-container">
            <h3>{{ task.id ? 'Редактирование задачи' : 'Новая задача' }}</h3>
            <form @submit.prevent="submit">
                <div class="form-group">
                    <label>Заголовок:</label>
                    <input v-model="localTask.title" placeholder="Введите заголовок" required>
                </div>
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea v-model="localTask.description" placeholder="Опишите задачу" required></textarea>
                </div>
                <div class="form-group">
                    <label>Дэдлайн (дата и время):</label>
                    <input type="datetime-local" v-model="localTask.deadline" required>
                </div>
                
                <div v-if="errors.length" class="errors">
                    <ul>
                        <li v-for="error in errors">{{ error }}</li>
                    </ul>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn">Сохранить</button>
                    <button type="button" @click="close" class="btn">Отмена</button>
                </div>
            </form>
        </div>
    `,
    data() {
        return {
            localTask: { ...this.task },
            errors: []
        }
    },
    methods: {
        submit() {
            this.errors = [];
            if (!this.localTask.title) this.errors.push("Заголовок обязателен");
            if (!this.localTask.description) this.errors.push("Описание обязательно");
            if (!this.localTask.deadline) this.errors.push("Дэдлайн обязателен");

            if (this.errors.length === 0) {
                this.$emit('submit', this.localTask);
            }
        },
        close() {
            this.$emit('close');
        }
    }
});


Vue.component('kanban-board', {
    template: `
        <div class="board">
            <kanban-column 
                v-for="col in columns" 
                :key="col.status"
                :title="col.title" 
                :status="col.status"
                :tasks="getTasksForStatus(col.status)"
                @move-task="moveTask"
                @edit-task="openEditForm"
                @delete-task="deleteTask"
                @create-task="openCreateForm"
            ></kanban-column>
            
            <div v-if="showForm" class="modal">
                <task-form 
                    :task="currentTask" 
                    @submit="saveTask" 
                    @cancel="showForm = false"
                ></task-form>
            </div>
        </div>
    `,
    data() {
        return {
            columns: [
                { title: 'Запланированные задачи', status: 'planned' },
                { title: 'Задачи в работе', status: 'in_progress' },
                { title: 'Тестирование', status: 'testing' },
                { title: 'Выполненные задачи', status: 'done' }
            ],
            tasks: [],
            showForm: false,
            currentTask: null
        }
    },
    methods: {
        getTasksForStatus(status) {
            return this.tasks.filter(t => t.status === status);
        },
        moveTask(payload) {
            const task = this.tasks.find(t => t.id === payload.id);
            if (task) {
                task.status = payload.status;
                task.updatedAt = new Date().toLocaleString('ru-RU');

                if (payload.reason) {
                    task.returnReason = payload.reason;
                } else {
                    task.returnReason = '';
                }

                if (payload.status === 'done') {
                    const now = new Date();
                    const deadline = new Date(task.deadline);

                    if (now > deadline) {
                        task.isOverdue = true;
                    } else {
                        task.isOverdue = false;
                    }
                }
                this.saveToLocalStorage();
            }
        },
        deleteTask(id) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveToLocalStorage();
        },
        openCreateForm(status) {
            this.currentTask = {
                title: '',
                description: '',
                deadline: '',
                status: status,
                returnReason: '',
                isOverdue: false
            };
            this.showForm = true;
        },
        openEditForm(task) {
            this.currentTask = JSON.parse(JSON.stringify(task));
            this.showForm = true;
        },
        saveTask(taskData) {
            const existingIndex = this.tasks.findIndex(t => t.id === taskData.id);

            if (existingIndex !== -1) {
                const originalTask = this.tasks[existingIndex];
                taskData.status = originalTask.status;
                taskData.createdAt = originalTask.createdAt;
                taskData.isOverdue = originalTask.isOverdue;
                taskData.updatedAt = new Date().toLocaleString('ru-RU');
                this.tasks[existingIndex] = taskData;
            } else {

                taskData.id = Date.now();
                taskData.createdAt = new Date().toLocaleString('ru-RU');
                taskData.updatedAt = new Date().toLocaleString('ru-RU');
                taskData.isOverdue = false;
                taskData.returnReason = '';
                this.tasks.push(taskData);
            }
            this.showForm = false;
            this.currentTask = null;
            this.saveToLocalStorage();
        },
        saveToLocalStorage() {
            try {
                localStorage.setItem('kanban_tasks', JSON.stringify(this.tasks));
            } catch (e) {
                console.error('Ошибка сохранения:', e);
            }
        },
        loadFromLocalStorage() {
            try {
                const saved = localStorage.getItem('kanban_tasks');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        this.tasks = parsed;
                    }
                }
            } catch (e) {
                console.error('Ошибка загрузки:', e);
                this.tasks = [];
            }
        }
    },
    mounted() {
        this.loadFromLocalStorage();
    }
});

const app = new Vue({
    el: '#app',
});