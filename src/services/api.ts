// Centralized API Service for AI-Integrated Student Assistant

const BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('academic_auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type if body is FormData
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Clear invalid token if session expired
        if (token && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('academic_auth_token');
          window.dispatchEvent(new Event('auth-expired'));
        }
      }

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg = data && typeof data === 'object' && data.error
          ? data.error
          : `Server returned error (${response.status}): ${response.statusText}`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to the backend server. Please verify your connection.');
      }
      throw err;
    }
  }

  // 1. Auth APIs
  async login(credentials: { email: string; password: string }) {
    return this.request<{ message: string; user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: any) {
    return this.request<{ message: string; user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/api/auth/me');
  }

  // 2. Profile APIs
  async getProfile() {
    return this.request<{ profile: any }>('/api/users/profile');
  }

  async updateProfile(profileData: any) {
    return this.request<{ message: string; profile: any }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // 3. Subjects / Courses APIs
  async getSubjects() {
    return this.request<{ subjects: any[] }>('/api/subjects');
  }

  async getSubjectById(id: string) {
    return this.request<{ subject: any }>(`/api/subjects/${id}`);
  }

  async createSubject(data: { name: string; code: string; description: string; enrolledStudents?: string[] }) {
    return this.request<{ message: string; subject: any }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id: string, data: any) {
    return this.request<{ message: string; subject: any }>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: string) {
    return this.request<{ message: string }>(`/api/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // 4. Students APIs
  async getStudents(params?: { search?: string; courseId?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.courseId) query.append('courseId', params.courseId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ students: any[] }>(`/api/students${qs}`);
  }

  async createStudent(data: any) {
    return this.request<{ message: string; student: any }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudent(id: string, data: any) {
    return this.request<{ message: string; student: any }>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStudent(id: string) {
    return this.request<{ message: string }>(`/api/students/${id}`, {
      method: 'DELETE',
    });
  }

  // 5. Attendance APIs
  async getAttendance(params?: { subjectId?: string; date?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.date) query.append('date', params.date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any>(`/api/attendance${qs}`);
  }

  async saveAttendance(data: { subjectId: string; date: string; records: any[] }) {
    return this.request<{ message: string; session: any; stats: any }>('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendance(id: string, data: { records: any[] }) {
    return this.request<{ message: string; session: any }>(`/api/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 6. Assignments APIs
  async getAssignments(params?: { subjectId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ assignments: any[] }>(`/api/assignments${qs}`);
  }

  async getAssignmentById(id: string) {
    return this.request<{ assignment: any }>(`/api/assignments/${id}`);
  }

  async createAssignment(formData: FormData) {
    return this.request<{ message: string; assignment: any }>('/api/assignments', {
      method: 'POST',
      body: formData,
    });
  }

  async updateAssignment(id: string, formData: FormData) {
    return this.request<{ message: string; assignment: any }>(`/api/assignments/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteAssignment(id: string) {
    return this.request<{ message: string }>(`/api/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async submitAssignment(id: string, formData: FormData) {
    return this.request<{ message: string; submission: any }>(`/api/assignments/${id}/submit`, {
      method: 'POST',
      body: formData,
    });
  }

  async getSubmissions(assignmentId: string) {
    return this.request<{ submissions: any[] }>(`/api/assignments/${assignmentId}/submissions`);
  }

  async gradeSubmission(submissionId: string, data: { marks: number; feedback: string }) {
    return this.request<{ message: string; submission: any }>(
      `/api/assignments/submissions/${submissionId}/grade`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  // 7. Study Materials APIs
  async getMaterials(params?: { subjectId?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ materials: any[] }>(`/api/materials${qs}`);
  }

  async createMaterial(formData: FormData) {
    return this.request<{ message: string; material: any }>('/api/materials', {
      method: 'POST',
      body: formData,
    });
  }

  async updateMaterial(id: string, formData: FormData) {
    return this.request<{ message: string; material: any }>(`/api/materials/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteMaterial(id: string) {
    return this.request<{ message: string }>(`/api/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // 8. Exams APIs
  async getExams(params?: { subjectId?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ exams: any[] }>(`/api/exams${qs}`);
  }

  async createExam(data: any) {
    return this.request<{ message: string; exam: any }>('/api/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExam(id: string, data: any) {
    return this.request<{ message: string; exam: any }>(`/api/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExam(id: string) {
    return this.request<{ message: string }>(`/api/exams/${id}`, {
      method: 'DELETE',
    });
  }

  // 9. Planner APIs
  async getPlannerTasks() {
    return this.request<{ tasks: any[] }>('/api/planner');
  }

  async createPlannerTask(data: any) {
    return this.request<{ message: string; task: any }>('/api/planner', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlannerTask(id: string, data: any) {
    return this.request<{ message: string; task: any }>(`/api/planner/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlannerTask(id: string) {
    return this.request<{ message: string }>(`/api/planner/${id}`, {
      method: 'DELETE',
    });
  }

  // 10. Announcements APIs
  async getAnnouncements(params?: { subjectId?: string }) {
    const query = new URLSearchParams();
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ announcements: any[] }>(`/api/announcements${qs}`);
  }

  async createAnnouncement(data: any) {
    return this.request<{ message: string; announcement: any }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id: string, data: any) {
    return this.request<{ message: string; announcement: any }>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.request<{ message: string }>(`/api/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // 11. Progress Analytics API
  async getProgress() {
    return this.request<any>('/api/progress');
  }

  // 12. AI Assistant APIs
  async sendAIChat(prompt: string) {
    return this.request<{ reply: string; messageId: string; createdAt: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async getAIHistory() {
    return this.request<{ messages: any[] }>('/api/ai/history');
  }

  async clearAIHistory() {
    return this.request<{ success: boolean; message: string }>('/api/ai/history', {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
