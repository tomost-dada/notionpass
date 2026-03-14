# 클래스킥스타터 — 노션 원데이클래스 플랫폼

수강생이 원하는 강의에 알림 신청을 하면, 수요가 모일 때 운영자가 강의를 개설하는 수요 기반 원데이클래스 플랫폼.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 15 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS v4 |
| 백엔드/DB | Supabase (PostgreSQL + RLS) |
| 인증 | Supabase Auth (Google, 카카오 OAuth) |
| 이메일 | Next.js API Route + Resend |
| 배포 | Vercel |

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 스펙 및 계획 문서

- **스펙:** `docs/superpowers/specs/2026-03-14-notion-oneday-class-design.md`
- **구현 계획:** `docs/superpowers/plans/2026-03-14-notion-oneday-class.md`

## 주요 비즈니스 규칙

- `zoom_link`는 RLS로 일반 사용자 직접 조회 차단 → 결제 완료 이메일로만 전달
- `confirmed` 전환 전 `zoom_link` 입력 필수 (어드민 UI 강제)
- `confirmed` 전환 시 enrollment upsert (ON CONFLICT DO NOTHING) — 멱등성 보장
- 클래스 취소 시 연관 enrollments 일괄 `cancelled` 처리
- 소셜 로그인 provider 병합 MVP 제외 — 동일 이메일 재가입 시 기존 provider로 유도

## DB 핵심 패턴

- 일반 사용자 쿼리: `classes_public` 뷰 사용 (zoom_link 제외된 security_barrier 뷰)
- 어드민 쿼리: `createAdminClient()` — `@supabase/supabase-js` 직접 사용 (service role key)
- 일반 쿼리: `createClient()` / `createServerClient()` — `@supabase/ssr` 사용

## 어드민 인증

- `users.role = 'admin'`인 사용자만 `/admin/*` 접근 가능
- 모든 `/api/admin/*` 라우트에 `requireAdmin()` 가드 필수
- 초기 어드민: Supabase 대시보드에서 수동으로 `role = 'admin'` 설정

## 디자인

- **폰트:** Playfair Display (에디토리얼 세리프) + DM Sans (바디)
- **컬러:** 크림 `#FAF6EF` / 잉크 `#16120E` / 앰버 `#C8541A` / 포레스트 `#2A4233`
- **톤:** 에디토리얼 매거진 + 토요일 아침 에너지
