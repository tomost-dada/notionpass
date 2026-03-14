# Notion 원데이클래스 플랫폼 — 설계 문서

**작성일:** 2026-03-14
**상태:** Draft

---

## 1. 개요

Notion 활용법을 주제로 하는 수요 기반 원데이클래스 플랫폼.
수강생이 원하는 강의에 알림 신청을 하거나 직접 강의 주제를 요청하면, 운영자가 수요를 판단해 강의를 개설하는 웹 서비스.

---

## 2. 핵심 플로우

### 강사 제안 → 개설
1. 운영자가 강의 등록 (draft 상태)
2. 강의를 `open_for_request`로 공개
3. 수강생이 알림 신청
4. 운영자가 신청자 수 보고 개설 결정 → `confirmed`
5. 날짜/가격 설정 후 신청자 전원에게 결제 링크 이메일 자동 발송
6. 결제 완료 확인 후 Zoom 링크 이메일 발송

### 수강생 요청 → 개설
1. 수강생이 원하는 강의 주제 요청 등록
2. 다른 수강생이 "+1 (나도 듣고 싶다)" 투표
3. 운영자가 관심도 확인 후 강사 섭외
4. 강의로 전환 후 위 플로우 진행

---

## 3. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js (App Router) |
| 배포 | Vercel |
| 백엔드/DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (Google, 카카오 OAuth) |
| 이메일 | Supabase Edge Functions + Resend |
| 결제 (향후) | Toss Payments |

---

## 4. DB 스키마

### users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| email | text | |
| name | text | |
| avatar_url | text | |
| provider | text | google \| kakao |
| role | text | user \| admin |
| created_at | timestamptz | |

### classes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| title | text | 강의 제목 |
| description | text | 강의 소개 |
| instructor_name | text | 강사명 |
| thumbnail_url | text | |
| status | text | draft \| open_for_request \| confirmed \| completed |
| scheduled_at | timestamptz | 개설 확정 후 일정 (nullable) |
| price | integer | 결제 금액 원 단위 (nullable) |
| zoom_link | text | 결제 완료자에게만 공개 (nullable) |
| created_at | timestamptz | |

### notification_requests (알림 신청)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | → users |
| class_id | uuid | → classes |
| created_at | timestamptz | |

### class_requests (수강생 강의 요청)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | → users |
| title | text | 요청 강의 제목 |
| description | text | |
| status | text | pending \| converted \| rejected |
| created_at | timestamptz | |

### request_votes (+1 투표)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | → users |
| class_request_id | uuid | → class_requests |
| created_at | timestamptz | |

### enrollments (수강 확정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | → users |
| class_id | uuid | → classes |
| payment_link_sent_at | timestamptz | |
| paid_at | timestamptz | nullable |
| zoom_link_sent_at | timestamptz | nullable |

---

## 5. 주요 화면

### 일반 사용자

| 경로 | 설명 |
|------|------|
| `/` | 강의 목록 (카드형, 상태 뱃지, 알림 신청자 수) |
| `/class/:id` | 강의 상세, 알림 신청 버튼, 신청자 수 실시간 표시 |
| `/request` | 수강생 강의 요청 목록 + 투표 + 새 요청 폼 |
| `/my` | 내 알림 신청 목록, 수강 확정 강의 + Zoom 링크 |

### 운영자

| 경로 | 설명 |
|------|------|
| `/admin/classes` | 강의 관리, 상태 변경, 개설확정 시 이메일 일괄 발송 |
| `/admin/requests` | 수강생 요청 목록, 투표 수 확인, 강의로 전환 |
| `/admin/enrollments` | 결제 완료 확인, Zoom 링크 발송 |

---

## 6. 주요 비즈니스 규칙

- 알림 신청은 로그인(소셜 로그인) 필수
- 강의 개설 기준(임계치)은 운영자가 수동으로 판단
- 개설 확정 시 Supabase Edge Function이 알림 신청자 전원에게 결제 링크 이메일 자동 발송
- Zoom 링크는 `paid_at`이 채워진 사용자에게만 노출
- 수강생은 동일 강의에 중복 알림 신청 불가
- 수강생은 동일 요청에 중복 투표 불가

---

## 7. MVP 범위 (Out of Scope)

- 결제 모듈 (Toss Payments) — MVP 이후 연동
- 강사 신청/심사 기능 — MVP는 운영자 직접 섭외
- 수강 후기/평점 기능
- 강의 녹화 영상 제공

---

## 8. 향후 확장

- Toss Payments 연동으로 결제 자동화
- 강사 셀프 신청 및 심사 프로세스
- 수강 후기 및 강사 평점 시스템
- 강의 카테고리/태그 필터
