# 사우나 커뮤니티 인증 패스 — 디자인 스펙

## Context

사우나가 유행하면서 커뮤니티 기반의 사우나 탐방 기록/인증 서비스 수요가 생겼다.
방문 인증 → 스탬프 → 레벨업 → SNS 공유의 핵심 루프를 통해 커뮤니티를 성장시키고,
미션/탐험 지도 등 게임화 요소로 지속적인 동기부여를 제공하는 웹앱을 만든다.

---

## 제품 개요

- **플랫폼**: 웹앱 (모바일 브라우저 우선)
- **인증 방식**: 수동 체크인 (검색 후 카드 작성)
- **커뮤니티**: 신규 커뮤니티 (기존 없음)
- **장소 데이터**: 유저가 직접 등록/추가

---

## 핵심 사용자 루프

```
사우나 검색 → 체크인 카드 작성 → 인증 카드 생성 → SNS 공유
     ↓
스탬프 +1 → 레벨/칭호 업데이트 → 미션 달성 체크 → 탐험 지도 해금
```

---

## 기능 명세

### 1. 체크인

- 사우나 검색 → 없으면 직접 등록 (장소명, 주소)
- 체크인 카드 입력 필드 (각자 독립 입력, 다른 유저 값 pre-fill 없음):
  - 입장 가격 (숫자, 원 단위)
  - 특징 (TEXT[] 태그 배열, 예: ["혼탕없음", "수건제공", "주차가능"])
  - 방문 한줄평 (TEXT, 최대 100자)
- 완료 시 인증 카드 생성 및 SNS 공유

**중복 체크인 정책:**
- 같은 사우나에 같은 날(KST 기준 달력일) 중복 체크인 불가
- 다른 날 재방문은 새 스탬프로 인정
- 같은 장소 재방문은 탐험 지도 해금에 영향 없음 (이미 해금된 상태 유지)

### 2. 인증 카드 구성

```
┌─────────────────────────────────┐
│  오늘도 기록했어요               │  ← 헤더 (고정 문구)
│  "명언 인용구"                  │  ← 랜덤 사우나/웰니스 명언
├─────────────────────────────────┤
│  닉네임  [사우나 고수]           │  ← 닉네임 + 현재 칭호
│  장소명                         │
│  위치 (시/구 수준)               │
│  입장 가격                       │
│  특징 태그들                     │
│  방문 한줄평                     │
│  날짜                           │
└─────────────────────────────────┘
```

**명언 섹션:**
- 헤더 최상단에 "오늘도 기록했어요" 고정 문구 표시
- 서비스 내 큐레이션된 사우나/웰니스 관련 명언 목록에서 랜덤 선택
- 명언은 DB의 `Quote` 테이블에서 관리 (추가/수정 가능)
- 카드 생성 시 서버에서 랜덤 선택하여 인증 카드 이미지에 고정

**SNS 공유:**
- **카카오톡**: Kakao SDK 공유 API 사용 (링크 + 카드 이미지)
- **인스타그램**: Web Share API (`navigator.share`) 사용. 미지원 브라우저의 경우 이미지 다운로드 후 직접 업로드 안내 프롬프트 표시
- 카드 이미지는 Satori로 서버사이드 PNG 생성 (1080×1080px, 인스타 정사각형 기준)

### 3. 레벨 시스템

| 누적 스탬프 | 칭호 |
|-------------|------|
| 0개 | (칭호 없음, 표시 안 함) |
| 1–4개 | 사우나 입문자 |
| 5–14개 | 단골 |
| 15–29개 | 사우나 고수 |
| 30개+ | 사우나 마스터 |

- 체크인 완료 즉시 레벨 자동 계산 및 칭호 업데이트
- `User.total_checkins`는 DB 트리거로 동기화 (CheckIn INSERT 시 자동 증가)

### 4. 미션/챌린지

**condition_type 열거값:**

| condition_type | 의미 | 평가 시점 |
|---|---|---|
| `MONTHLY_CHECKIN_COUNT` | 이번 달 체크인 수 ≥ condition_value | 체크인 완료 시 |
| `NEW_REGION_FIRST_VISIT` | 새 시/도 지역 첫 방문 | 체크인 완료 시 (현재 체크인 포함 평가: 해당 유저의 기존 CheckIn 중 같은 region을 가진 Sauna가 없으면 달성으로 판정) |
| `SAUNA_REGISTRATION_COUNT` | 사우나 등록 기여 수 ≥ condition_value | 사우나 등록 완료 시 |

- 미션 달성 시 `UserBadge` 레코드 생성 (중복 방지: UNIQUE(user_id, mission_id))
- 미션 진행률은 체크인/등록 이벤트 발생 시 실시간 계산 (MVP에서는 매 요청 시 집계)
- 미션 목록 페이지에서 진행률 확인 가능

**미션 예시:**
- "이번 달 3곳 방문" — MONTHLY_CHECKIN_COUNT, condition_value: 3, period: monthly
- "새 지역 첫 방문" — NEW_REGION_FIRST_VISIT, condition_value: 1
- "5개 사우나 등록 기여" — SAUNA_REGISTRATION_COUNT, condition_value: 5

### 5. 탐험 지도

- 전국 등록 사우나를 지도에 표시 (성능: 줌 레벨에 따라 클러스터링 적용)
- 미방문 사우나: 잠금(🔒) 아이콘, 흐린 핀
- 체크인 완료 사우나: 내 색상 핀으로 해금
- 상단에 "전체 N곳 중 M곳 방문" 진행률 표시
- 지역(시/도) 필터 제공

**지역 정의:** `Sauna.address`에서 첫 번째 행정구역(시/도) 파싱. 예: "서울", "부산", "경기"

### 6. 랭킹 보드

- 이번 달(KST 기준) 체크인 수 기준 상위 유저 목록
- 동점 처리: 같은 체크인 수일 경우, 해당 달의 마지막 체크인 타임스탬프(`MAX(CheckIn.created_at)`)가 이른 유저가 상위 — 즉, 같은 수에 먼저 도달한 유저 우선
- 내 순위 항상 하단 고정 표시

### 7. 사우나 데이터 관리

- **등록**: 누구나 새 사우나 등록 가능 (장소명, 주소 필수)
- **수정**: 등록자만 수정 가능
- **중복/오류 신고**: 다른 유저가 신고 가능 → 관리자 검토 후 처리 (MVP에서는 신고 접수만)

### 8. 인증/로그인

- **주 인증 수단**: 카카오 OAuth (모바일 친화적, 국내 타겟)
- **보조 인증 수단**: 이메일 Magic Link (Supabase Auth)
- 로그인 전 지도/사우나 목록 조회 가능, 체크인/등록은 로그인 필요

### 9. 프로필 (Phase 1 최소 포함)

- 체크인 완료 후 랜딩: 내 프로필 페이지
- 표시 정보: 닉네임, 칭호, 총 스탬프 수, 최근 체크인 히스토리 (최신 5개)
- 전체 히스토리 페이지는 Phase 3에서 확장

---

## 데이터 모델

### User
```
id            UUID PK
nickname      TEXT NOT NULL
level_title   TEXT  -- 계산값 캐시, DB 트리거로 동기화
total_checkins INTEGER DEFAULT 0  -- DB 트리거로 동기화
created_at    TIMESTAMPTZ
```

### Sauna
```
id          UUID PK
name        TEXT NOT NULL
address     TEXT NOT NULL
region      TEXT  -- address에서 파싱된 시/도 (예: "서울")
lat         DECIMAL(9,6)
lng         DECIMAL(9,6)
created_by  UUID FK → User.id
created_at  TIMESTAMPTZ
```

### CheckIn
```
id          UUID PK
user_id     UUID FK → User.id
sauna_id    UUID FK → Sauna.id
price       INTEGER  -- 원 단위
features    TEXT[]   -- 태그 배열
one_liner   TEXT     -- 최대 100자
quote_id    UUID FK → Quote.id  -- 인증 카드에 사용된 명언
created_at  TIMESTAMPTZ
UNIQUE(user_id, sauna_id, DATE(created_at AT TIME ZONE 'Asia/Seoul'))
```

### Quote
```
id      UUID PK
text    TEXT NOT NULL  -- 명언 본문
author  TEXT           -- 출처/저자 (선택)
```

### Mission
```
id               UUID PK
title            TEXT NOT NULL
condition_type   TEXT NOT NULL  -- MONTHLY_CHECKIN_COUNT | NEW_REGION_FIRST_VISIT | SAUNA_REGISTRATION_COUNT
condition_value  INTEGER
period           TEXT  -- monthly | one_time
badge_image      TEXT  -- 이미지 URL
```

### UserBadge
```
id          UUID PK
user_id     UUID FK → User.id
mission_id  UUID FK → Mission.id
earned_at   TIMESTAMPTZ
UNIQUE(user_id, mission_id)
```

### SaunaReport (MVP: 신고 접수만)
```
id         UUID PK
sauna_id   UUID FK → Sauna.id
reporter   UUID FK → User.id
reason     TEXT
created_at TIMESTAMPTZ
```

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| Frontend | Next.js (App Router) | 모바일 웹 + SSR |
| Backend | Next.js API Routes | 별도 서버 불필요 |
| DB + Auth | Supabase | PostgreSQL + 인증 내장, Kakao OAuth 지원 |
| 지도 | Kakao Maps API | 국내 사우나 데이터 풍부, 한국어 주소 처리 |
| 인증 카드 이미지 | Satori (OG image) | 서버사이드 1080×1080 PNG 생성 |
| 배포 | Vercel | Next.js 최적화 |

---

## 구현 단계 (MVP 우선)

### Phase 1 — 핵심 루프
1. 인증/로그인 (Supabase Auth + Kakao OAuth)
2. 사우나 등록 + 검색
3. 체크인 카드 작성 (중복 방지 포함)
4. 인증 카드 생성 (명언 섹션 포함) + SNS 공유
5. 레벨/칭호 계산 (DB 트리거)
6. 최소 프로필 페이지 (체크인 히스토리 5개)

### Phase 2 — 게임화
7. 탐험 지도 (Kakao Maps + 해금 시스템 + 클러스터링)
8. 미션/뱃지 시스템

### Phase 3 — 커뮤니티
9. 랭킹 보드
10. 전체 프로필 / 스탬프 히스토리 페이지

---

## 검증 방법

- **체크인 E2E**: 로그인 → 사우나 검색 → 카드 작성 → 인증 카드 생성 확인 (명언 표시 확인)
- **중복 방지**: 같은 날 같은 사우나 재체크인 시 오류 반환 확인
- **레벨업**: 체크인 수 조작 후 `level_title` 자동 변경 확인 (DB 트리거 동작)
- **지도 해금**: 체크인 전후 사우나 잠금/해금 상태 변경 확인
- **미션**: 조건 달성 시 `UserBadge` 자동 생성 확인
- **인증 카드 이미지**: Satori 렌더링 결과 1080×1080 PNG 확인, SNS 공유 시 OG 이미지 표시 확인
- **랭킹 동점 처리**: 동일 체크인 수 유저간 순서 검증
