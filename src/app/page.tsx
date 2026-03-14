"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { UserMenu } from "@/components/UserMenu";
import { RequestModal } from "@/components/RequestModal";
import { Toast } from "@/components/Toast";
import { AlertModal } from "@/components/AlertModal";

const classes = [
  {
    id: 1, emoji: "🗃️", title: "Notion 데이터베이스 완전 정복",
    sub: "필터, 수식, 관계형 DB까지 — 실무 바로 적용",
    instructor: "김민준", date: "4월 12일 토 AM 9–11시",
    status: "confirmed" as const, count: 14, goal: 10, price: 49000,
    tag: "데이터베이스", color: "#e8342e",
  },
  {
    id: 2, emoji: "🤖", title: "Notion AI로 업무 자동화하기",
    sub: "AI 블록과 프롬프트로 반복 업무를 절반으로",
    instructor: "박소연", date: "미정",
    status: "open" as const, count: 23, goal: 15, price: 49000,
    tag: "AI 활용", color: "#3b82f6",
  },
  {
    id: 3, emoji: "🏢", title: "팀을 위한 Notion 위키 만들기",
    sub: "온보딩부터 프로젝트 관리까지 팀 구조 설계",
    instructor: "강사 모집중", date: "미정",
    status: "open" as const, count: 9, goal: 15, price: 49000,
    tag: "팀 협업", color: "#22c55e",
  },
  {
    id: 4, emoji: "🧠", title: "Notion으로 개인 대시보드 구축",
    sub: "할 일, 독서, 루틴, 재정까지 나만의 인생 OS",
    instructor: "강사 모집중", date: "미정",
    status: "open" as const, count: 31, goal: 20, price: 39000,
    tag: "개인 생산성", color: "#a855f7",
  },
];

const requests = [
  { title: "Notion 캘린더 뷰 완전 활용법", votes: 12 },
  { title: "Notion으로 독서 노트 시스템 만들기", votes: 8 },
  { title: "업무 보고서를 Notion으로 자동화", votes: 6 },
];

const brands = ["ACME", "GLOBEX", "INITECH", "UMBRELLA", "CYBERDYNE", "WONKA", "STARK", "WAYNETECH"];
const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function Home() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [subscribedClasses, setSubscribedClasses] = useState<Set<number>>(new Set());
  const [alertClass, setAlertClass] = useState<typeof classes[0] | null>(null);
  const { user, signInWithKakao } = useAuth();
  const hero = classes[0];
  const openClasses = classes.filter((c) => c.status === "open");

  const handleAlert = useCallback(async (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    setSubscribedClasses((prev) => new Set(prev).add(classId));
    if (cls) setAlertClass(cls);

    if (user) {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId: String(classId) }),
        });
      } catch {
        // silent fail for MVP
      }
    }
  }, [user]);

  return (
    <div>

      {/* ━━━ NAV ━━━ */}
      <nav className="fade-up" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 80, background: "var(--yellow)",
        borderBottom: "var(--border)",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, background: "var(--black)", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "var(--yellow)",
            }}>⚡</div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
              Notion<span style={{ color: "var(--charcoal)" }}>Pass</span>
            </span>
          </div>

          {/* Links */}
          <div className="desktop-only" style={{ alignItems: "center", gap: 32 }}>
            {[
              { label: "소개", href: "#hero" },
              { label: "클래스", href: "#classes" },
              { label: "요청", href: "#request" },
            ].map((t) => (
              <a key={t.label} href={t.href} style={{
                fontSize: 15, fontWeight: 600, color: "var(--black)",
                textDecoration: "none", letterSpacing: "-0.2px",
              }}>{t.label}</a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {user ? (
              <UserMenu />
            ) : (
              <button className="btn-push" onClick={signInWithKakao} style={{
                height: 44, padding: "0 24px", borderRadius: 10,
                background: "var(--black)", color: "var(--white)",
                fontSize: 14, fontWeight: 700,
              }}>
                로그인
              </button>
            )}
            <button className="mobile-only" style={{
              width: 44, height: 44, borderRadius: 10, background: "var(--white)",
              border: "var(--border)", fontSize: 20, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>☰</button>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section id="hero" className="dot-pattern" style={{
        background: "var(--yellow)", paddingTop: 140, paddingBottom: 80,
        borderBottom: "var(--border)",
      }}>
        <div className="hero-grid fade-up-1" style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 32px",
        }}>
          {/* Left */}
          <div>
            <div className="btn-push-sm" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--white)", borderRadius: 100,
              padding: "8px 16px 8px 10px", marginBottom: 28,
            }}>
              <span style={{
                background: "var(--black)", color: "var(--yellow)",
                fontSize: 10, fontWeight: 800, padding: "3px 8px",
                borderRadius: 100, letterSpacing: "0.05em",
              }}>NEW</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                4월 첫 번째 클래스 확정
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 900,
              lineHeight: 1.05, letterSpacing: "-0.04em",
              marginBottom: 20,
            }}>
              수요가 모이면,
              <br />
              <span style={{
                WebkitTextStroke: "2px black",
                color: "transparent",
              }}>강의</span>가 열립니다
            </h1>

            <p style={{
              fontSize: "clamp(15px, 1.5vw, 18px)", lineHeight: 1.7,
              color: "var(--charcoal)", opacity: 0.7,
              maxWidth: 440, marginBottom: 36,
            }}>
              원하는 Notion 강의에 알림을 신청하세요.
              충분한 수요가 모이면 클래스가 열립니다.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-push" style={{
                height: 56, padding: "0 32px", borderRadius: 12,
                background: "var(--black)", color: "var(--white)",
                fontSize: 16, fontWeight: 800,
              }}>
                클래스 둘러보기 →
              </button>
              <button className="btn-push-sm" onClick={() => setShowRequestModal(true)} style={{
                height: 56, padding: "0 28px", borderRadius: 12,
                background: "var(--white)", color: "var(--black)",
                fontSize: 16, fontWeight: 700,
              }}>
                주제 제안하기
              </button>
            </div>
          </div>

          {/* Right: Browser mockup */}
          <div className="fade-up-2" style={{
            background: "var(--white)", border: "var(--border)", borderRadius: 16,
            boxShadow: "var(--shadow-lg)", overflow: "hidden",
          }}>
            {/* Title bar */}
            <div style={{
              background: "var(--black)", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            </div>
            {/* Dashboard content */}
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{
                background: "var(--sage)", borderRadius: 10, padding: 20,
                border: "var(--border)", gridColumn: "1 / -1",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
                  이번 달 신청 현황
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em" }}>77명</div>
                <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>전월 대비 +34%</div>
              </div>
              {[
                { label: "활성 클래스", val: "4개", bg: "var(--yellow)" },
                { label: "개설 확정", val: "1개", bg: "var(--charcoal)" },
              ].map((c) => (
                <div key={c.label} style={{
                  background: c.bg, borderRadius: 10, padding: 16,
                  border: "var(--border)",
                  color: c.bg === "var(--charcoal)" ? "var(--white)" : "var(--black)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{c.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ MARQUEE ━━━ */}
      <div style={{
        background: "var(--charcoal)", borderBottom: "var(--border)",
        padding: "16px 0", overflow: "hidden",
      }}>
        <div className="marquee-track">
          {[...brands, ...brands].map((b, i) => (
            <span key={i} style={{
              fontSize: 18, fontWeight: 800, color: "var(--sage)",
              opacity: 0.5, letterSpacing: "0.05em",
              padding: "0 40px", whiteSpace: "nowrap" as const,
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ━━━ FEATURED ━━━ */}
      <section id="classes" style={{
        background: "var(--white)", borderBottom: "var(--border)",
        padding: "64px 0",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="fade-up-3" style={{ marginBottom: 28 }}>
            <span style={{
              display: "inline-block", background: "var(--yellow)",
              border: "var(--border)", borderRadius: 8, padding: "6px 14px",
              fontSize: 12, fontWeight: 800, letterSpacing: "0.05em",
              textTransform: "uppercase" as const, marginBottom: 12,
            }}>개설 확정</span>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em" }}>
              {hero.title}
            </h2>
          </div>

          <div className="card-brutal-lg fade-up-3" style={{
            background: "var(--yellow)", borderRadius: 16,
            display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden",
          }}>
            {/* Left */}
            <div className="dot-pattern" style={{ padding: 48, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: 80, marginBottom: 20 }}>{hero.emoji}</div>
              <div>
                <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20, opacity: 0.7 }}>
                  {hero.sub}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "var(--black)", border: "var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, color: "var(--yellow)",
                  }}>👤</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{hero.instructor}</div>
                    <div style={{ fontSize: 12, opacity: 0.5 }}>Notion 한국 커뮤니티 운영</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div style={{ background: "var(--white)", padding: 48, borderLeft: "var(--border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "일정", val: "4월 12일 토", sub: "AM 9:00–11:00" },
                  { label: "수강료", val: `${fmt(hero.price)}원`, sub: "부가세 포함" },
                  { label: "신청 현황", val: `${hero.count}명 완료`, sub: `목표 ${hero.goal}명 달성` },
                  { label: "진행 방식", val: "Zoom Live", sub: "온라인 라이브" },
                ].map((m) => (
                  <div key={m.label} style={{
                    background: "var(--gray-light)", border: "var(--border)",
                    borderRadius: 10, padding: 16,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", opacity: 0.5, marginBottom: 8 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>{m.val}</div>
                    <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              <button className="btn-push" style={{
                width: "100%", height: 56, borderRadius: 12,
                background: "var(--black)", color: "var(--white)",
                fontSize: 16, fontWeight: 800,
              }}>
                결제하기 →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ OPEN CLASSES ━━━ */}
      <section className="dot-pattern" style={{
        background: "var(--yellow)", borderBottom: "var(--border)",
        padding: "64px 0",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div className="fade-up-4" style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <span style={{
                display: "inline-block", background: "var(--charcoal)", color: "var(--yellow)",
                border: "var(--border)", borderRadius: 8, padding: "6px 14px",
                fontSize: 12, fontWeight: 800, letterSpacing: "0.05em",
                textTransform: "uppercase" as const, marginBottom: 12,
              }}>{openClasses.length} Classes</span>
              <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em" }}>
                알림 신청 중
              </h2>
            </div>
            <span style={{ fontSize: 14, opacity: 0.5 }}>수요가 모이면 개설됩니다</span>
          </div>

          <div className="feature-grid fade-up-5">
            {openClasses.map((cls) => {
              const isH = hovered === cls.id;
              const pct = Math.min(100, Math.round((cls.count / cls.goal) * 100));
              return (
                <div
                  key={cls.id}
                  className="card-brutal"
                  onMouseEnter={() => setHovered(cls.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: "var(--white)", borderRadius: 12,
                    overflow: "hidden", cursor: "pointer",
                  }}
                >
                  <div style={{
                    height: 140, background: isH ? "var(--yellow)" : "var(--gray-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 56, borderBottom: "var(--border)",
                    transition: "background 0.2s ease",
                  }}>
                    {cls.emoji}
                  </div>
                  <div style={{ padding: "20px 22px 24px" }}>
                    <span style={{
                      display: "inline-block", fontSize: 10, fontWeight: 800,
                      letterSpacing: "0.06em", textTransform: "uppercase" as const,
                      background: `${cls.color}18`, color: cls.color,
                      padding: "3px 8px", borderRadius: 6, marginBottom: 10,
                      border: `1.5px solid ${cls.color}30`,
                    }}>{cls.tag}</span>

                    <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6, lineHeight: 1.3 }}>
                      {cls.title}
                    </h3>
                    <p style={{ fontSize: 13, opacity: 0.5, lineHeight: 1.5, marginBottom: 16 }}>
                      {cls.sub}
                    </p>

                    {/* Progress */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{cls.count}명 신청</span>
                        <span style={{ fontSize: 12, opacity: 0.4 }}>목표 {cls.goal}명</span>
                      </div>
                      <div style={{ height: 8, background: "var(--gray-light)", borderRadius: 4, border: "1.5px solid #000", overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`, height: "100%",
                          background: pct >= 100 ? "var(--black)" : cls.color,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em" }}>
                        {fmt(cls.price)}원
                      </span>
                      <button
                        className="btn-push-sm"
                        onClick={(e) => { e.stopPropagation(); handleAlert(cls.id); }}
                        style={{
                          height: 36, padding: "0 14px", borderRadius: 8,
                          background: subscribedClasses.has(cls.id)
                            ? "var(--charcoal)"
                            : isH ? "var(--black)" : "var(--yellow)",
                          color: subscribedClasses.has(cls.id)
                            ? "var(--yellow)"
                            : isH ? "var(--yellow)" : "var(--black)",
                          fontSize: 13, fontWeight: 700,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {subscribedClasses.has(cls.id) ? "✅ 완료" : "🔔 알림"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section style={{
        background: "var(--charcoal)", borderBottom: "var(--border)",
        padding: "72px 0",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "var(--white)", letterSpacing: "-0.03em", marginBottom: 48, textAlign: "center" as const }}>
            어떻게 진행되나요?
          </h2>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32,
            position: "relative",
          }}>
            {[
              { step: "01", title: "알림 신청", desc: "듣고 싶은 강의에 알림을 신청하세요", color: "var(--sage)", emoji: "🔔" },
              { step: "02", title: "수요 달성", desc: "충분한 수요가 모이면 개설이 확정됩니다", color: "var(--yellow)", emoji: "🎯" },
              { step: "03", title: "클래스 참여", desc: "결제 후 Zoom 링크를 이메일로 받으세요", color: "var(--white)", emoji: "🎓" },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: "center" as const }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: `4px solid ${s.color}`, background: "var(--gray-dark)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, margin: "0 auto 20px",
                  boxShadow: `0 0 20px ${s.color}40`,
                }}>
                  {s.emoji}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: s.color, letterSpacing: "0.1em", marginBottom: 8 }}>
                  STEP {s.step}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--white)", marginBottom: 8, letterSpacing: "-0.02em" }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 14, color: "var(--sage)", opacity: 0.7, lineHeight: 1.6 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ REQUEST ━━━ */}
      <section id="request" style={{
        background: "var(--white)", borderBottom: "var(--border)",
        padding: "64px 0",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div>
              <span style={{
                display: "inline-block", background: "var(--yellow)",
                border: "var(--border)", borderRadius: 8, padding: "6px 14px",
                fontSize: 12, fontWeight: 800, letterSpacing: "0.05em",
                textTransform: "uppercase" as const, marginBottom: 16,
              }}>Request</span>
              <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.15 }}>
                듣고 싶은 강의를
                <br />직접 제안하세요
              </h2>
              <p style={{ fontSize: 15, opacity: 0.5, lineHeight: 1.7, marginBottom: 28, maxWidth: 400 }}>
                원하는 Notion 강의 주제를 제안하고 공감 투표를 받으면, 운영팀이 강사를 섭외하여 클래스를 만듭니다.
              </p>
              <button className="btn-push" onClick={() => setShowRequestModal(true)} style={{
                height: 52, padding: "0 28px", borderRadius: 12,
                background: "var(--black)", color: "var(--white)",
                fontSize: 15, fontWeight: 800,
              }}>
                + 주제 제안하기
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", opacity: 0.4, marginBottom: 4 }}>
                현재 제안된 주제
              </div>
              {requests.map((r, i) => (
                <div key={r.title} className="card-brutal" style={{
                  background: "var(--white)", borderRadius: 10, padding: "16px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, opacity: 0.15, width: 28 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</span>
                  </div>
                  <button className="btn-push-sm" style={{
                    height: 34, padding: "0 14px", borderRadius: 8,
                    background: "var(--yellow)", fontSize: 13, fontWeight: 800,
                  }}>
                    ▲ {r.votes}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="dot-pattern" style={{
        background: "var(--yellow)", borderBottom: "var(--border)",
        padding: "80px 0", textAlign: "center" as const,
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.15 }}>
            Notion을
            <br />제대로 배웁니다
          </h2>
          <p style={{ fontSize: 16, opacity: 0.6, marginBottom: 32 }}>
            수요 기반으로 열리는 원데이클래스에 참여하세요
          </p>
          <button className="btn-push" style={{
            height: 60, padding: "0 40px", borderRadius: 12,
            background: "var(--black)", color: "var(--white)",
            fontSize: 18, fontWeight: 800,
          }}>
            지금 시작하기 ⚡
          </button>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer style={{
        background: "var(--charcoal)", padding: "56px 0 40px",
      }}>
        <div className="footer-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, background: "var(--yellow)", borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, border: "var(--border)",
              }}>⚡</div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--white)" }}>NotionPass</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--sage)", opacity: 0.5, lineHeight: 1.7 }}>
              수요가 모이면 강의가 열립니다.
              <br />수요가 모이면 강의가 열립니다.
            </p>
          </div>
          {[
            { title: "서비스", links: ["클래스", "요청", "FAQ"] },
            { title: "회사", links: ["소개", "블로그", "채용"] },
            { title: "법적", links: ["이용약관", "개인정보처리방침"] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--sage)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 16 }}>
                {col.title}
              </div>
              {col.links.map((l) => (
                <a key={l} href="#" style={{
                  display: "block", fontSize: 14, color: "var(--sage)", opacity: 0.5,
                  textDecoration: "none", marginBottom: 10,
                }}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          maxWidth: 1200, margin: "32px auto 0", padding: "20px 32px 0",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 12, color: "var(--sage)", opacity: 0.3,
        }}>
          © 2026 NotionPass. All rights reserved.
        </div>
      </footer>

      <RequestModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} />
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      {alertClass && (
        <AlertModal
          isOpen={!!alertClass}
          onClose={() => setAlertClass(null)}
          classTitle={alertClass.title}
          count={alertClass.count}
          goal={alertClass.goal}
        />
      )}
    </div>
  );
}
