"use client";

import { useState } from "react";
import type { SessionPayload } from "@/lib/app-types";
import { updatePassword } from "@/lib/api-client";

export function AccountPanel({ session }: { session: SessionPayload }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updatePassword(session.token, {
        currentPassword,
        nextPassword,
      });
      setCurrentPassword("");
      setNextPassword("");
      setMessage("密码修改成功，下次请用新密码登录。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "修改失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel rounded-[28px] p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(109,77,63,0.46)]">
        账号设置
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block rounded-[20px] border border-line bg-white/72 p-4">
          <span className="text-sm text-[rgba(109,77,63,0.62)]">当前密码</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-3 w-full border-none bg-transparent p-0 text-sm outline-none"
          />
        </label>
        <label className="block rounded-[20px] border border-line bg-white/72 p-4">
          <span className="text-sm text-[rgba(109,77,63,0.62)]">新密码</span>
          <input
            type="password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            className="mt-3 w-full border-none bg-transparent p-0 text-sm outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#ff8ca3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff728d]"
        >
          {loading ? "提交中..." : "修改密码"}
        </button>
      </form>

      {message ? (
        <div className="mt-4 rounded-[18px] border border-line bg-white/72 px-4 py-3 text-sm text-[rgba(109,77,63,0.72)]">
          {message}
        </div>
      ) : null}
    </section>
  );
}
