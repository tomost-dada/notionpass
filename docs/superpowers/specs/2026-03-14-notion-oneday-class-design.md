# Notion 원데이클래스 플랫폼 — 설계 문서

**작성일:** 2026-03-14
**상태:** v3 (spec review 2차 반영)

---

## 1. 개요

Notion 활용법을 주제로 하는 수요 기반 원데이클래스 플랫폼.
수강생이 원하는 강의에 알림 신청을 하거나 직접 강의 주제를 요청하면, 운영자가 수요를 판단해 강의를 개설하는 웹 서비스.

---

## 2. 핵심 플로우

### 강사 제안 → 개설
1. 운영자가 강의 등록 (`draft` 상태)
2. 강의를 `open_for_request`로 공개
3. 수강생이 알림 신청 (`notification_requests` 생성)
4. 운영자가 신청자 수 보고 개설 결정 → `/admin/classes`에서 Zoom 링크 먼저 입력 (필수) → `confirmed`로 상태 변경
5. 상태 변경 시 시스템이 `notification_requests` 행마다 `enrollments` 행을 **upsert**로 생성 (중복 시 no-op), `payment_link_sent_at` 기록
6. 운영자가 `/admin/enrollments`에서 각 수강생에게 결제 링크를 이메일로 발송
7. 운영자가 결제 확인 후 어드민 UI에서 수동으로 `paid_at` 기록 + `payment_status = paid`로 변경
8. 시스템이 자동으로 해당 수강생에게 **Zoom 링크가 포함된 이메일 발송** (zoom_link는 이메일로만 전달, API에서 직접 노출 안 함)

### 수강생 요청 → 개설
1. 수강생이 원하는 강의 주제 요청 등록 (`class_requests`)
2. 다른 수강생이 "+1 (나도 듣고 싶다)" 투표 (`request_votes`) — MVP 포함
3. 운영자가 투표 수 확인 후 강사 섭외
4. `/admin/requests`에서 "강의로 전환" → `classes` draft 생성 + `class_requests.converted_class_id` 업데이트
5. 이후 위 플로우 진행

---

## 3. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js (App Router) |
| 배포 | Vercel |
| 백엔드/DB | Supabase (PostgreSQL + RLS) |
| 인증 | Supabase Auth (Google, 카카오 OAuth) |
| 이메일 | Next.js API Route + Resend (MVP) |
| 결제 (향후) | Toss Payments |

---

## 4. DB 스키마

### users
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| email | text | NOT NULL, UNIQUE | |
| name | text | | |
| avatar_url | text | | |
| provider | text | | google \| kakao (MVP: 단일 provider, 병합 미지원) |
| role | text | DEFAULT 'user' | user \| admin |
| created_at | timestamptz | | |

> **소셜 로그인 중복 처리:** 동일 이메일로 다른 provider 가입 시 "이미 가입된 이메일입니다. [기존 provider]로 로그인해 주세요" 안내. 병합 기능은 MVP 제외.

### classes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| title | text | 강의 제목 |
| description | text | 강의 소개 |
| instructor_name | text | 강사명 (MVP: 의도적 비정규화, 운영자 직접 입력) |
| thumbnail_url | text | |
| status | text | draft \| open_for_request \| confirmed \| cancelled \| completed |
| scheduled_at | timestamptz | 개설 확정 후 일정 (nullable) |
| price | integer | 결제 금액 원 단위 (nullable) |
| zoom_link | text | (nullable) — **RLS로 일반 사용자 직접 조회 차단, 이메일로만 전달** |
| created_at | timestamptz | |

> `zoom_link`는 `confirmed` 전환 전 반드시 입력 필수 (어드민 UI에서 zoom_link 없으면 confirmed 버튼 비활성화).
> `cancelled` 상태 전환 시: 연관 `enrollments.payment_status` 일괄 `cancelled` 업데이트.

### notification_requests (알림 신청)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| user_id | uuid | → users ON DELETE CASCADE | |
| class_id | uuid | → classes ON DELETE CASCADE | |
| created_at | timestamptz | | |

> UNIQUE (user_id, class_id)

### class_requests (수강생 강의 요청)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | → users ON DELETE SET NULL (탈퇴 회원 요청은 어드민에서 "(탈퇴 회원)"으로 표시, 정상 처리 유지) |
| title | text | 요청 강의 제목 |
| description | text | |
| status | text | pending \| converted \| rejected |
| converted_class_id | uuid | → classes (nullable, 전환된 강의 추적) |
| created_at | timestamptz | |

### request_votes (+1 투표) — MVP 포함
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| user_id | uuid | → users ON DELETE CASCADE | |
| class_request_id | uuid | → class_requests ON DELETE CASCADE | |
| created_at | timestamptz | | |

> UNIQUE (user_id, class_request_id)

### enrollments (수강 확정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | → users ON DELETE SET NULL |
| class_id | uuid | → classes ON DELETE CASCADE |
| payment_status | text | pending \| paid \| cancelled |
| payment_link | text | 운영자가 입력한 결제 링크 URL (nullable) |
| payment_link_sent_at | timestamptz | nullable |
| paid_at | timestamptz | nullable — 운영자 수동 기록 |
| zoom_link_sent_at | timestamptz | nullable |
| created_at | timestamptz | |

> UNIQUE (user_id, class_id)
> `confirmed` 전환 시 enrollment upsert: 이미 존재하면 no-op, 없으면 insert (payment_status = 'pending')

---

## 5. 주요 화면

### 일반 사용자

| 경로 | 설명 |
|------|------|
| `/` | 강의 목록 (카드형, 상태 뱃지, 알림 신청자 수) |
| `/class/:id` | 강의 상세, 알림 신청 버튼, 신청자 수 실시간 표시 |
| `/request` | 수강생 강의 요청 목록 + 투표 + 새 요청 폼 |
| `/my` | 내 알림 신청 목록, 수강 확정 강의 (Zoom 링크는 이메일로만 전달) |

### 운영자

| 경로 | 설명 |
|------|------|
| `/admin/classes` | 강의 관리, Zoom 링크 입력, 상태 변경 (Zoom 링크 필수 입력 후 confirmed 가능) |
| `/admin/requests` | 수강생 요청 목록, 투표 수 확인, 강의로 전환 |
| `/admin/enrollments` | 결제 링크 입력/발송, 결제 완료 수동 확인, Zoom 링크 이메일 발송 트리거 |

---

## 6. 주요 비즈니스 규칙

- 알림 신청은 소셜 로그인(Google/카카오) 필수
- 강의 개설 기준(임계치)은 운영자가 수동으로 판단
- `confirmed` 전환 전 `zoom_link` 입력 필수 (어드민 UI 강제)
- `confirmed` 전환 시 시스템이 알림 신청자 전원의 `enrollments` 행을 upsert로 생성 (멱등성 보장)
- 결제 링크 형식: 운영자가 Toss Payments 1회용 링크 또는 계좌이체 URL을 어드민 UI에 입력 후 이메일 발송
- 결제 완료 확인: 운영자가 어드민 UI에서 수동으로 `paid_at` 기록 + `payment_status = paid` 변경
- `paid_at` 기록 시 시스템이 `classes.zoom_link`를 포함한 이메일 자동 발송 (API/화면에서는 zoom_link 노출 안 함)
- Zoom 링크는 RLS 정책으로 `classes` 테이블에서 일반 사용자 직접 조회 차단, 이메일로만 전달
- 미결제 enrollment 만료 정책: MVP는 별도 만료 없음 (운영자 수동 처리)
- 클래스 취소 시: status → `cancelled`, 연관 enrollments → `payment_status = cancelled` 일괄 변경

---

## 7. 어드민 인증/권한

- `users.role = 'admin'`인 사용자만 `/admin/*` 접근 가능
- Next.js middleware에서 Supabase session의 role 확인 후 비인가 접근 시 `/`으로 리다이렉트
- 초기 어드민 계정: 배포 후 Supabase 대시보드에서 특정 user의 role을 수동으로 `admin`으로 변경

---

## 8. MVP 범위

**포함:**
- 강의 목록/상세/알림 신청
- 수강생 강의 요청 + 투표
- 소셜 로그인 (Google, 카카오)
- 어드민: 강의 관리, 요청 관리, 수강 관리 (결제 확인, Zoom 링크 이메일 발송)
- 이메일 발송 (Next.js API Route + Resend)

**MVP 제외 (향후):**
- 결제 자동화 (Toss Payments 연동)
- 강사 셀프 신청/심사
- 수강 후기/평점
- 강의 녹화 영상
- 미결제 자동 만료/리마인더
- 소셜 로그인 provider 병합

---

## 9. 향후 확장

- Toss Payments 연동으로 결제 자동화
- 강사 셀프 신청 및 심사 프로세스
- 수강 후기 및 강사 평점 시스템
- 강의 카테고리/태그 필터
- 미결제 enrollment 자동 만료 및 리마인더 이메일
- 소셜 로그인 계정 병합
