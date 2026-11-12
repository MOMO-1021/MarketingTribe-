"use server";

import { compareSync, hashSync } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { HOST_EMAIL, PRACTICES } from "./constants";
import {
  createPost,
  createReply,
  createUser,
  deletePost as removePost,
  deleteReply as removeReply,
  emailTaken,
  getPost,
  getUserByEmail,
  markWelcomeRead,
  updatePost as savePost,
  updateReply as saveReply,
  updateUser,
} from "./db";
import { clearSession, getCurrentUser, setSession } from "./session";

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function keepLines(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.welcome_read_at === null) redirect("/welcome");
  return user;
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

export async function signup(formData: FormData) {
  const name = clean(formData.get("name"), 40);
  const email = clean(formData.get("email"), 120).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const practice = clean(formData.get("practice"), 40);
  const city = clean(formData.get("city"), 40);
  const confirm = formData.get("confirm");

  if (name.length < 2) redirect("/signup?e=name");
  if (!validEmail(email) || email === HOST_EMAIL) redirect("/signup?e=email");
  if (password.length < 8 || password.length > 200) redirect("/signup?e=password");
  if (!PRACTICES.includes(practice as (typeof PRACTICES)[number])) redirect("/signup?e=practice");
  if (city.length < 2) redirect("/signup?e=city");
  if (confirm !== "on") redirect("/signup?e=confirm");
  if (await emailTaken(email)) redirect("/signup?e=taken");

  const id = await createUser({
    email,
    passwordHash: hashSync(password, 10),
    name,
    practice,
    city,
  });
  await setSession(id);
  redirect("/welcome");
}

export async function login(formData: FormData) {
  const email = clean(formData.get("email"), 120).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = validEmail(email) ? await getUserByEmail(email) : null;
  if (!user || user.email === HOST_EMAIL || !compareSync(password, user.password_hash)) {
    redirect("/login?e=credentials");
  }
  await setSession(user.id, user.session_version);
  redirect(user.welcome_read_at === null ? "/welcome" : "/home");
}

export async function acknowledgeWelcome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await markWelcomeRead(user.id);
  revalidatePath("/", "layout");
  redirect("/home");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function publishThread(formData: FormData) {
  const user = await requireUser();
  const slug = clean(formData.get("community"), 40);
  const title = clean(formData.get("title"), 200);
  const rawBody = String(formData.get("body") ?? "");
  const back = `/new?c=${encodeURIComponent(slug)}`;
  if (title.length < 8 || title.length > 160) redirect(`${back}&e=title`);
  if (rawBody.trim().length > 8000) redirect(`${back}&e=body`);
  const body = keepLines(formData.get("body"), 8000);

  const id = await createPost({
    userId: user.id,
    communitySlug: slug,
    title,
    body,
  });
  if (id === null) redirect("/new?e=community");
  revalidatePath("/", "layout");
  redirect(`/p/${id}`);
}

export async function editThread(formData: FormData) {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(postId) || postId <= 0) redirect("/home");

  const post = await getPost(postId, user.id);
  if (!post) redirect("/home");
  if (post.author_id !== user.id) redirect(`/p/${postId}?threadError=forbidden`);

  const title = clean(formData.get("title"), 200);
  const rawBody = String(formData.get("body") ?? "");
  if (title.length < 8 || title.length > 160) redirect(`/p/${postId}?threadError=title`);
  if (rawBody.trim().length > 8000) redirect(`/p/${postId}?threadError=body`);

  await savePost(postId, user.id, title, keepLines(formData.get("body"), 8000));
  revalidatePath("/", "layout");
  redirect(`/p/${postId}`);
}

export async function reply(formData: FormData) {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));
  const parentReplyIdValue = formData.get("parentReplyId");
  const parentReplyId = parentReplyIdValue ? Number(parentReplyIdValue) : null;
  const raw = String(formData.get("body") ?? "");
  const body = raw.replace(/\r\n/g, "\n").trim();
  if (
    !Number.isInteger(postId) ||
    postId <= 0 ||
    (parentReplyId !== null && (!Number.isInteger(parentReplyId) || parentReplyId <= 0))
  ) redirect("/home");
  const replyTarget = parentReplyId === null ? "" : `&replyTo=${parentReplyId}`;
  if (!body) redirect(`/p/${postId}?e=comment${replyTarget}`);
  if (body.length > 4000) redirect(`/p/${postId}?e=commentlong${replyTarget}`);
  const saved = await createReply(postId, user.id, body, parentReplyId);
  if (!saved) redirect(`/p/${postId}`);
  revalidatePath("/", "layout");
  redirect(`/p/${postId}`);
}

export async function editReply(formData: FormData) {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));
  const replyId = Number(formData.get("replyId"));
  if (!Number.isInteger(postId) || postId <= 0 || !Number.isInteger(replyId) || replyId <= 0) {
    redirect("/home");
  }

  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const errorPath = `/p/${postId}?replyId=${replyId}&replyError=`;
  if (!body) redirect(`${errorPath}comment`);
  if (body.length > 4000) redirect(`${errorPath}commentlong`);
  if (!(await saveReply(replyId, postId, user.id, body))) {
    redirect(`${errorPath}replyforbidden`);
  }

  revalidatePath("/", "layout");
  redirect(`/p/${postId}`);
}

export async function removeThread(formData: FormData) {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(postId) || postId <= 0) redirect("/home");
  const removed = await removePost(postId, user.id);
  if (!removed) {
    const post = await getPost(postId, user.id);
    if (!post) redirect("/home");
    if (post.author_id !== user.id) redirect(`/p/${postId}?e=forbidden`);
    redirect("/home");
  }
  revalidatePath("/", "layout");
  redirect("/home");
}

export async function removeComment(formData: FormData) {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));
  const replyId = Number(formData.get("replyId"));
  if (!Number.isInteger(postId) || !Number.isInteger(replyId)) redirect("/home");
  await removeReply(replyId, user.id);
  revalidatePath("/", "layout");
  redirect(`/p/${postId}`);
}

export async function saveProfile(formData: FormData) {
  const user = await requireUser();
  const name = clean(formData.get("name"), 40);
  const practice = clean(formData.get("practice"), 40);
  const city = clean(formData.get("city"), 40);
  if (
    name.length < 2 ||
    city.length < 2 ||
    !PRACTICES.includes(practice as (typeof PRACTICES)[number])
  ) {
    redirect(`/u/${user.id}?e=profile`);
  }
  await updateUser(user.id, { name, practice, city });
  revalidatePath("/", "layout");
  redirect(`/u/${user.id}`);
}
