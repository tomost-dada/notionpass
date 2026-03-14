"use client";
import { useState } from "react";

/* ─── Data ─── */
const classes = [
  {
    id: 1,
    emoji: "🗃️",
    title: "Notion 데이터베이스\n완전 정복",
    subtitle: "필터, 수식, 관계형 DB까지 — 실무 바로 적용",
    instructor: "김민준",
    instructorRole: "Notion 한국 커뮤니티 운영",
    date: "4월 12일 토",
    time: "AM 9:00–11:00",
    status: "confirmed" as const,
    count: 14,
    goal: 10,
    price: 49000,
    tag: "데이터베이스",
    color: "#e8342e",
  },
  {
    id: 2,
    emoji: "🤖",
    title: "Notion AI로\n업무 자동화하기",
    subtitle: "AI 블록과 프롬프트로 반복 업무를 절반으로",
    instructor: "박소연",
    instructorRole: "프로덕트 매니저",
    date: "미정",
    time: "AM 9:00–11:00",
    status: "open" as const,
    count: 23,
    goal: 15,
    price: 49000,
    tag: "AI 활용",
    color: "#3b82f6",
  },
  {
    id: 3,
    emoji: "🏢",
    title: "팀을 위한\nNotion 위키 만들기",
    subtitle: "온보딩부터 프로젝트 관리까지 팀 구조 설계",
    instructor: "강사 모집중",
    instructorRole: "",
    date: "미정",
    time: "AM 9:00–11:00",
    status: "open" as const,
    count: 9,
    goal: 15,
    price: 49000,
    tag: "팀 협업",
    color: "#22c55e",
  },
  {
    id: 4,
    emoji: "🧠",
    title: "Notion으로\n개인 대시보드 구축",
    subtitle: "할 일, 독서, 루틴, 재정까지 나만의 인생 OS",
    instructor: "강사 모집중",
    instructorRole: "",
    date: "미정",
    time: "AM 9:00–11:00",
    status: "open" as const,
    count: 31,
    goal: 20,
    price: 39000,
    tag: "개인 생산성",
    color: "#a855f7",
  },
];

const requests = [
  { title: "Notion 캘린더 뷰 완전 활용법", votes: 12 },
  { title: "Notion으로 독서 노트 시스템 만들기", votes: 8 },
  { title: "업무 보고서를 Notion으로 자동화", votes: 6 },
];

/* ─── Helpers ─── */
const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function Home() {
  const [hovered, setHovered] = useState<number | null>(null);
  const hero = classes[0];
  const openClasses = classes.filter((c) => c.status === "open");

  return (
    <div className="grain" style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* ━━━ NAV ━━━ */}
      <nav className="fade-up" style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(247,244,239,0.85)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        borderBottom: "1px solid var(--border-light)",
      }}>
        <div style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "var(--charcoal)",
            }}>
              class<span style={{ color: "var(--red)" }}>kickstarter</span>
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--text-tertiary)",
              marginLeft: 4,
            }}>
              SAT 9AM
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span className="desktop-only" style={{ alignItems: "center", gap: 24 }}>
              <NavLink active>클래스</NavLink>
              <NavLink>요청</NavLink>
              <NavLink>소개</NavLink>
            </span>
            <button style={{
              height: 36,
              padding: "0 18px",
              borderRadius: 8,
              background: "var(--charcoal)",
              color: "white",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              cursor: "pointer",
              letterSpacing: "-0.2px",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--charcoal-light)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--charcoal)")}
            >
              로그인
            </button>
            {/* Mobile hamburger */}
            <button className="mobile-only" style={{
              width: 36, height: 36, borderRadius: 8,
              background: "transparent", border: "1px solid var(--border-light)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontFamily: "inherit",
            }}>
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section style={{
        background: "var(--charcoal)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Gradient orbs */}
        <div style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "50%",
          height: "140%",
          background: "radial-gradient(ellipse at center, rgba(232,52,46,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-30%",
          left: "-5%",
          width: "40%",
          height: "100%",
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "80px 24px 72px",
          position: "relative",
        }}>
          {/* Eyebrow */}
          <div className="fade-up" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 100,
            padding: "6px 14px 6px 8px",
            marginBottom: 28,
          }}>
            <span style={{
              background: "var(--red)",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 100,
              letterSpacing: "0.04em",
            }}>
              NEW
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
              4월 첫 번째 클래스가 확정되었습니다
            </span>
          </div>

          {/* Main headline */}
          <h1 className="fade-up-1" style={{
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            fontSize: "clamp(36px, 5.5vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "white",
            maxWidth: 680,
            marginBottom: 20,
          }}>
            수요가 모이면,
            <br />
            <span style={{ color: "var(--red)" }}>강의</span>가 열립니다
          </h1>

          <p className="fade-up-2" style={{
            fontSize: "clamp(15px, 1.5vw, 18px)",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.45)",
            maxWidth: 440,
            marginBottom: 40,
            fontWeight: 400,
          }}>
            원하는 Notion 강의에 알림을 신청하세요.
            <br />
            충분한 수요가 모이면, 매주 토요일 아침 9시에 클래스가 열립니다.
          </p>

          {/* Stats row */}
          <div className="fade-up-3" style={{
            display: "flex",
            gap: 48,
          }}>
            {[
              { n: "4", label: "준비 중인 클래스" },
              { n: "77", label: "알림 신청" },
              { n: "SAT", label: "매주 토요일 9AM" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{
                  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "-0.02em",
                }}>
                  {s.n}
                </div>
                <div style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 500,
                  marginTop: 2,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED CLASS ━━━ */}
      <section style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "56px 24px 0",
      }}>
        <SectionHeader
          tag="FEATURED"
          title="개설 확정"
          description="수요가 충분히 모여 확정된 클래스입니다"
          className="fade-up-3"
        />

        <div className="fade-up-4 featured-grid" style={{
          marginTop: 28,
          background: "white",
          borderRadius: 20,
          border: "1px solid var(--border-light)",
          boxShadow: "var(--card-shadow)",
          overflow: "hidden",
        }}>
          {/* Left: visual */}
          <div style={{
            background: "var(--charcoal)",
            padding: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 140,
              opacity: 0.08,
              filter: "blur(1px)",
              pointerEvents: "none",
            }}>
              {hero.emoji}
            </div>
            <div>
              <span style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "var(--red)",
                background: "rgba(232,52,46,0.12)",
                padding: "5px 10px",
                borderRadius: 6,
                marginBottom: 20,
              }}>
                {hero.tag}
              </span>
              <div style={{
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: "white",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                whiteSpace: "pre-line",
              }}>
                {hero.title}
              </div>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 32,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}>
                👤
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{hero.instructor}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{hero.instructorRole}</div>
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div style={{ padding: "clamp(24px, 4vw, 44px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <p style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                marginBottom: 32,
              }}>
                {hero.subtitle}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "일정", value: hero.date, sub: hero.time },
                  { label: "수강료", value: `${fmt(hero.price)}원`, sub: "부가세 포함" },
                  { label: "신청 현황", value: `${hero.count}명`, sub: "목표 달성" },
                  { label: "진행 방식", value: "Zoom", sub: "온라인 라이브" },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: "16px",
                    background: "var(--cream)",
                    borderRadius: 12,
                  }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                      color: "var(--text-tertiary)",
                      marginBottom: 8,
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--charcoal)",
                      letterSpacing: "-0.02em",
                    }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button style={{
                flex: 1,
                height: 52,
                borderRadius: 12,
                background: "var(--red)",
                border: "none",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                cursor: "pointer",
                letterSpacing: "-0.2px",
                boxShadow: "0 4px 20px rgba(232,52,46,0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--red-dark)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "var(--red)";
                e.currentTarget.style.transform = "";
              }}
              >
                결제하기 →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ OPEN CLASSES ━━━ */}
      <section style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "64px 24px 0",
      }}>
        <SectionHeader
          tag={`${openClasses.length} CLASSES`}
          title="알림 신청 중"
          description="수요가 모이면 개설됩니다. 알림을 신청해주세요."
          className="fade-up-4"
        />

        <div className="fade-up-5 class-grid" style={{
          marginTop: 28,
        }}>
          {openClasses.map((cls) => {
            const isHovered = hovered === cls.id;
            const pct = Math.min(100, Math.round((cls.count / cls.goal) * 100));
            return (
              <div
                key={cls.id}
                onMouseEnter={() => setHovered(cls.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid var(--border-light)",
                  boxShadow: isHovered ? "var(--card-shadow-hover)" : "var(--card-shadow)",
                  transform: isHovered ? "translateY(-4px)" : "",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {/* Card top */}
                <div style={{
                  height: 160,
                  background: `linear-gradient(135deg, ${cls.color}12 0%, ${cls.color}06 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 56,
                  position: "relative",
                }}>
                  <span style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    color: cls.color,
                    background: `${cls.color}12`,
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}>
                    {cls.tag}
                  </span>
                  {cls.emoji}
                </div>

                {/* Card body */}
                <div style={{ padding: "20px 22px 24px" }}>
                  <h3 style={{
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                    fontSize: 17,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    letterSpacing: "-0.02em",
                    color: "var(--charcoal)",
                    marginBottom: 6,
                    whiteSpace: "pre-line",
                  }}>
                    {cls.title}
                  </h3>
                  <p style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: 20,
                  }}>
                    {cls.subtitle}
                  </p>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                        {cls.count}명 신청
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)" }}>
                        목표 {cls.goal}명
                      </span>
                    </div>
                    <div style={{
                      height: 4,
                      background: "var(--cream)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: pct >= 100
                          ? "var(--red)"
                          : `linear-gradient(90deg, ${cls.color}, ${cls.color}aa)`,
                        borderRadius: 2,
                        transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                      }} />
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <span style={{
                      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--charcoal)",
                      letterSpacing: "-0.02em",
                    }}>
                      {fmt(cls.price)}원
                    </span>
                    <button style={{
                      height: 36,
                      padding: "0 16px",
                      borderRadius: 8,
                      background: isHovered ? "var(--charcoal)" : "var(--cream)",
                      color: isHovered ? "white" : "var(--charcoal)",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}>
                      🔔 알림 신청
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ━━━ REQUEST ━━━ */}
      <section style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "72px 24px 0",
      }}>
        <div className="request-grid" style={{
          background: "var(--charcoal)",
          borderRadius: 24,
          padding: "clamp(28px, 5vw, 56px)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "100%",
            background: "radial-gradient(ellipse at top right, rgba(232,52,46,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: "var(--red)",
              marginBottom: 16,
              display: "block",
            }}>
              REQUEST A CLASS
            </span>
            <h2 style={{
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800,
              color: "white",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              marginBottom: 16,
            }}>
              듣고 싶은 강의를
              <br />
              직접 제안하세요
            </h2>
            <p style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.7,
              marginBottom: 28,
              maxWidth: 360,
            }}>
              원하는 Notion 강의 주제를 제안하고 공감 투표를 받으면, 운영팀이 강사를 섭외하여 클래스를 만듭니다.
            </p>
            <button style={{
              height: 48,
              padding: "0 28px",
              borderRadius: 10,
              background: "var(--red)",
              border: "none",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(232,52,46,0.35)",
              transition: "all 0.2s ease",
              letterSpacing: "-0.2px",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--red-dark)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.transform = ""; }}
            >
              + 주제 제안하기
            </button>
          </div>

          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.3)",
              marginBottom: 4,
            }}>
              현재 제안된 주제
            </div>
            {requests.map((req, i) => (
              <div key={req.title} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.2)",
                    width: 24,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>
                    {req.title}
                  </span>
                </div>
                <button style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--red)";
                  e.currentTarget.style.borderColor = "var(--red)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }}
                >
                  ▲ {req.votes}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="footer-inner" style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "56px 24px 40px",
      }}>
        <div style={{
          fontSize: 13,
          color: "var(--text-tertiary)",
          fontWeight: 400,
        }}>
          © 2026 classkickstarter — 매주 토요일 아침, 노션을 배웁니다
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["이용약관", "개인정보처리방침"].map((t) => (
            <a key={t} href="#" style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--charcoal)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              {t}
            </a>
          ))}
        </div>
      </footer>

    </div>
  );
}

/* ─── Sub-components ─── */

function NavLink({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <a href="#" style={{
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? "var(--charcoal)" : "var(--text-tertiary)",
      textDecoration: "none",
      letterSpacing: "-0.2px",
      transition: "color 0.15s ease",
      position: "relative",
    }}>
      {children}
      {active && (
        <span style={{
          position: "absolute",
          bottom: -2,
          left: 0,
          right: 0,
          height: 1.5,
          background: "var(--charcoal)",
          borderRadius: 1,
        }} />
      )}
    </a>
  );
}

function SectionHeader({ tag, title, description, className }: {
  tag: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`${className || ""} section-header`}>
      <div>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "var(--red)",
          marginBottom: 8,
          display: "block",
        }}>
          {tag}
        </span>
        <h2 style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--charcoal)",
          lineHeight: 1.1,
        }}>
          {title}
        </h2>
      </div>
      <span style={{
        fontSize: 14,
        color: "var(--text-tertiary)",
        fontWeight: 400,
      }}>
        {description}
      </span>
    </div>
  );
}
