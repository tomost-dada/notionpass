"use client";

import { useEffect } from "react";

type AlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  classTitle: string;
  count: number;
  goal: number;
};

export function AlertModal({ isOpen, onClose, classTitle, count, goal }: AlertModalProps) {
  const pct = Math.min(100, Math.round((count / goal) * 100));

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

  const shareText = `"${classTitle}" 클래스에 알림 신청했어요! 수요가 모이면 개설돼요. 같이 들을래? 🔔`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "NotionPass", text: shareText, url: shareUrl });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert("링크가 복사되었어요!");
    }
  };

  const handleKakaoShare = () => {
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=&url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    // Fallback: copy to clipboard since Kakao SDK not loaded
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    alert("링크가 복사되었어요! 카카오톡에 붙여넣기 해주세요 💬");
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
          maxWidth: 400,
          position: "relative",
          textAlign: "center",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--yellow)",
            borderBottom: "2px solid #000",
            padding: "20px 24px",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
            알림 신청 완료!
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 24px" }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>
            <strong>{classTitle}</strong>
          </p>

          {/* Progress */}
          <div style={{
            background: "var(--gray-light)",
            border: "2px solid #000",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 4 }}>
              {pct}% 달성
            </div>
            <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12 }}>
              현재 {count}명 / 목표 {goal}명
            </div>
            <div style={{ height: 10, background: "var(--white)", borderRadius: 5, border: "1.5px solid #000", overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`,
                height: "100%",
                background: pct >= 100 ? "var(--black)" : "var(--yellow)",
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>

          <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24, lineHeight: 1.6 }}>
            수요가 모이면 클래스가 열려요!
            <br />친구에게 공유하면 더 빨리 열릴 수 있어요 ⚡
          </p>

          {/* Share buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              className="btn-push"
              onClick={handleKakaoShare}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 8,
                background: "#FEE500",
                color: "#000",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              💬 카카오톡 공유
            </button>
            <button
              className="btn-push-sm"
              onClick={handleShare}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 8,
                background: "var(--white)",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              🔗 링크 복사
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 0",
              background: "none",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              opacity: 0.4,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
