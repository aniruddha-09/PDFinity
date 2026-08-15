/**
 * PDFusion API Client
 */

const API_BASE = typeof window !== 'undefined'
  ? ''
  : (process.env.BACKEND_URL || 'http://127.0.0.1:8000');

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface JobResponse {
  id: string;
  operation: string;
  status: 'pending' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  progress: number;
  input_file_ids: string[];
  output_file_id?: string | null;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
  output_url?: string | null;
  options?: Record<string, any>;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Token helper
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pdfusion_token');
}

export function setAccessToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pdfusion_token', token);
  }
}

export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pdfusion_token');
    localStorage.removeItem('pdfusion_refresh');
  }
}

// Generic fetcher
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' 
          ? errJson.detail 
          : JSON.stringify(errJson.detail);
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ── Auth APIs ──
export async function registerUser(email: string, password: string, full_name?: string): Promise<AuthTokens> {
  const data = await apiFetch<AuthTokens>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });
  setAccessToken(data.access_token);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const data = await apiFetch<AuthTokens>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.access_token);
  return data;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/api/auth/me');
}

// ── Jobs APIs ──
export async function getJob(jobId: string): Promise<JobResponse> {
  return apiFetch<JobResponse>(`/api/jobs/${jobId}`);
}

export async function listJobs(skip = 0, limit = 20): Promise<JobResponse[]> {
  return apiFetch<JobResponse[]>(`/api/jobs?skip=${skip}&limit=${limit}`);
}

// ── Polling Helper ──
export function pollJob(
  jobId: string,
  onProgress: (job: JobResponse) => void,
  intervalMs = 1500,
  maxAttempts = 120
): Promise<JobResponse> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const job = await getJob(jobId);
        onProgress(job);

        if (job.status === 'completed') {
          clearInterval(interval);
          resolve(job);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          reject(new Error(job.error_message || 'Job processing failed.'));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Job processing timed out.'));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, intervalMs);
  });
}

// ── Tool Direct Execution (Multipart form upload) ──
export async function executeTool(
  toolSlug: string,
  files: File[],
  options: Record<string, string | number | boolean> = {}
): Promise<JobResponse> {
  const formData = new FormData();

  // Attach files
  if (toolSlug === 'merge' || toolSlug === 'images-to-pdf') {
    files.forEach((file) => formData.append('files', file));
  } else {
    if (files.length > 0) {
      formData.append('file', files[0]);
    }
  }

  // Attach options
  Object.entries(options).forEach(([key, val]) => {
    formData.append(key, String(val));
  });

  return apiFetch<JobResponse>(`/api/tools/${toolSlug}`, {
    method: 'POST',
    body: formData,
  });
}

export function getDownloadUrl(outputFileId?: string | null): string {
  if (!outputFileId) return '#';
  return `${API_BASE}/api/files/${outputFileId}/download`;
}
