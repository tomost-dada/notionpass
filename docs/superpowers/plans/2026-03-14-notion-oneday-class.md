# Notion 원데이클래스 플랫폼 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notion 활용법 원데이클래스를 수요 기반으로 개설하는 웹 플랫폼 MVP를 구축한다.

**Architecture:** Next.js App Router + Supabase(PostgreSQL + RLS + Auth). 공개 페이지에서 알림 신청/강의 요청을 받고, 어드민 페이지에서 운영자가 수동으로 개설 결정 → 결제 링크 이메일 발송 → 결제 확인 → Zoom 링크 이메일 발송 순서로 진행한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL), Resend (이메일), Vercel (배포)

---

## Chunk 1: 프로젝트 셋업

### Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

- [ ] **Step 2: 필수 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr resend
npm install -D supabase
```

- [ ] **Step 3: 테스트 환경 설치**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest
```

- [ ] **Step 4: jest.config.ts 생성**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 5: jest.setup.ts 생성**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: .env.local.example 생성**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 7: .env.local 생성 후 실제 값 입력**

Supabase 프로젝트 생성: https://supabase.com/dashboard
대시보드 → Settings → API에서 URL과 키 복사.

- [ ] **Step 8: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: http://localhost:3000 접속 시 Next.js 기본 페이지 표시

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: initialize next.js project with supabase and resend"
```

---

### Task 2: Supabase DB 스키마 마이그레이션

**Files:**
- Create: `supabase/migrations/20260314000001_initial_schema.sql`
- Create: `supabase/migrations/20260314000002_rls_policies.sql`

- [ ] **Step 1: Supabase CLI 초기화**

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

- [ ] **Step 2: 초기 스키마 마이그레이션 파일 생성**

```bash
npx supabase migration new initial_schema
```

파일 경로: `supabase/migrations/20260314000001_initial_schema.sql`

- [ ] **Step 3: 스키마 SQL 작성**

```sql
-- supabase/migrations/20260314000001_initial_schema.sql

-- users 테이블 (Supabase Auth의 auth.users를 미러링)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  name text,
  avatar_url text,
  provider text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- classes 테이블
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructor_name text not null,
  thumbnail_url text,
  status text not null default 'draft'
    check (status in ('draft', 'open_for_request', 'confirmed', 'cancelled', 'completed')),
  scheduled_at timestamptz,
  price integer,
  zoom_link text,
  created_at timestamptz not null default now()
);

-- notification_requests 테이블
create table public.notification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, class_id)
);

-- class_requests 테이블
create table public.class_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'converted', 'rejected')),
  converted_class_id uuid references public.classes(id) on delete set null,
  created_at timestamptz not null default now()
);

-- request_votes 테이블
create table public.request_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  class_request_id uuid not null references public.class_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, class_request_id)
);

-- enrollments 테이블
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  class_id uuid not null references public.classes(id) on delete cascade,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'cancelled')),
  payment_link text,
  payment_link_sent_at timestamptz,
  paid_at timestamptz,
  zoom_link_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, class_id)
);

-- auth.users → public.users 자동 동기화 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url, provider)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- classes confirmed 전환 시 enrollments upsert 함수
create or replace function public.create_enrollments_on_confirm(p_class_id uuid)
returns void as $$
begin
  insert into public.enrollments (user_id, class_id, payment_status)
  select user_id, p_class_id, 'pending'
  from public.notification_requests
  where class_id = p_class_id
  on conflict (user_id, class_id) do nothing;
end;
$$ language plpgsql security definer;
```

- [ ] **Step 4: RLS 정책 마이그레이션 파일 생성**

```bash
npx supabase migration new rls_policies
```

- [ ] **Step 5: RLS SQL 작성**

```sql
-- supabase/migrations/20260314000002_rls_policies.sql

-- RLS 활성화
alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.notification_requests enable row level security;
alter table public.class_requests enable row level security;
alter table public.request_votes enable row level security;
alter table public.enrollments enable row level security;

-- users 정책
create policy "users: 본인 조회" on public.users
  for select using (auth.uid() = id);
create policy "users: 어드민 전체 조회" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- classes 정책 (zoom_link 제외 공개 조회)
create policy "classes: 공개 조회 (zoom_link 제외)" on public.classes
  for select using (status != 'draft');
create policy "classes: 어드민 전체 조회/수정" on public.classes
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- notification_requests 정책
create policy "notification_requests: 본인 조회" on public.notification_requests
  for select using (auth.uid() = user_id);
create policy "notification_requests: 본인 insert" on public.notification_requests
  for insert with check (auth.uid() = user_id);
create policy "notification_requests: 본인 delete" on public.notification_requests
  for delete using (auth.uid() = user_id);
create policy "notification_requests: 어드민 전체" on public.notification_requests
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- class_requests 정책
create policy "class_requests: 전체 공개 조회" on public.class_requests
  for select using (true);
create policy "class_requests: 로그인 insert" on public.class_requests
  for insert with check (auth.uid() = user_id);
create policy "class_requests: 어드민 수정" on public.class_requests
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- request_votes 정책
create policy "request_votes: 전체 공개 조회" on public.request_votes
  for select using (true);
create policy "request_votes: 로그인 insert" on public.request_votes
  for insert with check (auth.uid() = user_id);
create policy "request_votes: 본인 delete" on public.request_votes
  for delete using (auth.uid() = user_id);

-- enrollments 정책
create policy "enrollments: 본인 조회" on public.enrollments
  for select using (auth.uid() = user_id);
create policy "enrollments: 어드민 전체" on public.enrollments
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );
```

- [ ] **Step 6: 마이그레이션 적용**

```bash
npx supabase db push
```

Expected: 마이그레이션 성공 메시지

- [ ] **Step 7: Supabase 대시보드에서 테이블 생성 확인**

Table Editor에서 users, classes, notification_requests, class_requests, request_votes, enrollments 6개 테이블 확인.

- [ ] **Step 8: Supabase Auth에서 Google OAuth 설정**

대시보드 → Authentication → Providers → Google 활성화.
Google Cloud Console에서 OAuth 2.0 클라이언트 생성 후 Client ID/Secret 입력.
Redirect URL: `https://<your-project>.supabase.co/auth/v1/callback`

- [ ] **Step 9: classes_public 뷰 생성 (zoom_link 보안)**

RLS는 컬럼 레벨 필터를 지원하지 않음. `zoom_link`를 숨기기 위해 뷰를 사용:

```sql
-- supabase/migrations/20260314000002_rls_policies.sql 끝에 추가
create view public.classes_public with (security_barrier = true) as
  select
    id, title, description, instructor_name, thumbnail_url,
    status, scheduled_at, price, created_at
  from public.classes
  where status != 'draft';

-- 일반 사용자는 classes_public 뷰를 통해서만 조회
-- 어드민은 classes 테이블 직접 접근 (zoom_link 포함)
grant select on public.classes_public to anon, authenticated;
```

`src/lib/db/classes.ts`의 일반 사용자용 쿼리는 `.from('classes_public')`을 사용하고,
어드민용 쿼리만 `.from('classes')`를 사용한다.

- [ ] **Step 9b: Kakao OAuth 설정**

1. [Kakao Developers](https://developers.kakao.com) → 앱 생성
2. 앱 → 앱 설정 → 플랫폼 → Web 추가 → 사이트 도메인 입력
3. 카카오 로그인 활성화 → Redirect URI 추가:
   `https://<your-project>.supabase.co/auth/v1/callback`
4. 앱 키 → REST API 키 복사
5. Supabase 대시보드 → Authentication → Providers → Kakao 활성화
6. REST API 키(Client ID)와 Client Secret 입력

- [ ] **Step 10: 마이그레이션 적용**

```bash
npx supabase db push
```

Expected: 마이그레이션 성공 메시지

- [ ] **Step 11: Supabase 대시보드에서 테이블 생성 확인**

Table Editor에서 users, classes, notification_requests, class_requests, request_votes, enrollments 6개 테이블 + classes_public 뷰 확인.

- [ ] **Step 12: Supabase Auth에서 Google OAuth 설정**

대시보드 → Authentication → Providers → Google 활성화.
Google Cloud Console에서 OAuth 2.0 클라이언트 생성 후 Client ID/Secret 입력.
Redirect URL: `https://<your-project>.supabase.co/auth/v1/callback`

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add supabase schema migrations and rls policies"
```

---

## Chunk 2: Supabase 클라이언트 & 타입 & 미들웨어

### Task 3: TypeScript 타입 정의

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 타입 파일 작성**

```typescript
// src/types/index.ts

export type UserRole = 'user' | 'admin'
export type ClassStatus = 'draft' | 'open_for_request' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled'
export type ClassRequestStatus = 'pending' | 'converted' | 'rejected'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  provider: string | null
  role: UserRole
  created_at: string
}

export interface Class {
  id: string
  title: string
  description: string | null
  instructor_name: string
  thumbnail_url: string | null
  status: ClassStatus
  scheduled_at: string | null
  price: number | null
  zoom_link?: string | null  // admin only
  created_at: string
  notification_count?: number  // join 결과
}

export interface NotificationRequest {
  id: string
  user_id: string
  class_id: string
  created_at: string
}

export interface ClassRequest {
  id: string
  user_id: string | null
  title: string
  description: string | null
  status: ClassRequestStatus
  converted_class_id: string | null
  created_at: string
  vote_count?: number  // join 결과
  user_voted?: boolean  // 현재 사용자 투표 여부
  user?: Pick<User, 'name'> | null  // 요청자 정보
}

export interface RequestVote {
  id: string
  user_id: string
  class_request_id: string
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string | null
  class_id: string
  payment_status: PaymentStatus
  payment_link: string | null
  payment_link_sent_at: string | null
  paid_at: string | null
  zoom_link_sent_at: string | null
  created_at: string
  user?: Pick<User, 'id' | 'name' | 'email'> | null
  class?: Pick<Class, 'id' | 'title' | 'scheduled_at'> | null
}
```

- [ ] **Step 2: 타입 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

---

### Task 4: Supabase 클라이언트 설정

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: 브라우저 클라이언트 작성**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: 서버 클라이언트 작성**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// 어드민 클라이언트: 쿠키 없이 service role key로 직접 초기화 (RLS 우회)
// API Route에서만 사용. 절대 클라이언트 컴포넌트에서 사용 금지.
export function createAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 3: 미들웨어 작성 (세션 갱신 + 어드민 보호)**

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /admin/* 보호
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // /my 보호
  if (request.nextUrl.pathname.startsWith('/my')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/my/:path*'],
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add supabase clients, types, and admin middleware"
```

---

## Chunk 3: 인증 & 레이아웃

### Task 5: Auth 관련 Route Handler & 레이아웃

**Files:**
- Create: `src/app/auth/callback/route.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/AuthButton.tsx`

- [ ] **Step 1: OAuth 콜백 핸들러 작성**

```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // 동일 이메일 다른 provider 시도 시: 에러 메시지와 함께 홈으로
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`)
    }

    // 로그인 성공 시 public.users에서 기존 provider 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('provider')
        .eq('email', user.email!)
        .single()

      // 다른 provider로 이미 가입된 경우 경고
      const currentProvider = user.app_metadata?.provider
      if (existingUser && existingUser.provider && existingUser.provider !== currentProvider) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/?auth_error=${encodeURIComponent(`이미 ${existingUser.provider}로 가입된 이메일입니다.`)}`
        )
      }
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 2: AuthButton 컴포넌트 작성**

```typescript
// src/components/AuthButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useState } from 'react'

interface AuthButtonProps {
  user: User | null
}

export function AuthButton({ user }: AuthButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (user) {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
      >
        로그아웃
      </button>
    )
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="text-sm bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
    >
      로그인
    </button>
  )
}
```

- [ ] **Step 3: Header 컴포넌트 작성**

```typescript
// src/components/Header.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AuthButton } from './AuthButton'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    profile = data
  }

  return (
    <header className="border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">9AM</Link>
        <nav className="flex items-center gap-6">
          <Link href="/request" className="text-sm text-gray-600 hover:text-gray-900">강의 요청</Link>
          {user && (
            <Link href="/my" className="text-sm text-gray-600 hover:text-gray-900">마이페이지</Link>
          )}
          {profile?.role === 'admin' && (
            <Link href="/admin/classes" className="text-sm text-blue-600 hover:text-blue-800">어드민</Link>
          )}
          <AuthButton user={user} />
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Root Layout 수정**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: '9AM — Notion 원데이클래스',
  description: '토요일 아침, Notion을 제대로 배우는 시간',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: 개발 서버에서 로그인 동작 확인**

```bash
npm run dev
```

브라우저에서 로그인 버튼 클릭 → Google OAuth 리다이렉트 → 콜백 후 홈 복귀 확인.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add auth callback, header, and login/logout flow"
```

---

## Chunk 4: 공개 페이지 & DB 쿼리 레이어

### Task 6: DB 쿼리 레이어

**Files:**
- Create: `src/lib/db/classes.ts`
- Create: `src/lib/db/notifications.ts`
- Create: `src/lib/db/requests.ts`
- Create: `src/lib/db/enrollments.ts`

- [ ] **Step 1: classes 쿼리 작성**

```typescript
// src/lib/db/classes.ts
import { createClient } from '@/lib/supabase/server'
import { Class } from '@/types'

// 공개 쿼리는 classes_public 뷰 사용 (zoom_link 제외됨, draft 제외됨)
export async function getPublicClasses(): Promise<Class[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes_public')
    .select(`
      id, title, description, instructor_name, thumbnail_url,
      status, scheduled_at, price, created_at,
      notification_requests(count)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(c => ({
    ...c,
    notification_count: (c.notification_requests as any)?.[0]?.count ?? 0,
  }))
}

export async function getClassById(id: string): Promise<Class | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes_public')
    .select(`
      id, title, description, instructor_name, thumbnail_url,
      status, scheduled_at, price, created_at,
      notification_requests(count)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return {
    ...data,
    notification_count: (data.notification_requests as any)?.[0]?.count ?? 0,
  }
}
```

- [ ] **Step 2: notifications 쿼리 작성**

```typescript
// src/lib/db/notifications.ts
import { createClient } from '@/lib/supabase/server'

export async function getUserNotification(userId: string, classId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notification_requests')
    .select('id')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .single()
  return data
}

export async function getUserNotifications(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notification_requests')
    .select(`id, class_id, created_at, classes(id, title, status, scheduled_at)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
```

- [ ] **Step 3: requests 쿼리 작성**

```typescript
// src/lib/db/requests.ts
import { createClient } from '@/lib/supabase/server'
import { ClassRequest } from '@/types'

export async function getClassRequests(userId?: string): Promise<ClassRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('class_requests')
    .select(`
      id, title, description, status, converted_class_id, created_at,
      user_id,
      users(name),
      request_votes(count)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error

  const requests = data ?? []
  if (!userId) return requests.map(r => ({ ...r, vote_count: (r.request_votes as any)?.[0]?.count ?? 0 }))

  // 현재 사용자 투표 여부 확인
  const { data: votes } = await supabase
    .from('request_votes')
    .select('class_request_id')
    .eq('user_id', userId)

  const votedIds = new Set((votes ?? []).map(v => v.class_request_id))
  return requests.map(r => ({
    ...r,
    vote_count: (r.request_votes as any)?.[0]?.count ?? 0,
    user_voted: votedIds.has(r.id),
    user: r.users ? r.users : null,
  }))
}
```

- [ ] **Step 4: enrollments 쿼리 작성**

```typescript
// src/lib/db/enrollments.ts
import { createClient } from '@/lib/supabase/server'
import { Enrollment } from '@/types'

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('enrollments')
    .select(`id, class_id, payment_status, paid_at, created_at, classes(id, title, scheduled_at)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
```

---

### Task 7: 공개 페이지 구현

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/ClassCard.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/app/class/[id]/page.tsx`
- Create: `src/app/class/[id]/NotificationButton.tsx`
- Create: `src/app/request/page.tsx`
- Create: `src/app/request/RequestList.tsx`
- Create: `src/app/my/page.tsx`

- [ ] **Step 1: StatusBadge 컴포넌트**

```typescript
// src/components/StatusBadge.tsx
import { ClassStatus } from '@/types'

const labels: Record<ClassStatus, string> = {
  draft: '준비중',
  open_for_request: '신청받는중',
  confirmed: '개설확정',
  cancelled: '취소됨',
  completed: '종료',
}

const colors: Record<ClassStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  open_for_request: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-500',
}

export function StatusBadge({ status }: { status: ClassStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}
```

- [ ] **Step 2: ClassCard 컴포넌트**

```typescript
// src/components/ClassCard.tsx
import Link from 'next/link'
import { Class } from '@/types'
import { StatusBadge } from './StatusBadge'

export function ClassCard({ cls }: { cls: Class }) {
  return (
    <Link href={`/class/${cls.id}`}>
      <div className="border border-gray-100 rounded-xl p-5 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-semibold text-base leading-snug">{cls.title}</h2>
          <StatusBadge status={cls.status} />
        </div>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cls.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{cls.instructor_name}</span>
          <span>알림 신청 {cls.notification_count ?? 0}명</span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: 홈 페이지**

```typescript
// src/app/page.tsx
import { getPublicClasses } from '@/lib/db/classes'
import { ClassCard } from '@/components/ClassCard'

export default async function HomePage() {
  const classes = await getPublicClasses()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Notion 원데이클래스</h1>
        <p className="text-gray-500 text-sm">토요일 아침 9시, 일찍 시작하는 배움</p>
      </div>

      {classes.length === 0 ? (
        <p className="text-gray-400 text-sm">예정된 강의가 없습니다.</p>
      ) : (
        <div className="grid gap-4">
          {classes.map(cls => <ClassCard key={cls.id} cls={cls} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 알림 신청 버튼 (클라이언트 컴포넌트)**

```typescript
// src/app/class/[id]/NotificationButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  classId: string
  userId: string | null
  initialSubscribed: boolean
}

export function NotificationButton({ classId, userId, initialSubscribed }: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleClick = async () => {
    if (!userId) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      return
    }

    setLoading(true)
    if (subscribed) {
      await supabase.from('notification_requests')
        .delete()
        .eq('user_id', userId)
        .eq('class_id', classId)
      setSubscribed(false)
    } else {
      await supabase.from('notification_requests')
        .insert({ user_id: userId, class_id: classId })
      setSubscribed(true)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 ${
        subscribed
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-black text-white hover:bg-gray-800'
      }`}
    >
      {loading ? '처리중...' : subscribed ? '알림 신청 취소' : '알림 신청하기'}
    </button>
  )
}
```

- [ ] **Step 5: 강의 상세 페이지**

```typescript
// src/app/class/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClassById } from '@/lib/db/classes'
import { getUserNotification } from '@/lib/db/notifications'
import { StatusBadge } from '@/components/StatusBadge'
import { NotificationButton } from './NotificationButton'

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cls = await getClassById(id)
  if (!cls) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let subscribed = false
  if (user) {
    const existing = await getUserNotification(user.id, id)
    subscribed = !!existing
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={cls.status} />
          {cls.scheduled_at && (
            <span className="text-sm text-gray-500">
              {new Date(cls.scheduled_at).toLocaleDateString('ko-KR', {
                month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">{cls.title}</h1>
        <p className="text-sm text-gray-500">강사: {cls.instructor_name}</p>
      </div>

      {cls.description && (
        <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">{cls.description}</p>
      )}

      <div className="border border-gray-100 rounded-xl p-5 mb-6">
        <p className="text-sm text-gray-500 mb-1">현재 알림 신청</p>
        <p className="text-2xl font-bold">{cls.notification_count}명</p>
      </div>

      {cls.status === 'open_for_request' && (
        <div>
          <NotificationButton
            classId={cls.id}
            userId={user?.id ?? null}
            initialSubscribed={subscribed}
          />
          {!user && (
            <p className="text-xs text-center text-gray-400 mt-2">
              알림 신청은 로그인이 필요합니다
            </p>
          )}
        </div>
      )}

      {cls.status === 'confirmed' && (
        <div className="bg-blue-50 rounded-xl p-5 text-sm text-blue-700">
          이 강의는 개설 확정되었습니다. 알림 신청자에게 결제 링크가 이메일로 발송됩니다.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: 강의 요청 페이지**

`src/app/request/page.tsx`와 `src/app/request/RequestList.tsx` 작성:

```typescript
// src/app/request/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getClassRequests } from '@/lib/db/requests'
import { RequestList } from './RequestList'
import { NewRequestForm } from './NewRequestForm'

export default async function RequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const requests = await getClassRequests(user?.id)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">강의 요청</h1>
        <p className="text-gray-500 text-sm">듣고 싶은 Notion 강의를 요청하고 투표해보세요</p>
      </div>
      <NewRequestForm userId={user?.id ?? null} />
      <RequestList requests={requests} userId={user?.id ?? null} />
    </div>
  )
}
```

```typescript
// src/app/request/NewRequestForm.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewRequestForm({ userId }: { userId: string | null }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !title.trim()) return
    setLoading(true)
    await supabase.from('class_requests').insert({ user_id: userId, title, description })
    setTitle('')
    setDescription('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!userId) return (
    <p className="text-sm text-gray-400 mb-6">강의 요청은 로그인 후 가능합니다.</p>
  )

  return (
    <div className="mb-8">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm bg-black text-white px-4 py-2 rounded-lg">
          + 강의 요청하기
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="border border-gray-100 rounded-xl p-5 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="어떤 강의를 듣고 싶으신가요?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="상세 내용 (선택)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="text-sm bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50">
              {loading ? '제출중...' : '요청 제출'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-4 py-2">
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

```typescript
// src/app/request/RequestList.tsx
'use client'

import { ClassRequest } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  requests: ClassRequest[]
  userId: string | null
}

export function RequestList({ requests, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleVote = async (requestId: string, voted: boolean) => {
    if (!userId) return
    if (voted) {
      await supabase.from('request_votes').delete().eq('user_id', userId).eq('class_request_id', requestId)
    } else {
      await supabase.from('request_votes').insert({ user_id: userId, class_request_id: requestId })
    }
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="border border-gray-100 rounded-xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{req.title}</p>
            {req.description && <p className="text-xs text-gray-500 mt-1">{req.description}</p>}
            <p className="text-xs text-gray-400 mt-2">
              {req.user?.name ?? '(탈퇴 회원)'}
            </p>
          </div>
          <button
            onClick={() => handleVote(req.id, req.user_voted ?? false)}
            disabled={!userId}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
              req.user_voted
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>+1</span>
            <span>{req.vote_count}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: 마이페이지**

```typescript
// src/app/my/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getUserNotifications } from '@/lib/db/notifications'
import { getUserEnrollments } from '@/lib/db/enrollments'
import { StatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [notifications, enrollments] = await Promise.all([
    getUserNotifications(user.id),
    getUserEnrollments(user.id),
  ])

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-semibold mb-4">알림 신청한 강의</h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400">신청한 강의가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Link key={n.id} href={`/class/${n.class_id}`}>
                <div className="border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors">
                  <span className="text-sm font-medium">{(n.classes as any)?.title}</span>
                  <StatusBadge status={(n.classes as any)?.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-4">수강 확정 강의</h2>
        {enrollments.filter(e => e.payment_status === 'paid').length === 0 ? (
          <p className="text-sm text-gray-400">수강 확정된 강의가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {enrollments.filter(e => e.payment_status === 'paid').map(e => (
              <div key={e.id} className="border border-blue-100 rounded-lg px-4 py-3">
                <p className="text-sm font-medium">{(e.class as any)?.title}</p>
                <p className="text-xs text-blue-600 mt-1">Zoom 링크는 이메일로 발송되었습니다</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 8: 공개 페이지 동작 확인**

```bash
npm run dev
```

- 홈(`/`): 강의 카드 목록 확인
- `/class/:id`: 강의 상세 + 알림 신청 버튼 동작 확인
- `/request`: 강의 요청 목록 + 투표 버튼 확인
- `/my`: 마이페이지 내역 확인

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add public pages (home, class detail, request, my page)"
```

---

## Chunk 5: 어드민 페이지

### Task 8: 어드민 레이아웃 & 강의 관리

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/classes/page.tsx`
- Create: `src/app/admin/classes/ClassManager.tsx`
- Create: `src/app/admin/requests/page.tsx`
- Create: `src/app/admin/enrollments/page.tsx`
- Create: `src/app/api/admin/classes/route.ts`
- Create: `src/app/api/admin/enrollments/route.ts`

- [ ] **Step 1: 어드민 레이아웃**

```typescript
// src/app/admin/layout.tsx
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <nav className="w-40 shrink-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">어드민</p>
        <div className="space-y-1">
          {[
            { href: '/admin/classes', label: '강의 관리' },
            { href: '/admin/requests', label: '요청 관리' },
            { href: '/admin/enrollments', label: '수강 관리' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="block text-sm text-gray-600 hover:text-gray-900 py-1">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: 어드민용 classes 쿼리 추가**

`src/lib/db/classes.ts`에 추가:

```typescript
// 어드민 쿼리는 createAdminClient() 사용 — zoom_link 포함, RLS 우회
// 이 함수는 src/lib/db/classes.ts 하단에 추가 (import 경로 일관성 유지)
export async function getAllClassesAdmin() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id, title, description, instructor_name, thumbnail_url,
      status, scheduled_at, price, zoom_link, created_at,
      notification_requests(count)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(c => ({
    ...c,
    notification_count: (c.notification_requests as any)?.[0]?.count ?? 0,
  }))
}
```

- [ ] **Step 3: 강의 관리 API Route 작성**

```typescript
// src/app/api/admin/classes/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 어드민 API 공통 가드 — 모든 admin API route 상단에 삽입
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

// 강의 생성
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = createAdminClient()
  const body = await request.json()
  const { data, error } = await supabase.from('classes').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// 강의 수정 (상태 변경 포함)
export async function PATCH(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = createAdminClient()
  const body = await request.json()
  const { id, ...updates } = body

  // confirmed 전환 시 zoom_link 필수 체크
  if (updates.status === 'confirmed') {
    const { data: cls } = await supabase.from('classes').select('zoom_link').eq('id', id).single()
    if (!cls?.zoom_link && !updates.zoom_link) {
      return NextResponse.json({ error: 'Zoom 링크를 먼저 입력해주세요.' }, { status: 400 })
    }
    // enrollments upsert — 실패 시 status 변경 차단
    const { error: rpcError } = await supabase.rpc('create_enrollments_on_confirm', { p_class_id: id })
    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  // cancelled 전환 시 enrollments 일괄 취소
  if (updates.status === 'cancelled') {
    await supabase.from('enrollments')
      .update({ payment_status: 'cancelled' })
      .eq('class_id', id)
  }

  const { data, error } = await supabase.from('classes').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
```

- [ ] **Step 4: 강의 관리 UI**

```typescript
// src/app/admin/classes/page.tsx
import { getAllClassesAdmin } from '@/lib/db/classes'
import { ClassManager } from './ClassManager'

export default async function AdminClassesPage() {
  const classes = await getAllClassesAdmin()
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">강의 관리</h1>
      <ClassManager initialClasses={classes} />
    </div>
  )
}
```

```typescript
// src/app/admin/classes/ClassManager.tsx
'use client'

import { Class, ClassStatus } from '@/types'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/StatusBadge'

const STATUS_TRANSITIONS: Record<ClassStatus, ClassStatus[]> = {
  draft: ['open_for_request', 'cancelled'],
  open_for_request: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
}

export function ClassManager({ initialClasses }: { initialClasses: Class[] }) {
  const [classes, setClasses] = useState(initialClasses)
  const [editing, setEditing] = useState<string | null>(null)
  const [zoomLink, setZoomLink] = useState('')
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({ title: '', instructor_name: '', description: '', zoom_link: '' })
  const router = useRouter()

  const updateClass = async (id: string, updates: Partial<Class>) => {
    const res = await fetch('/api/admin/classes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    router.refresh()
  }

  const createClass = async () => {
    const res = await fetch('/api/admin/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    if (res.ok) {
      setCreating(false)
      setNewForm({ title: '', instructor_name: '', description: '', zoom_link: '' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setCreating(true)} className="text-sm bg-black text-white px-4 py-2 rounded-lg">
        + 새 강의 등록
      </button>

      {creating && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-3">
          <input placeholder="강의 제목" value={newForm.title}
            onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="강사명" value={newForm.instructor_name}
            onChange={e => setNewForm(p => ({ ...p, instructor_name: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="강의 소개" value={newForm.description}
            onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm h-20" />
          <input placeholder="Zoom 링크 (미리 입력 권장)" value={newForm.zoom_link}
            onChange={e => setNewForm(p => ({ ...p, zoom_link: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={createClass} className="text-sm bg-black text-white px-4 py-2 rounded-lg">등록</button>
            <button onClick={() => setCreating(false)} className="text-sm text-gray-500 px-4 py-2">취소</button>
          </div>
        </div>
      )}

      {classes.map(cls => (
        <div key={cls.id} className="border border-gray-100 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium">{cls.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cls.instructor_name} · 신청 {cls.notification_count}명</p>
            </div>
            <StatusBadge status={cls.status} />
          </div>

          {/* Zoom 링크 입력 */}
          {editing === cls.id ? (
            <div className="flex gap-2 mb-3">
              <input value={zoomLink} onChange={e => setZoomLink(e.target.value)}
                placeholder="Zoom 링크 입력"
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
              <button onClick={() => { updateClass(cls.id, { zoom_link: zoomLink }); setEditing(null) }}
                className="text-sm bg-black text-white px-3 py-1.5 rounded-lg">저장</button>
            </div>
          ) : (
            <button onClick={() => { setEditing(cls.id); setZoomLink(cls.zoom_link ?? '') }}
              className="text-xs text-blue-600 mb-3 block">
              {cls.zoom_link ? `Zoom: ${cls.zoom_link.slice(0, 30)}...` : '+ Zoom 링크 입력'}
            </button>
          )}

          {/* 상태 전환 버튼 */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_TRANSITIONS[cls.status].map(next => (
              <button key={next}
                onClick={() => updateClass(cls.id, { status: next })}
                className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                → {next}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: 요청 관리 페이지**

```typescript
// src/app/admin/requests/page.tsx
import { createAdminClient } from '@/lib/supabase/server'
import { RequestAdminList } from './RequestAdminList'

async function getAdminRequests() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('class_requests')
    .select(`id, title, description, status, created_at, users(name), request_votes(count)`)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    ...r,
    vote_count: (r.request_votes as any)?.[0]?.count ?? 0,
  }))
}

export default async function AdminRequestsPage() {
  const requests = await getAdminRequests()
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">요청 관리</h1>
      <RequestAdminList requests={requests} />
    </div>
  )
}
```

```typescript
// src/app/admin/requests/RequestAdminList.tsx
'use client'

import { useRouter } from 'next/navigation'

export function RequestAdminList({ requests }: { requests: any[] }) {
  const router = useRouter()

  const convertToClass = async (requestId: string, title: string) => {
    const res = await fetch('/api/admin/requests/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, title }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{req.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {req.users?.name ?? '(탈퇴 회원)'} · 투표 {req.vote_count}명 · {req.status}
            </p>
          </div>
          {req.status === 'pending' && (
            <button
              onClick={() => convertToClass(req.id, req.title)}
              className="shrink-0 text-xs bg-black text-white px-3 py-1.5 rounded-lg">
              강의로 전환
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

```typescript
// src/app/api/admin/requests/convert/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = createAdminClient()
  const { requestId, title } = await request.json()

  // 강의 생성
  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({ title, instructor_name: '미정', status: 'draft' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // 요청 상태 업데이트
  await supabase
    .from('class_requests')
    .update({ status: 'converted', converted_class_id: newClass.id })
    .eq('id', requestId)

  return NextResponse.json(newClass)
}
```

- [ ] **Step 6: 수강 관리 페이지**

```typescript
// src/app/admin/enrollments/page.tsx
import { createAdminClient } from '@/lib/supabase/server'
import { EnrollmentManager } from './EnrollmentManager'

async function getAdminEnrollments() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('enrollments')
    .select(`
      id, class_id, payment_status, payment_link, payment_link_sent_at, paid_at, zoom_link_sent_at, created_at,
      users(id, name, email),
      classes(id, title, zoom_link)
    `)
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminEnrollmentsPage() {
  const enrollments = await getAdminEnrollments()
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">수강 관리</h1>
      <EnrollmentManager enrollments={enrollments} />
    </div>
  )
}
```

```typescript
// src/app/admin/enrollments/EnrollmentManager.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function EnrollmentManager({ enrollments }: { enrollments: any[] }) {
  const router = useRouter()
  const [paymentLinks, setPaymentLinks] = useState<Record<string, string>>({})

  const sendPaymentLink = async (enrollmentId: string) => {
    const link = paymentLinks[enrollmentId]
    if (!link) { alert('결제 링크를 입력해주세요.'); return }
    const res = await fetch('/api/admin/enrollments/send-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId, paymentLink: link }),
    })
    if (res.ok) router.refresh()
    else alert('발송 실패')
  }

  const markPaid = async (enrollmentId: string) => {
    const res = await fetch('/api/admin/enrollments/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId }),
    })
    if (res.ok) router.refresh()
    else alert('처리 실패')
  }

  return (
    <div className="space-y-3">
      {enrollments.map(e => (
        <div key={e.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{(e.classes as any)?.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(e.users as any)?.name} ({(e.users as any)?.email})
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              e.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
              e.payment_status === 'cancelled' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>{e.payment_status}</span>
          </div>

          {e.payment_status === 'pending' && !e.payment_link_sent_at && (
            <div className="flex gap-2">
              <input
                placeholder="결제 링크 URL"
                value={paymentLinks[e.id] ?? ''}
                onChange={ev => setPaymentLinks(p => ({ ...p, [e.id]: ev.target.value }))}
                className="flex-1 border rounded-lg px-3 py-1.5 text-xs"
              />
              <button onClick={() => sendPaymentLink(e.id)}
                className="text-xs bg-black text-white px-3 py-1.5 rounded-lg shrink-0">
                결제 링크 발송
              </button>
            </div>
          )}

          {e.payment_link_sent_at && e.payment_status === 'pending' && (
            <button onClick={() => markPaid(e.id)}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg">
              결제 완료 확인
            </button>
          )}

          {e.payment_status === 'paid' && e.zoom_link_sent_at && (
            <p className="text-xs text-green-600">✓ 결제 완료 — Zoom 링크 이메일 발송됨</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add admin pages (classes, requests, enrollments)"
```

---

## Chunk 6: 이메일 시스템

### Task 9: Resend 이메일 API

**Files:**
- Create: `src/lib/email/resend.ts`
- Create: `src/lib/email/templates.ts`
- Create: `src/app/api/admin/enrollments/send-payment/route.ts`
- Create: `src/app/api/admin/enrollments/mark-paid/route.ts`

- [ ] **Step 1: Resend 클라이언트 설정**

```typescript
// src/lib/email/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// Resend 대시보드에서 발신 도메인 인증 후 FROM_EMAIL 설정
export const FROM_EMAIL = 'noreply@yourdomain.com'  // 실제 도메인으로 변경
```

- [ ] **Step 2: 이메일 템플릿 작성**

```typescript
// src/lib/email/templates.ts

export function paymentLinkEmailHtml({
  userName,
  classTitle,
  scheduledAt,
  price,
  paymentLink,
}: {
  userName: string
  classTitle: string
  scheduledAt: string | null
  price: number | null
  paymentLink: string
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">강의 개설 확정 🎉</h1>
      <p style="color: #555; margin-bottom: 24px;">안녕하세요 ${userName}님, 신청하신 강의가 개설 확정되었습니다!</p>

      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="font-weight: 600; margin: 0 0 8px;">${classTitle}</p>
        ${scheduledAt ? `<p style="color: #666; font-size: 14px; margin: 0 0 4px;">📅 ${new Date(scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
        ${price ? `<p style="color: #666; font-size: 14px; margin: 0;">💰 ${price.toLocaleString()}원</p>` : ''}
      </div>

      <a href="${paymentLink}" style="display: block; background: #000; color: #fff; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-bottom: 16px;">
        결제하기
      </a>

      <p style="color: #999; font-size: 12px;">결제 완료 후 Zoom 링크를 별도 이메일로 발송해드립니다.</p>
    </div>
  `
}

export function zoomLinkEmailHtml({
  userName,
  classTitle,
  scheduledAt,
  zoomLink,
}: {
  userName: string
  classTitle: string
  scheduledAt: string | null
  zoomLink: string
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">수강 확정 ✅</h1>
      <p style="color: #555; margin-bottom: 24px;">안녕하세요 ${userName}님, 결제가 확인되었습니다!</p>

      <div style="background: #f0f7ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="font-weight: 600; margin: 0 0 8px;">${classTitle}</p>
        ${scheduledAt ? `<p style="color: #666; font-size: 14px; margin: 0 0 12px;">📅 ${new Date(scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
        <p style="font-size: 13px; color: #444; margin: 0 0 4px; font-weight: 600;">Zoom 링크</p>
        <a href="${zoomLink}" style="color: #0070f3; font-size: 14px; word-break: break-all;">${zoomLink}</a>
      </div>

      <p style="color: #999; font-size: 12px;">강의 당일 이 링크로 접속해주세요. 토요일 아침 9시에 만나요!</p>
    </div>
  `
}
```

- [ ] **Step 3: 결제 링크 발송 API**

```typescript
// src/app/api/admin/enrollments/send-payment/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { paymentLinkEmailHtml } from '@/lib/email/templates'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = createAdminClient()
  const { enrollmentId, paymentLink } = await request.json()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`*, users(name, email), classes(title, scheduled_at, price)`)
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const user = enrollment.users as any
  const cls = enrollment.classes as any

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: `[9AM] ${cls.title} 개설 확정 — 결제 링크`,
    html: paymentLinkEmailHtml({
      userName: user.name ?? '수강생',
      classTitle: cls.title,
      scheduledAt: cls.scheduled_at,
      price: cls.price,
      paymentLink,
    }),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('enrollments')
    .update({ payment_link: paymentLink, payment_link_sent_at: new Date().toISOString() })
    .eq('id', enrollmentId)

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: 결제 완료 확인 + Zoom 링크 발송 API**

```typescript
// src/app/api/admin/enrollments/mark-paid/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/email/resend'
import { zoomLinkEmailHtml } from '@/lib/email/templates'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = createAdminClient()
  const { enrollmentId } = await request.json()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`*, users(name, email), classes(title, scheduled_at, zoom_link)`)
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const user = enrollment.users as any
  const cls = enrollment.classes as any

  if (!cls.zoom_link) {
    return NextResponse.json({ error: 'Zoom 링크가 없습니다. 강의에서 먼저 입력해주세요.' }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: `[9AM] ${cls.title} 수강 확정 — Zoom 링크`,
    html: zoomLinkEmailHtml({
      userName: user.name ?? '수강생',
      classTitle: cls.title,
      scheduledAt: cls.scheduled_at,
      zoomLink: cls.zoom_link,
    }),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('enrollments')
    .update({ payment_status: 'paid', paid_at: new Date().toISOString(), zoom_link_sent_at: new Date().toISOString() })
    .eq('id', enrollmentId)

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Resend 설정 확인**

1. https://resend.com 에서 API 키 생성
2. 발신 도메인 DNS 설정 (SPF, DKIM)
3. `.env.local`의 `RESEND_API_KEY` 입력
4. `FROM_EMAIL`을 실제 도메인으로 변경

- [ ] **Step 6: 이메일 발송 e2e 테스트**

어드민에서:
1. 강의 등록 → open_for_request 전환
2. 수강생 계정으로 알림 신청
3. Zoom 링크 입력 → confirmed 전환 (enrollments 자동 생성 확인)
4. 결제 링크 입력 → 발송 (이메일 수신 확인)
5. 결제 완료 확인 클릭 (Zoom 링크 이메일 수신 확인)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add resend email integration (payment link + zoom link)"
```

---

## Chunk 7: Vercel 배포

### Task 10: 배포

**Files:**
- Create: `vercel.json` (필요 시)

- [ ] **Step 1: Vercel 프로젝트 연결**

```bash
npx vercel
```

- [ ] **Step 2: 환경변수 설정**

Vercel 대시보드 → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL  (배포 URL)
```

- [ ] **Step 3: Supabase Auth redirect URL 추가**

Supabase 대시보드 → Authentication → URL Configuration:
`https://your-domain.vercel.app/auth/callback`

- [ ] **Step 4: 초기 어드민 계정 설정**

배포 후 Supabase 대시보드 → Table Editor → users 테이블에서
운영자 이메일로 로그인한 계정의 `role`을 `admin`으로 수동 변경:

```sql
-- Supabase SQL Editor에서 실행
update public.users set role = 'admin' where email = 'your-admin@email.com';
```

변경 후 `/admin/classes` 접근 확인.

- [ ] **Step 5: 프로덕션 배포**

```bash
npx vercel --prod
```

- [ ] **Step 6: 배포 후 전체 플로우 확인**

1. 홈 → 강의 목록 확인
2. 소셜 로그인 (Google) 동작 확인
3. 알림 신청 동작 확인
4. 어드민 로그인 및 강의 개설 플로우 확인
5. 이메일 발송 확인

- [ ] **Step 7: Final Commit**

```bash
git add -A
git commit -m "chore: production deployment ready"
```
