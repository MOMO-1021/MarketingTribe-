"use server";

import { redirect } from "next/navigation";
import {
  checkAdminCredentials,
  clearAdminSession,
  setAdminSession,
} from "./admin-session";

export async function adminLogin(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  if (code.length > 256 || password.length > 256) {
    redirect("/admin/login?e=credentials");
  }
  if (!checkAdminCredentials(code, password)) {
    redirect("/admin/login?e=credentials");
  }
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}
