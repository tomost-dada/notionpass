"use client";

import { useState, useEffect } from "react";

type RequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function RequestModal({ isOpen, onClose }: RequestModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/class-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), nickname: nickname.trim() }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setTitle("");
          setDescription("");
          setNickname("");
          onClose();
        }, 2000);
      }
    } catch {
      // handle error silently for MVP
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)",
          border: "2px solid #000",
          boxShadow: "12px 12px 0px 0px #000",
          width: "100%",
          maxWidth: 480,
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--yellow)",
            borderBottom: "2px solid #000",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            💡 강의 주제 제안
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              fontWeight: 700,
              lineHeight: 1,
              fontFamily: "inherit",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <p style={{ fontSize: 18, fontWeight: 700 }}>
                제안이 등록되었습니다!
              </p>
              <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
                공감 투표를 많이 받으면 클래스로 개설됩니다
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  강의 주제 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: Notion으로 독서 관리 시스템 만들기"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #000",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                    borderRadius: 0,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="어떤 내용을 배우고 싶은지 자유롭게 적어주세요"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #000",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                    borderRadius: 0,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  닉네임 (선택)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="익명으로 제출할 수도 있어요"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #000",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                    borderRadius: 0,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-push"
                disabled={isSubmitting || !title.trim()}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  background: "var(--yellow)",
                  fontSize: 16,
                  fontWeight: 800,
                  borderRadius: 0,
                  opacity: isSubmitting || !title.trim() ? 0.5 : 1,
                }}
              >
                {isSubmitting ? "제출 중..." : "제안하기 →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
