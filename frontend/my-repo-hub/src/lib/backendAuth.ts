import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

export interface BackendAuthResponse {
  access_token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    full_name?: string | null;
  };
  membership: {
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
    role: string;
  };
  supabase_session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

async function handleSupabaseSession(payload?: BackendAuthResponse["supabase_session"]) {
  if (!payload) {
    throw new Error("Resposta do backend não trouxe sessão do Supabase");
  }
  const { error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (error) {
    throw error;
  }
}

async function request(path: string, body: Record<string, unknown>): Promise<BackendAuthResponse> {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL não configurado");
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || "Falha na autenticação");
  }
  await handleSupabaseSession(data.supabase_session);
  return data;
}

// Fallback para autenticação direta via Supabase
async function loginViaSupabaseFallback(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

async function signupViaSupabaseFallback(email: string, password: string, fullName: string) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

export async function signupViaBackend(payload: {
  full_name: string;
  email: string;
  password: string;
  tenant_name: string;
}) {
  try {
    return await request("/auth/signup", payload);
  } catch (error) {
    console.warn("Backend indisponível, usando Supabase diretamente:", error);
    await signupViaSupabaseFallback(payload.email, payload.password, payload.full_name);
    // Retorna estrutura compatível após fallback
    const { data: { user } } = await supabase.auth.getUser();
    return {
      access_token: "",
      expires_at: "",
      user: {
        id: user?.id || "",
        email: user?.email || "",
        full_name: payload.full_name,
      },
      membership: {
        tenant: { id: "", name: payload.tenant_name, slug: "" },
        role: "member",
      },
    } as BackendAuthResponse;
  }
}

export async function loginViaBackend(payload: {
  email: string;
  password: string;
}) {
  try {
    return await request("/auth/login", payload);
  } catch (error) {
    console.warn("Backend indisponível, usando Supabase diretamente:", error);
    const data = await loginViaSupabaseFallback(payload.email, payload.password);
    // Retorna estrutura compatível após fallback
    return {
      access_token: data.session?.access_token || "",
      expires_at: "",
      user: {
        id: data.user?.id || "",
        email: data.user?.email || "",
        full_name: data.user?.user_metadata?.full_name || null,
      },
      membership: {
        tenant: { id: "", name: "", slug: "" },
        role: "member",
      },
    } as BackendAuthResponse;
  }
}
