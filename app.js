/**
 * 留学申请管理系统 - 核心逻辑
 * 
 * 我们将使用 localStorage 来保存数据，这样用户刷新页面后内容不会丢失。
 */

// --- 1. 数据状态管理 ---

// 从本地存储加载数据，如果没有则使用默认数据
let appData = JSON.parse(localStorage.getItem('studyAbroadData'));

// 数据结构迁移与兼容性处理
if (appData && appData.projects) {
    appData.projects.forEach(p => {
        // 如果 requirements 不是数组，说明是旧版本的数据格式（对象）
        if (p.requirements && !Array.isArray(p.requirements)) {
            const oldReqs = p.requirements;
            const newReqs = [];
            
            // 映射旧的固定字段到新的动态数组格式
            if (oldReqs.ielts) newReqs.push({ name: '语言要求 (IELTS)', value: oldReqs.ielts });
            if (oldReqs.recommendationLetters) newReqs.push({ name: '推荐信', value: `${oldReqs.recommendationLetters} 封` });
            if (oldReqs.personalStatement) newReqs.push({ name: '个人陈述 (PS)', value: '需要' });
            if (oldReqs.researchProposal) newReqs.push({ name: '研究计划 (RP)', value: '需要' });
            
            p.requirements = newReqs;
        }
    });
    // 保存迁移后的数据
    localStorage.setItem('studyAbroadData', JSON.stringify(appData));
}

// 如果是新用户，初始化一些示例数据
if (!appData) {
    appData = {
        projects: [
            {
                id: 1,
                school: '伦敦大学学院 (UCL)',
                major: '教育技术',
                requirements: [
                    { name: '语言要求 (IELTS)', value: '7.0 (6.5)' },
                    { name: '推荐信', value: '2 封' },
                    { name: '个人陈述 (PS)', value: '需要' }
                ]
            }
        ],
        tasks: [
            { id: Date.now(), title: '完善个人简历 (CV)', description: '包含实习经历、学术项目和技能列表。', deadline: '2026-04-01', isCompleted: false, projectId: null },
            { id: Date.now() + 1, title: '准备个人陈述 (PS) 通用模板', description: '重点突出申请动机和职业规划。', deadline: '2026-04-15', isCompleted: true, projectId: null },
            { id: Date.now() + 2, title: '联系 UCL 的推荐人', description: '发邮件确认是否愿意提供推荐信。', deadline: '2026-03-30', isCompleted: false, projectId: 1 }
        ]
    };
    saveData();
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('studyAbroadData', JSON.stringify(appData));
    updateSidebar();
}

// --- 2. 路由与视图切换 ---

function showView(viewId, params = null) {
    const container = document.getElementById('view-container');
    
    // 更新导航栏激活状态
    document.querySelectorAll('.sidebar-item, #sidebar-projects-list button').forEach(el => el.classList.remove('active'));
    
    if (viewId === 'project-detail') {
        const projectBtn = document.querySelector(`#project-btn-${params}`);
        if (projectBtn) projectBtn.classList.add('active');
    } else {
        const activeNav = document.getElementById(`nav-${viewId}`);
        if (activeNav) activeNav.classList.add('active');
    }

    // 根据视图 ID 渲染内容
    switch(viewId) {
        case 'projects':
            renderProjectsView(container);
            break;
        case 'project-detail':
            renderProjectDetailView(container, params);
            break;
        case 'tasks':
            renderTasksView(container);
            break;
        case 'comparison':
            renderComparisonView(container);
            break;
        default:
            renderProjectsView(container);
    }
    
    // 重新渲染图标
    if (window.lucide) lucide.createIcons();
}

// --- 3. 视图渲染函数 ---

function renderProjectsView(container) {
    container.innerHTML = `
        <div class="mb-8 flex justify-between items-end">
            <div>
                <h1 class="text-4xl font-bold mb-2">项目概览</h1>
                <p class="text-gray-500">管理你的申请目标学校与专业</p>
            </div>
            <button onclick="addProject()" class="bg-[#2eaadc] hover:bg-[#2690bc] text-white px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i> 添加项目
            </button>
        </div>
        
        <div id="projects-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${appData.projects.length === 0 ? `
                <div class="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-lg">
                    <p class="text-gray-400">还没有添加任何项目，点击右上角开始吧！</p>
                </div>
            ` : appData.projects.map(p => renderProjectCard(p)).join('')}
        </div>
    `;
}

function renderProjectCard(project) {
    const projectTasks = appData.tasks.filter(t => t.projectId === project.id);
    
    return `
        <div class="notion-card p-6 bg-white shadow-sm flex flex-col h-full cursor-pointer" onclick="showView('project-detail', ${project.id})">
            <div class="flex justify-between items-start mb-4">
                <div class="w-10 h-10 bg-green-50 rounded flex items-center justify-center text-green-600">
                    <i data-lucide="school" class="w-6 h-6"></i>
                </div>
                <div class="flex gap-2" onclick="event.stopPropagation()">
                    <button onclick="editRequirements(${project.id})" class="text-gray-300 hover:text-green-500 transition" title="配置要求">
                        <i data-lucide="settings" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteProject(${project.id})" class="text-gray-300 hover:text-red-500 transition" title="删除项目">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <h3 class="text-xl font-bold mb-1">${project.school}</h3>
            <p class="text-gray-500 text-sm mb-4">${project.major}</p>
            
            <div class="space-y-2 mb-6 flex-1">
                <div class="mt-4 pt-4 border-t border-gray-50">
                    <p class="text-[10px] text-gray-400 uppercase font-bold mb-2">专属任务 (${projectTasks.length})</p>
                    <div class="space-y-1" onclick="event.stopPropagation()">
                        ${projectTasks.length === 0 ? 
                            '<p class="text-xs text-gray-300 italic">暂无专属任务</p>' : 
                            projectTasks.slice(0, 3).map(t => `
                                <div class="flex items-center gap-2 text-xs">
                                    <input type="checkbox" ${t.isCompleted ? 'checked' : ''} 
                                        onchange="toggleTask(${t.id})"
                                        class="w-3 h-3 rounded border-gray-300 text-green-500 focus:ring-green-500 cursor-pointer">
                                    <span class="truncate ${t.isCompleted ? 'text-gray-300 line-through' : 'text-gray-600'}">${t.title}</span>
                                </div>
                            `).join('')
                        }
                        ${projectTasks.length > 3 ? `<p class="text-[10px] text-green-400 mt-1">还有 ${projectTasks.length - 3} 个任务...</p>` : ''}
                    </div>
                </div>
            </div>

            <div class="mt-auto">
                <div class="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>总进度 (含通用)</span>
                    <span>${calculateProgress(project.id)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${calculateProgress(project.id)}%"></div>
                </div>
            </div>
        </div>
    `;
}

function renderProjectDetailView(container, projectId) {
    const project = appData.projects.find(p => p.id === projectId);
    if (!project) {
        showView('projects');
        return;
    }

    const projectTasks = appData.tasks.filter(t => t.projectId === project.id);
    const generalTasks = appData.tasks.filter(t => t.projectId === null);

    container.innerHTML = `
        <div class="mb-8 flex items-center gap-4">
            <button onclick="showView('projects')" class="text-gray-400 hover:text-green-600 transition">
                <i data-lucide="arrow-left" class="w-6 h-6"></i>
            </button>
            <div>
                <h1 class="text-4xl font-bold mb-2">${project.school}</h1>
                <p class="text-gray-500 text-lg">${project.major}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
            <!-- Left: Requirements -->
            <div class="lg:col-span-1 space-y-8">
                <section>
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xs text-gray-400 font-bold uppercase tracking-wider">申请要求</h2>
                        <button onclick="editRequirements(${project.id})" class="text-xs text-green-600 hover:underline">编辑</button>
                    </div>
                    <div class="space-y-4">
                        ${project.requirements.length === 0 ? 
                            '<p class="text-sm text-gray-400 italic">尚未配置任何要求</p>' : 
                            project.requirements.map(req => `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-xs text-gray-400 font-medium mb-1">${req.name}</p>
                                    <p class="text-sm font-semibold text-gray-700">${req.value}</p>
                                </div>
                            `).join('')
                        }
                    </div>
                </section>

                <section>
                    <div class="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">
                        <span>准备进度</span>
                        <span>${calculateProgress(project.id)}%</span>
                    </div>
                    <div class="progress-bar h-2">
                        <div class="progress-fill" style="width: ${calculateProgress(project.id)}%"></div>
                    </div>
                </section>
            </div>

            <!-- Right: Tasks -->
            <div class="lg:col-span-2 space-y-12">
                <section>
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold">项目专属任务</h2>
                    </div>
                    <div class="space-y-2">
                        ${renderTaskList(projectTasks)}
                    </div>
                </section>

                <section>
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold">通用任务 (关联)</h2>
                    </div>
                    <div class="space-y-2 opacity-75">
                        ${renderTaskList(generalTasks)}
                    </div>
                </section>
            </div>
        </div>
    `;
}

function renderTasksView(container) {
    container.innerHTML = `
        <div class="mb-12">
            <h1 class="text-4xl font-bold mb-2">任务中心</h1>
            <p class="text-gray-500 text-lg">按学校分类管理你的所有待办事项</p>
        </div>

        <!-- Add Task Form -->
        <div class="mb-16 bg-white border border-gray-100 shadow-sm p-8 rounded-xl">
            <h3 class="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">快速添加任务</h3>
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row gap-4">
                    <input id="task-input" type="text" class="flex-1 px-4 py-3 bg-gray-50 border-transparent rounded-lg outline-none focus:bg-white focus:border-green-400 transition" placeholder="任务标题，例如：准备 PS 稿件">
                    <input id="task-deadline-input" type="date" class="px-4 py-3 bg-gray-50 border-transparent rounded-lg outline-none focus:bg-white focus:border-green-400 text-sm text-gray-500 transition">
                    <select id="task-project-select" class="px-4 py-3 bg-gray-50 border-transparent rounded-lg outline-none focus:bg-white focus:border-green-400 bg-white text-sm transition">
                        <option value="null">🌐 通用任务</option>
                        ${appData.projects.map(p => `<option value="${p.id}">🏫 ${p.school}</option>`).join('')}
                    </select>
                </div>
                <textarea id="task-desc-input" class="w-full px-4 py-3 bg-gray-50 border-transparent rounded-lg outline-none focus:bg-white focus:border-green-400 text-sm h-24 transition" placeholder="补充任务详情..."></textarea>
                <div class="flex justify-end">
                    <button onclick="addTask()" class="bg-green-600 text-white px-10 py-3 rounded-lg font-medium hover:bg-green-700 transition shadow-lg shadow-green-100">
                        添加至清单
                    </button>
                </div>
            </div>
        </div>

        <div class="space-y-16">
            <!-- General Tasks -->
            <section class="bg-white rounded-2xl">
                <div class="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                            <i data-lucide="globe" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">通用任务</h2>
                            <p class="text-xs text-gray-400 font-medium">所有项目共享的基础准备</p>
                        </div>
                    </div>
                    <span class="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        ${appData.tasks.filter(t => t.projectId === null).length} 个事项
                    </span>
                </div>
                <div class="grid grid-cols-1 gap-2">
                    ${renderTaskList(appData.tasks.filter(t => t.projectId === null))}
                </div>
            </section>

            <!-- Project Specific Tasks -->
            ${appData.projects.map(p => {
                const projectTasks = appData.tasks.filter(t => t.projectId == p.id);
                return `
                <section class="bg-white rounded-2xl">
                    <div class="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                <i data-lucide="school" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-gray-800">${p.school}</h2>
                                <p class="text-xs text-green-500 font-medium">${p.major}</p>
                            </div>
                        </div>
                        <span class="text-xs font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full">
                            ${projectTasks.length} 个事项
                        </span>
                    </div>
                    <div class="grid grid-cols-1 gap-2">
                        ${renderTaskList(projectTasks)}
                    </div>
                </section>
                `;
            }).join('')}
        </div>
    `;
}

function renderTaskList(tasks) {
    if (tasks.length === 0) {
        return `<p class="text-gray-400 text-sm italic ml-7">暂无任务</p>`;
    }
    
    return tasks.map(t => `
        <div class="group flex items-start justify-between p-3 rounded hover:bg-gray-50 border-b border-gray-50 transition">
            <div class="flex items-start gap-3 flex-1">
                <input type="checkbox" ${t.isCompleted ? 'checked' : ''} 
                    onchange="toggleTask(${t.id})"
                    class="mt-1 w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500 cursor-pointer">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <p class="font-medium ${t.isCompleted ? 'line-through text-gray-300' : 'text-gray-700'}">${t.title}</p>
                        ${t.deadline ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-bold uppercase">截止: ${t.deadline}</span>` : ''}
                    </div>
                    ${t.description ? `<p class="text-xs text-gray-400 mt-1 leading-relaxed">${t.description}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onclick="editTask(${t.id})" class="text-gray-300 hover:text-blue-500 transition px-2">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteTask(${t.id})" class="text-gray-300 hover:text-red-500 transition px-2">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// --- 4. 业务逻辑 ---

// 4.1 项目管理
function addProject() {
    const modal = document.getElementById('project-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function confirmAddProject() {
    const school = document.getElementById('school-input').value.trim();
    const major = document.getElementById('major-input').value.trim();
    
    if (!school || !major) {
        alert('请填入学校和专业名称！');
        return;
    }

    const newProject = {
        id: Date.now(),
        school: school,
        major: major,
        requirements: []
    };

    appData.projects.push(newProject);
    saveData();
    closeModal();
    showView('projects');
    
    document.getElementById('school-input').value = '';
    document.getElementById('major-input').value = '';
}

function deleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？相关的任务也将被删除。')) {
        appData.projects = appData.projects.filter(p => p.id !== projectId);
        appData.tasks = appData.tasks.filter(t => t.projectId !== projectId);
        saveData();
        showView('projects');
    }
}

// 4.2 任务管理
function addTask() {
    const title = document.getElementById('task-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const deadline = document.getElementById('task-deadline-input').value;
    const projectIdVal = document.getElementById('task-project-select').value;
    const projectId = projectIdVal === 'null' ? null : Number(projectIdVal);

    if (!title) {
        alert('请输入任务标题！');
        return;
    }

    const newTask = {
        id: Date.now(),
        title: title,
        description: description,
        deadline: deadline,
        isCompleted: false,
        projectId: projectId
    };

    appData.tasks.push(newTask);
    saveData();
    showView('tasks');
}

function toggleTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        task.isCompleted = !task.isCompleted;
        saveData();
        refreshCurrentView(task.projectId);
    }
}

function refreshCurrentView(projectId = null) {
    const activeItem = document.querySelector('.sidebar-item.active');
    if (!activeItem) {
        showView('projects');
        return;
    }

    const currentNavId = activeItem.id;
    if (currentNavId === 'nav-projects') {
        showView('projects');
    } else if (currentNavId === 'nav-tasks') {
        showView('tasks');
    } else if (currentNavId === 'nav-comparison') {
        showView('comparison');
    } else {
        // 可能是项目详情页，因为详情页没有 nav-id，或者我们需要一个更好的方式判断
        // 我们检查当前视图容器里的内容
        const container = document.getElementById('view-container');
        if (container.querySelector('h1').innerText === '项目概览') {
             showView('projects');
        } else if (container.querySelector('h1').innerText === '任务中心') {
             showView('tasks');
        } else if (container.querySelector('h1').innerText === '要求对比') {
             showView('comparison');
        } else {
            // 假设是项目详情页，我们尝试从页面中获取当前的 projectId
            // 或者更简单：如果 activeItem 是侧边栏的具体项目按钮
            if (activeItem.onclick.toString().includes('project-detail')) {
                // 这里的处理有点复杂，因为 params 没存
                // 简单起见，我们重新获取 activeItem 绑定的 ID
                const onclickStr = activeItem.getAttribute('onclick');
                const match = onclickStr.match(/project-detail',\s*(\d+)/);
                if (match) {
                    showView('project-detail', Number(match[1]));
                }
            }
        }
    }
}

function deleteTask(taskId) {
    appData.tasks = appData.tasks.filter(t => t.id !== taskId);
    saveData();
    showView('tasks');
}

function editTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-deadline').value = task.deadline || '';
    document.getElementById('edit-task-desc').value = task.description || '';
    
    const projectSelect = document.getElementById('edit-task-project');
    projectSelect.innerHTML = `
        <option value="null">通用任务 (所有项目共享)</option>
        ${appData.projects.map(p => `<option value="${p.id}" ${p.id === task.projectId ? 'selected' : ''}>${p.school}</option>`).join('')}
    `;

    const modal = document.getElementById('task-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function saveTaskEdit() {
    const taskId = Number(document.getElementById('edit-task-id').value);
    const task = appData.tasks.find(t => t.id === taskId);
    
    if (task) {
        task.title = document.getElementById('edit-task-title').value.trim();
        task.deadline = document.getElementById('edit-task-deadline').value;
        task.description = document.getElementById('edit-task-desc').value.trim();
        const projectIdVal = document.getElementById('edit-task-project').value;
        task.projectId = projectIdVal === 'null' ? null : Number(projectIdVal);

        if (!task.title) {
            alert('标题不能为空');
            return;
        }

        saveData();
        closeTaskModal();
        showView('tasks');
    }
}

// 4.3 要求配置
function editRequirements(projectId) {
    const project = appData.projects.find(p => p.id === projectId);
    if (!project) return;

    document.getElementById('req-project-id').value = projectId;
    document.getElementById('req-modal-title').innerText = `${project.school} - 配置要求`;
    
    const container = document.getElementById('req-list-container');
    container.innerHTML = '';
    
    if (project.requirements.length === 0) {
        // 默认添加一行
        addRequirementRow();
    } else {
        project.requirements.forEach(req => {
            addRequirementRow(req.name, req.value);
        });
    }

    const modal = document.getElementById('req-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (window.lucide) lucide.createIcons();
}

function addRequirementRow(name = '', value = '') {
    const container = document.getElementById('req-list-container');
    const row = document.createElement('div');
    row.className = 'flex gap-3 items-start group';
    row.innerHTML = `
        <input type="text" class="req-name-input flex-1 border-b border-gray-100 py-2 focus:border-green-400 outline-none text-sm font-medium" placeholder="要求项名称 (如: IELTS)" value="${name}">
        <input type="text" class="req-value-input flex-1 border-b border-gray-100 py-2 focus:border-green-400 outline-none text-sm text-gray-600" placeholder="具体要求 (如: 7.0)" value="${value}">
        <button onclick="this.parentElement.remove()" class="mt-2 text-gray-300 hover:text-red-400 transition">
            <i data-lucide="minus-circle" class="w-4 h-4"></i>
        </button>
    `;
    container.appendChild(row);
    if (window.lucide) lucide.createIcons();
}

function closeReqModal() {
    const modal = document.getElementById('req-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function saveRequirements() {
    const projectId = Number(document.getElementById('req-project-id').value);
    const project = appData.projects.find(p => p.id === projectId);
    
    if (project) {
        const rows = document.querySelectorAll('#req-list-container > div');
        const newRequirements = [];
        
        rows.forEach(row => {
            const name = row.querySelector('.req-name-input').value.trim();
            const value = row.querySelector('.req-value-input').value.trim();
            if (name) {
                newRequirements.push({ name, value });
            }
        });
        
        project.requirements = newRequirements;
        saveData();
        closeReqModal();
        showView('projects');
    }
}

function renderComparisonView(container) {
    if (appData.projects.length === 0) {
        container.innerHTML = `
            <h1 class="text-4xl font-bold mb-8">要求对比</h1>
            <div class="py-20 text-center border-2 border-dashed border-gray-100 rounded-lg">
                <p class="text-gray-400">先添加一些项目再来对比吧！</p>
            </div>
        `;
        return;
    }

    // 收集所有项目中出现过的要求名称
    const allRequirementNames = new Set();
    appData.projects.forEach(p => {
        p.requirements.forEach(req => allRequirementNames.add(req.name));
    });
    
    const requirementNames = Array.from(allRequirementNames);

    container.innerHTML = `
        <h1 class="text-4xl font-bold mb-2">要求对比</h1>
        <p class="text-gray-500 mb-10">横向对比不同项目的申请门槛</p>

        <div class="overflow-x-auto">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="text-left border-b-2 border-gray-100">
                        <th class="py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">要求项目</th>
                        ${appData.projects.map(p => `
                            <th class="py-4 px-6 text-sm font-bold min-w-[200px]">
                                <div class="text-green-600">${p.school}</div>
                                <div class="text-gray-400 font-normal normal-case mt-1">${p.major}</div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    ${requirementNames.length === 0 ? `
                        <tr>
                            <td colspan="${appData.projects.length + 1}" class="py-10 text-center text-gray-400 italic">
                                还没有配置任何要求，点击“项目概览”中的设置图标开始配置。
                            </td>
                        </tr>
                    ` : requirementNames.map(name => `
                        <tr>
                            <td class="py-6 px-6 font-medium text-gray-700">${name}</td>
                            ${appData.projects.map(p => {
                                const req = p.requirements.find(r => r.name === name);
                                return `<td class="py-6 px-6 text-gray-600">${req ? req.value : '—'}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// --- 5. 辅助函数 ---

function updateSidebar() {
    const sidebarList = document.getElementById('sidebar-projects-list');
    if (!sidebarList) return;
    
    sidebarList.innerHTML = appData.projects.map(p => `
        <button id="project-btn-${p.id}" onclick="showView('project-detail', ${p.id})" class="w-full text-left px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 truncate flex items-center gap-2">
            <span class="text-xs text-green-400">●</span>
            <span class="truncate">${p.school}</span>
        </button>
    `).join('');
}

function calculateProgress(projectId) {
    const projectTasks = appData.tasks.filter(t => t.projectId === projectId || t.projectId === null);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(t => t.isCompleted);
    const progress = Math.round((completedTasks.length / projectTasks.length) * 100);
    
    return progress;
}

// --- 6. 初始化 ---

document.addEventListener('DOMContentLoaded', () => {
    showView('projects');
    updateSidebar();
});
