const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

const ACCESS_KEY = "mt_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_KEY);
}

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isForm?: boolean;
  isFile?: boolean;
  skipAuth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isForm, isFile, skipAuth } = opts;
  const headers: Record<string, string> = {};
  if (!isForm && !isFile) headers["Content-Type"] = "application/json";
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (isFile) payload = body as FormData;
  else if (isForm) payload = new URLSearchParams(body as Record<string, string>);
  else if (body !== undefined) payload = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = await res.json();
      detail = errBody.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Types ---------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: "clinic_staff" | "radiologist" | "admin";
  created_at: string;
}

export interface Patient {
  id: number;
  full_name: string;
  age: number | null;
  sex: string | null;
  medical_record_number: string | null;
  created_at: string;
}

export type Priority = "urgent" | "moderate" | "low";
export type ScanStatus = "pending" | "reviewed" | "cleared";

export interface Prediction {
  id: number;
  predicted_class: string;
  confidence: number;
  priority: Priority;
  all_probabilities: string; // JSON string
  created_at: string;
}

export interface Scan {
  id: number;
  patient_id: number;
  file_name: string;
  status: ScanStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  prediction: Prediction | null;
}

// --- Auth ------------------------------------------------------------------

export const authApi = {
  signup: (email: string, password: string, full_name: string | undefined, role: string) =>
    request<User>("/users", { method: "POST", body: { email, password, full_name, role }, skipAuth: true }),

  login: async (email: string, password: string) => {
    const data = await request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      isForm: true,
      body: { username: email, password },
      skipAuth: true,
    });
    setAccessToken(data.access_token);
    return data;
  },

  logout: () => clearAccessToken(),
};

// --- Patients --------------------------------------------------------------

export const patientsApi = {
  list: () => request<Patient[]>("/patients"),
  create: (data: { full_name: string; age?: number; sex?: string; medical_record_number?: string }) =>
    request<Patient>("/patients", { method: "POST", body: data }),
  get: (id: number) => request<Patient>(`/patients/${id}`),
};

// --- Scans -----------------------------------------------------------------

export const scansApi = {
  listForPatient: (patientId: number) => request<Scan[]>(`/patients/${patientId}/scans`),
  get: (id: number) => request<Scan>(`/scans/${id}`),
  upload: (patientId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Scan>(`/patients/${patientId}/scans`, { method: "POST", isFile: true, body: form });
  },
  
  fetchImageBlobUrl: async (scanId: number): Promise<string> => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/scans/${scanId}/image`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, "Could not load scan image");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

// --- Triage queue ------------------------------------------------------

export const queueApi = {
  get: () => request<Scan[]>("/queue"),
  review: (scanId: number, status: "reviewed" | "cleared", notes?: string) =>
    request<Scan>(`/queue/scans/${scanId}/review`, {
      method: "PATCH",
      body: { status, review_notes: notes },
    }),
};

export { API_BASE };
