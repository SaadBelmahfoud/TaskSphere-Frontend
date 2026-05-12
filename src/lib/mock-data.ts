import type {
  TaskResponse,
  DashboardStatsResponse,
  ActivityLogResponse,
  CommentResponse,
  UserAdminResponse,
} from "@/types";

// Demo user IDs
export const DEMO_USER_ID = "demo-user-001";
export const DEMO_ADMIN_ID = "demo-admin-001";
export const DEMO_MANAGER_ID = "demo-manager-001";

// Generate a simple UUID-like ID
function mockId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper: date relative to now
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ===== Mock Tasks =====
let mockTasks: TaskResponse[] = [
  // TODO tasks
  {
    id: "task-001",
    title: "Design new landing page",
    description:
      "Create a modern, responsive landing page with hero section, features grid, and CTA. Use the new brand guidelines.",
    status: "TODO",
    priority: "HIGH",
    dueDate: daysFromNow(5),
    completedAt: null,
    createdAt: daysAgo(2),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_USER_ID,
  },
  {
    id: "task-002",
    title: "Set up CI/CD pipeline",
    description:
      "Configure GitHub Actions for automated testing and deployment to staging and production environments.",
    status: "TODO",
    priority: "CRITICAL",
    dueDate: daysFromNow(3),
    completedAt: null,
    createdAt: daysAgo(1),
    userId: DEMO_USER_ID,
    assigneeId: null,
  },
  {
    id: "task-003",
    title: "Write API documentation",
    description:
      "Document all REST endpoints with request/response examples using OpenAPI/Swagger.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: daysFromNow(10),
    completedAt: null,
    createdAt: daysAgo(3),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_MANAGER_ID,
  },
  {
    id: "task-004",
    title: "Implement dark mode toggle",
    description:
      "Add theme switching capability with system preference detection and smooth transitions.",
    status: "TODO",
    priority: "LOW",
    dueDate: daysFromNow(14),
    completedAt: null,
    createdAt: daysAgo(5),
    userId: DEMO_USER_ID,
    assigneeId: null,
  },
  {
    id: "task-005",
    title: "Database migration script",
    description:
      "Create migration scripts for PostgreSQL schema changes including new indexes and constraints.",
    status: "TODO",
    priority: "HIGH",
    dueDate: daysFromNow(2),
    completedAt: null,
    createdAt: daysAgo(1),
    userId: DEMO_ADMIN_ID,
    assigneeId: DEMO_USER_ID,
  },

  // DOING tasks
  {
    id: "task-006",
    title: "Build user authentication flow",
    description:
      "Implement JWT-based auth with refresh tokens, role-based access control, and secure cookie storage.",
    status: "DOING",
    priority: "CRITICAL",
    dueDate: daysFromNow(1),
    completedAt: null,
    createdAt: daysAgo(7),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_USER_ID,
  },
  {
    id: "task-007",
    title: "Create dashboard analytics",
    description:
      "Build interactive charts showing task distribution, completion rates, and team productivity metrics.",
    status: "DOING",
    priority: "HIGH",
    dueDate: daysFromNow(4),
    completedAt: null,
    createdAt: daysAgo(4),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_MANAGER_ID,
  },
  {
    id: "task-008",
    title: "Refactor notification system",
    description:
      "Migrate from polling to WebSocket-based real-time notifications with offline queue support.",
    status: "DOING",
    priority: "MEDIUM",
    dueDate: daysFromNow(7),
    completedAt: null,
    createdAt: daysAgo(6),
    userId: DEMO_USER_ID,
    assigneeId: null,
  },
  {
    id: "task-009",
    title: "Optimize database queries",
    description:
      "Profile and optimize slow queries in the task search endpoint. Add composite indexes for common filter combinations.",
    status: "DOING",
    priority: "HIGH",
    dueDate: daysAgo(1),
    completedAt: null,
    createdAt: daysAgo(10),
    userId: DEMO_ADMIN_ID,
    assigneeId: DEMO_USER_ID,
  },
  {
    id: "task-010",
    title: "Mobile responsive redesign",
    description:
      "Ensure all pages render correctly on mobile devices with touch-friendly interactions and proper viewport handling.",
    status: "DOING",
    priority: "MEDIUM",
    dueDate: daysFromNow(6),
    completedAt: null,
    createdAt: daysAgo(8),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_USER_ID,
  },

  // DONE tasks
  {
    id: "task-011",
    title: "Set up project repository",
    description:
      "Initialize monorepo with Maven multi-module structure, configure code formatting, and add pre-commit hooks.",
    status: "DONE",
    priority: "CRITICAL",
    dueDate: daysAgo(10),
    completedAt: daysAgo(8),
    createdAt: daysAgo(15),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_ADMIN_ID,
  },
  {
    id: "task-012",
    title: "Design database schema",
    description:
      "Create ERD and define all tables, relationships, and constraints for the task management system.",
    status: "DONE",
    priority: "HIGH",
    dueDate: daysAgo(8),
    completedAt: daysAgo(6),
    createdAt: daysAgo(14),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_USER_ID,
  },
  {
    id: "task-013",
    title: "Implement task CRUD API",
    description:
      "Build RESTful endpoints for creating, reading, updating, and deleting tasks with proper validation.",
    status: "DONE",
    priority: "CRITICAL",
    dueDate: daysAgo(5),
    completedAt: daysAgo(3),
    createdAt: daysAgo(12),
    userId: DEMO_USER_ID,
    assigneeId: DEMO_MANAGER_ID,
  },
  {
    id: "task-014",
    title: "Add unit tests for core",
    description:
      "Write comprehensive unit tests for TaskManager, CommentManager, and ActivityLogService achieving 80%+ coverage.",
    status: "DONE",
    priority: "MEDIUM",
    dueDate: daysAgo(3),
    completedAt: daysAgo(2),
    createdAt: daysAgo(10),
    userId: DEMO_USER_ID,
    assigneeId: null,
  },
  {
    id: "task-015",
    title: "Configure Docker setup",
    description:
      "Create Dockerfile and docker-compose.yml for backend, frontend, and PostgreSQL with proper networking.",
    status: "DONE",
    priority: "HIGH",
    dueDate: daysAgo(4),
    completedAt: daysAgo(2),
    createdAt: daysAgo(11),
    userId: DEMO_ADMIN_ID,
    assigneeId: DEMO_ADMIN_ID,
  },
];

// ===== Mock Activities =====
let mockActivities: ActivityLogResponse[] = [
  {
    id: "act-001",
    action: "CREATED",
    description: "Created task: Design new landing page",
    username: "demo@tasksphere.io",
    taskId: "task-001",
    taskTitle: "Design new landing page",
    timestamp: daysAgo(2),
  },
  {
    id: "act-002",
    action: "ASSIGNED",
    description:
      "Assigned task: Design new landing page to demo@tasksphere.io",
    username: "demo@tasksphere.io",
    taskId: "task-001",
    taskTitle: "Design new landing page",
    timestamp: daysAgo(2),
  },
  {
    id: "act-003",
    action: "CREATED",
    description: "Created task: Set up CI/CD pipeline",
    username: "demo@tasksphere.io",
    taskId: "task-002",
    taskTitle: "Set up CI/CD pipeline",
    timestamp: daysAgo(1),
  },
  {
    id: "act-004",
    action: "STATUS_CHANGED",
    description:
      "Changed status of Build user authentication flow from TODO to DOING",
    username: "demo@tasksphere.io",
    taskId: "task-006",
    taskTitle: "Build user authentication flow",
    timestamp: daysAgo(5),
  },
  {
    id: "act-005",
    action: "COMMENTED",
    description: "Commented on Build user authentication flow",
    username: "manager@tasksphere.io",
    taskId: "task-006",
    taskTitle: "Build user authentication flow",
    timestamp: daysAgo(4),
  },
  {
    id: "act-006",
    action: "CREATED",
    description: "Created task: Create dashboard analytics",
    username: "manager@tasksphere.io",
    taskId: "task-007",
    taskTitle: "Create dashboard analytics",
    timestamp: daysAgo(4),
  },
  {
    id: "act-007",
    action: "STATUS_CHANGED",
    description:
      "Changed status of Set up project repository from DOING to DONE",
    username: "admin@tasksphere.io",
    taskId: "task-011",
    taskTitle: "Set up project repository",
    timestamp: daysAgo(8),
  },
  {
    id: "act-008",
    action: "STATUS_CHANGED",
    description:
      "Changed status of Implement task CRUD API from DOING to DONE",
    username: "demo@tasksphere.io",
    taskId: "task-013",
    taskTitle: "Implement task CRUD API",
    timestamp: daysAgo(3),
  },
  {
    id: "act-009",
    action: "UPDATED",
    description: "Updated task: Optimize database queries",
    username: "admin@tasksphere.io",
    taskId: "task-009",
    taskTitle: "Optimize database queries",
    timestamp: daysAgo(3),
  },
  {
    id: "act-010",
    action: "CREATED",
    description: "Created task: Database migration script",
    username: "admin@tasksphere.io",
    taskId: "task-005",
    taskTitle: "Database migration script",
    timestamp: daysAgo(1),
  },
  {
    id: "act-011",
    action: "DELETED",
    description: "Deleted task: Old deprecated endpoint",
    username: "admin@tasksphere.io",
    taskId: null,
    taskTitle: null,
    timestamp: daysAgo(6),
  },
  {
    id: "act-012",
    action: "ASSIGNED",
    description:
      "Assigned task: Create dashboard analytics to manager@tasksphere.io",
    username: "demo@tasksphere.io",
    taskId: "task-007",
    taskTitle: "Create dashboard analytics",
    timestamp: daysAgo(4),
  },
  {
    id: "act-013",
    action: "STATUS_CHANGED",
    description:
      "Changed status of Design database schema from DOING to DONE",
    username: "demo@tasksphere.io",
    taskId: "task-012",
    taskTitle: "Design database schema",
    timestamp: daysAgo(6),
  },
  {
    id: "act-014",
    action: "COMMENTED",
    description: "Commented on Create dashboard analytics",
    username: "demo@tasksphere.io",
    taskId: "task-007",
    taskTitle: "Create dashboard analytics",
    timestamp: daysAgo(3),
  },
  {
    id: "act-015",
    action: "CREATED",
    description: "Created task: Mobile responsive redesign",
    username: "demo@tasksphere.io",
    taskId: "task-010",
    taskTitle: "Mobile responsive redesign",
    timestamp: daysAgo(8),
  },
];

// ===== Mock Comments =====
const mockCommentsMap: Record<string, CommentResponse[]> = {
  "task-006": [
    {
      id: "comment-001",
      content:
        "I've started working on the JWT implementation. The token generation and validation are working.",
      username: "demo@tasksphere.io",
      taskId: "task-006",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    {
      id: "comment-002",
      content:
        "Great progress! Make sure to handle token refresh properly and add rate limiting.",
      username: "manager@tasksphere.io",
      taskId: "task-006",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      id: "comment-003",
      content: "Added refresh token rotation. Will add rate limiting next.",
      username: "demo@tasksphere.io",
      taskId: "task-006",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ],
  "task-007": [
    {
      id: "comment-004",
      content:
        "Looking at Recharts for the visualization library. It has great React integration.",
      username: "manager@tasksphere.io",
      taskId: "task-007",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      id: "comment-005",
      content:
        "Recharts looks good. Can you also add export to PNG functionality?",
      username: "demo@tasksphere.io",
      taskId: "task-007",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ],
  "task-009": [
    {
      id: "comment-006",
      content:
        "The task search query is taking 3+ seconds on large datasets. Need to add composite indexes.",
      username: "admin@tasksphere.io",
      taskId: "task-009",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
  ],
  "task-001": [
    {
      id: "comment-007",
      content:
        "Should we use the new brand colors or stick with the current palette?",
      username: "demo@tasksphere.io",
      taskId: "task-001",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ],
};

// ===== Mock Users =====
let mockUsers: UserAdminResponse[] = [
  {
    id: DEMO_USER_ID,
    username: "demouser",
    email: "demo@tasksphere.io",
    role: "USER",
    firstName: "Demo",
    lastName: "User",
    enabled: true,
  },
  {
    id: DEMO_ADMIN_ID,
    username: "admin",
    email: "admin@tasksphere.io",
    role: "ADMIN",
    firstName: "Admin",
    lastName: "User",
    enabled: true,
  },
  {
    id: DEMO_MANAGER_ID,
    username: "manager",
    email: "manager@tasksphere.io",
    role: "MANAGER",
    firstName: "Manager",
    lastName: "User",
    enabled: true,
  },
  {
    id: "user-004",
    username: "johndoe",
    email: "john@tasksphere.io",
    role: "USER",
    firstName: "John",
    lastName: "Doe",
    enabled: true,
  },
  {
    id: "user-005",
    username: "janesmith",
    email: "jane@tasksphere.io",
    role: "USER",
    firstName: "Jane",
    lastName: "Smith",
    enabled: false,
  },
  {
    id: "user-006",
    username: "bobwilson",
    email: "bob@tasksphere.io",
    role: "MANAGER",
    firstName: "Bob",
    lastName: "Wilson",
    enabled: true,
  },
];

// ===== Dashboard Stats =====
function computeDashboardStats(): DashboardStatsResponse {
  const tasksByStatus: Record<string, number> = {};
  const tasksByPriority: Record<string, number> = {};
  let tasksCreatedThisWeek = 0;
  let tasksCompletedThisWeek = 0;
  let overdueTasks = 0;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  mockTasks.forEach((task) => {
    tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    tasksByPriority[task.priority] =
      (tasksByPriority[task.priority] || 0) + 1;

    if (task.createdAt && new Date(task.createdAt) >= oneWeekAgo) {
      tasksCreatedThisWeek++;
    }
    if (task.completedAt && new Date(task.completedAt) >= oneWeekAgo) {
      tasksCompletedThisWeek++;
    }
    if (
      task.dueDate &&
      task.status !== "DONE" &&
      new Date(task.dueDate) < new Date()
    ) {
      overdueTasks++;
    }
  });

  return {
    totalTasks: mockTasks.length,
    tasksByStatus,
    tasksByPriority,
    recentActivities: mockActivities.slice(0, 5),
    tasksCreatedThisWeek,
    tasksCompletedThisWeek,
    overdueTasks,
  };
}

// ===== Axios InternalRequestConfig type =====
interface MockAxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: Record<string, unknown>;
}

// ===== Mock API Handler =====
export function handleMockRequest(
  method: string,
  url: string,
  data?: unknown,
  params?: Record<string, unknown>
): MockAxiosResponse {
  const makeResponse = (responseData: unknown): MockAxiosResponse => ({
    data: responseData,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  });

  const m = method.toUpperCase();

  // Auth endpoints
  if (url === "/auth/login" && m === "POST") {
    return makeResponse({
      accessToken: "demo-access-token-" + Date.now(),
      refreshToken: "demo-refresh-token",
      tokenType: "Bearer",
      expiresIn: "3600",
    });
  }
  if (url === "/auth/register" && m === "POST") {
    return makeResponse({
      accessToken: "demo-access-token-" + Date.now(),
      refreshToken: "demo-refresh-token",
      tokenType: "Bearer",
      expiresIn: "3600",
    });
  }
  if (url === "/auth/logout") {
    return makeResponse({});
  }
  if (url === "/auth/refresh") {
    return makeResponse({
      accessToken: "demo-access-token-refreshed-" + Date.now(),
      refreshToken: "demo-refresh-token",
      expiresIn: "3600",
    });
  }

  // Dashboard
  if (url === "/dashboard/stats" && m === "GET") {
    return makeResponse(computeDashboardStats());
  }

  // Activities
  if (url === "/activities" && m === "GET") {
    const page = (params?.page as number) || 0;
    const size = (params?.size as number) || 20;
    const taskId = params?.taskId as string | undefined;

    let filtered = [...mockActivities];
    if (taskId) {
      filtered = filtered.filter((a) => a.taskId === taskId);
    }
    // Sort by timestamp descending
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return makeResponse({ content, totalElements, totalPages, number: page, size });
  }

  // Tasks list
  if (url === "/tasks" && m === "GET") {
    const page = (params?.page as number) || 0;
    const size = (params?.size as number) || 20;
    const totalElements = mockTasks.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    // Sort by createdAt descending
    const sorted = [...mockTasks].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
    const content = sorted.slice(start, start + size);
    return makeResponse({
      content,
      totalElements,
      totalPages,
      number: page,
      size,
    });
  }

  // Task search
  if (url === "/tasks/search" && m === "GET") {
    const page = (params?.page as number) || 0;
    const size = (params?.size as number) || 20;
    const keyword = (params?.keyword as string) || "";
    const status = params?.status as string | undefined;
    const priority = params?.priority as string | undefined;

    let filtered = [...mockTasks];
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(kw) ||
          t.description.toLowerCase().includes(kw)
      );
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const content = filtered.slice(start, start + size);
    return makeResponse({
      content,
      totalElements,
      totalPages,
      number: page,
      size,
    });
  }

  // Get single task
  const taskMatch = url.match(/^\/tasks\/([a-zA-Z0-9-]+)$/);
  if (taskMatch && m === "GET") {
    const taskId = taskMatch[1];
    const task = mockTasks.find((t) => t.id === taskId);
    return makeResponse(task || mockTasks[0]);
  }

  // Create task
  if (url === "/tasks" && m === "POST") {
    const inputData = (data || {}) as Record<string, unknown>;
    const newTask: TaskResponse = {
      id: mockId(),
      title: (inputData.title as string) || "New Task",
      description: (inputData.description as string) || "",
      status: "TODO",
      priority: (inputData.priority as string) || "MEDIUM",
      dueDate: (inputData.dueDate as string) || null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      userId: DEMO_USER_ID,
      assigneeId: (inputData.assigneeId as string) || null,
    };
    mockTasks.unshift(newTask);
    // Add activity
    mockActivities.unshift({
      id: mockId(),
      action: "CREATED",
      description: `Created task: ${newTask.title}`,
      username: "demo@tasksphere.io",
      taskId: newTask.id,
      taskTitle: newTask.title,
      timestamp: new Date().toISOString(),
    });
    return makeResponse(newTask);
  }

  // Update task
  const taskUpdateMatch = url.match(/^\/tasks\/([a-zA-Z0-9-]+)$/);
  if (taskUpdateMatch && m === "PUT") {
    const taskId = taskUpdateMatch[1];
    const idx = mockTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const inputData = (data || {}) as Record<string, unknown>;
      mockTasks[idx] = { ...mockTasks[idx], ...inputData } as TaskResponse;
      mockActivities.unshift({
        id: mockId(),
        action: "UPDATED",
        description: `Updated task: ${mockTasks[idx].title}`,
        username: "demo@tasksphere.io",
        taskId: mockTasks[idx].id,
        taskTitle: mockTasks[idx].title,
        timestamp: new Date().toISOString(),
      });
      return makeResponse(mockTasks[idx]);
    }
    return makeResponse(mockTasks[0]);
  }

  // Delete task
  if (taskMatch && m === "DELETE") {
    const taskId = taskMatch[1];
    const idx = mockTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const deleted = mockTasks.splice(idx, 1)[0];
      mockActivities.unshift({
        id: mockId(),
        action: "DELETED",
        description: `Deleted task: ${deleted.title}`,
        username: "demo@tasksphere.io",
        taskId: null,
        taskTitle: null,
        timestamp: new Date().toISOString(),
      });
    }
    return makeResponse({});
  }

  // Change task status
  const taskStatusMatch = url.match(/^\/tasks\/([a-zA-Z0-9-]+)\/status$/);
  if (taskStatusMatch && m === "PATCH") {
    const taskId = taskStatusMatch[1];
    const idx = mockTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const oldStatus = mockTasks[idx].status;
      const inputData = (data || {}) as Record<string, unknown>;
      const newStatus = inputData.status as string;
      mockTasks[idx].status = newStatus;
      if (newStatus === "DONE") {
        mockTasks[idx].completedAt = new Date().toISOString();
      } else {
        mockTasks[idx].completedAt = null;
      }
      mockActivities.unshift({
        id: mockId(),
        action: "STATUS_CHANGED",
        description: `Changed status of ${mockTasks[idx].title} from ${oldStatus} to ${newStatus}`,
        username: "demo@tasksphere.io",
        taskId: mockTasks[idx].id,
        taskTitle: mockTasks[idx].title,
        timestamp: new Date().toISOString(),
      });
      return makeResponse(mockTasks[idx]);
    }
    return makeResponse(mockTasks[0]);
  }

  // Assign task
  const taskAssignMatch = url.match(/^\/tasks\/([a-zA-Z0-9-]+)\/assign$/);
  if (taskAssignMatch && m === "PATCH") {
    const taskId = taskAssignMatch[1];
    const idx = mockTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const inputData = (data || {}) as Record<string, unknown>;
      mockTasks[idx].assigneeId =
        (inputData.assigneeId as string) || null;
      mockActivities.unshift({
        id: mockId(),
        action: "ASSIGNED",
        description: `Assigned task: ${mockTasks[idx].title}`,
        username: "demo@tasksphere.io",
        taskId: mockTasks[idx].id,
        taskTitle: mockTasks[idx].title,
        timestamp: new Date().toISOString(),
      });
      return makeResponse(mockTasks[idx]);
    }
    return makeResponse(mockTasks[0]);
  }

  // Comments for a task
  const commentsMatch = url.match(/^\/tasks\/([a-zA-Z0-9-]+)\/comments$/);
  if (commentsMatch && m === "GET") {
    const taskId = commentsMatch[1];
    return makeResponse(mockCommentsMap[taskId] || []);
  }
  if (commentsMatch && m === "POST") {
    const taskId = commentsMatch[1];
    const inputData = (data || {}) as Record<string, unknown>;
    const newComment: CommentResponse = {
      id: mockId(),
      content: (inputData.content as string) || "",
      username: "demo@tasksphere.io",
      taskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!mockCommentsMap[taskId]) mockCommentsMap[taskId] = [];
    mockCommentsMap[taskId].push(newComment);
    return makeResponse(newComment);
  }

  // Update/Delete comment
  const commentMatch = url.match(/^\/comments\/([a-zA-Z0-9-]+)$/);
  if (commentMatch && m === "PUT") {
    const commentId = commentMatch[1];
    const inputData = (data || {}) as Record<string, unknown>;
    for (const taskId of Object.keys(mockCommentsMap)) {
      const idx = mockCommentsMap[taskId].findIndex((c) => c.id === commentId);
      if (idx !== -1) {
        mockCommentsMap[taskId][idx].content =
          (inputData.content as string) ||
          mockCommentsMap[taskId][idx].content;
        mockCommentsMap[taskId][idx].updatedAt = new Date().toISOString();
        return makeResponse(mockCommentsMap[taskId][idx]);
      }
    }
    return makeResponse({});
  }
  if (commentMatch && m === "DELETE") {
    const commentId = commentMatch[1];
    for (const taskId of Object.keys(mockCommentsMap)) {
      const idx = mockCommentsMap[taskId].findIndex((c) => c.id === commentId);
      if (idx !== -1) {
        mockCommentsMap[taskId].splice(idx, 1);
        return makeResponse({});
      }
    }
    return makeResponse({});
  }

  // Admin users
  if (url === "/iam/admin/users" && m === "GET") {
    return makeResponse(mockUsers);
  }

  // Change role
  const userRoleMatch = url.match(
    /^\/iam\/admin\/users\/([a-zA-Z0-9-]+)\/role$/
  );
  if (userRoleMatch && m === "PATCH") {
    const userId = userRoleMatch[1];
    const inputData = (data || {}) as Record<string, unknown>;
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      user.role = inputData.role as string;
      return makeResponse(user);
    }
    return makeResponse({});
  }

  // Toggle user status
  const userToggleMatch = url.match(
    /^\/iam\/admin\/users\/([a-zA-Z0-9-]+)\/toggle$/
  );
  if (userToggleMatch && m === "PATCH") {
    const userId = userToggleMatch[1];
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      user.enabled = !user.enabled;
      return makeResponse(user);
    }
    return makeResponse({});
  }

  // Default: return empty object for unmatched endpoints
  return makeResponse({});
}

// Check if demo mode is active
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("tasksphere_auth");
    if (stored) {
      const auth = JSON.parse(stored);
      return auth.isDemo === true;
    }
  } catch {
    // ignore
  }
  return false;
}
