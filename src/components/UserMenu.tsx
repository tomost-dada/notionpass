"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export function UserMenu() {
  const { user, loading, signInWithKakao, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          width: 80,
          height: 40,
          background: "var(--gray-light)",
          border: "2px solid #000",
          borderRadius: 0,
        }}
      />
    );
  }

  if (!user) {
    return (
      <button
        className="btn-push"
        onClick={signInWithKakao}
        style={{
          background: "#FEE500",
          color: "#000",
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 700,
          borderRadius: 0,
        }}
      >
        카카오 로그인
      </button>
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "사용자";

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn-push-sm"
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: "var(--white)",
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--charcoal)",
            color: "var(--yellow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {displayName[0]}
        </span>
        {displayName}
      </button>
      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--white)",
            border: "2px solid #000",
            boxShadow: "var(--shadow-sm)",
            padding: 8,
            zIndex: 100,
            minWidth: 140,
          }}
        >
          <button
            onClick={() => {
              signOut();
              setShowMenu(false);
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              textAlign: "left",
              fontFamily: "inherit",
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
