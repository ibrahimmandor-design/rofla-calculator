-- ROFLA single-shop database foundation (Supabase / PostgreSQL)
-- One shared shop login. No employee accounts, roles, or permission matrix.
-- Apply only after reviewing in the intended Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'أخرى',
  supply_type text not null check (supply_type in ('made','bought')),
  sale_unit text not null default 'قطعة',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_unit text not null,
  low_stock_level numeric(14,3) not null default 0 check (low_stock_level >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  recipe_name text not null default 'الوصفة الأساسية',
  output_quantity numeric(14,3) not null default 1 check (output_quantity > 0),
  output_unit text not null default 'تشغيلة',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, recipe_name)
);

create table if not exists public.recipe_lines (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  unique(recipe_id, material_id)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  purchased_at timestamptz not null default now(),
  supplier_name text,
  notes text,
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  material_id uuid references public.materials(id),
  product_id uuid references public.products(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  line_total numeric(14,2) not null check (line_total >= 0),
  check ((material_id is not null)::int + (product_id is not null)::int = 1)
);

create table if not exists public.production_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  recipe_id uuid references public.recipes(id),
  produced_at timestamptz not null default now(),
  planned_batches numeric(14,3) not null default 1 check (planned_batches > 0),
  actual_output numeric(14,3) not null check (actual_output >= 0),
  output_unit text not null,
  waste_quantity numeric(14,3) not null default 0 check (waste_quantity >= 0),
  waste_note text,
  notes text,
  material_cost numeric(14,2) not null default 0 check (material_cost >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.production_consumptions (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.production_batches(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  actual_quantity numeric(14,3) not null check (actual_quantity >= 0),
  unit text not null,
  unit_cost numeric(14,4) not null default 0 check (unit_cost >= 0)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sold_at timestamptz not null default now(),
  channel text not null default 'المحل',
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  unit_cost_snapshot numeric(14,4) not null default 0 check (unit_cost_snapshot >= 0)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_at timestamptz not null default now(),
  category text not null,
  amount numeric(14,2) not null check (amount > 0),
  is_recurring boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.competitor_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  competitor_name text not null,
  observed_price numeric(14,2) not null check (observed_price > 0),
  comparison_size text not null,
  source_note text,
  observed_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Stock ledger. All quantities must be represented as movements, not overwritten balances.
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id),
  product_id uuid references public.products(id),
  movement_type text not null check (movement_type in ('purchase','production_use','production_output','sale','waste','return','adjustment')),
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  unit text not null,
  reference_id uuid,
  occurred_at timestamptz not null default now(),
  note text,
  created_by uuid references auth.users(id),
  check ((material_id is not null)::int + (product_id is not null)::int = 1)
);

create index if not exists idx_stock_movements_material on public.stock_movements(material_id, occurred_at);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id, occurred_at);
create index if not exists idx_sales_sold_at on public.sales(sold_at);
create index if not exists idx_expenses_spent_at on public.expenses(spent_at);
create index if not exists idx_production_product_date on public.production_batches(product_id, produced_at);

-- Shared single-account model: any authenticated session is the same shop account.
-- No employee identities, roles, or row ownership partitioning.
do $$
declare t text;
begin
  foreach t in array array[
    'products','materials','recipes','recipe_lines','purchases','purchase_lines',
    'production_batches','production_consumptions','sales','sale_lines','expenses',
    'competitor_prices','stock_movements'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "shared shop account access" on public.%I', t);
    execute format('create policy "shared shop account access" on public.%I for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null)', t);
  end loop;
end $$;

-- IMPORTANT:
-- 1) Never put the Supabase service_role key in browser code.
-- 2) This schema is a foundation, not a finished accounting engine.
-- 3) Production/sale stock movements must be committed transactionally with their parent records.
-- 4) Add idempotency keys / server-side transaction functions before live multi-device use.
-- 5) Do not insert sample products, recipes, opening balances, or costs as if they were real.
