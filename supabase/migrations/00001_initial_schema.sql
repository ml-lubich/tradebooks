-- Pricebooks
create table pricebooks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  trade text not null check (trade in ('hvac', 'plumbing', 'electrical', 'general')),
  description text,
  default_labor_rate numeric(10,2) default 95.00,
  default_parts_markup numeric(5,2) default 50.00,
  default_materials_markup numeric(5,2) default 30.00,
  tax_rate numeric(5,2) default 0.00,
  currency text default 'USD',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories within a pricebook
create table categories (
  id uuid default gen_random_uuid() primary key,
  pricebook_id uuid references pricebooks(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order integer default 0,
  labor_rate_override numeric(10,2),
  parts_markup_override numeric(5,2),
  created_at timestamptz default now()
);

-- Parts/items in catalog
create table parts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  pricebook_id uuid references pricebooks(id) on delete cascade not null,
  name text not null,
  description text,
  part_number text,
  cost numeric(10,2) not null default 0,
  labor_minutes integer default 60,
  flat_rate_price numeric(10,2),
  is_custom_price boolean default false,
  unit text default 'each',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table pricebooks enable row level security;
alter table categories enable row level security;
alter table parts enable row level security;

-- RLS policies
create policy "Users can manage own pricebooks" on pricebooks
  for all using (auth.uid() = user_id);

create policy "Users can manage categories in own pricebooks" on categories
  for all using (pricebook_id in (select id from pricebooks where user_id = auth.uid()));

create policy "Users can manage own parts" on parts
  for all using (auth.uid() = user_id);

-- Indexes for performance
create index idx_pricebooks_user_id on pricebooks(user_id);
create index idx_categories_pricebook_id on categories(pricebook_id);
create index idx_parts_pricebook_id on parts(pricebook_id);
create index idx_parts_category_id on parts(category_id);
create index idx_parts_user_id on parts(user_id);

-- Updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_pricebooks_updated_at before update on pricebooks
  for each row execute function update_updated_at_column();

create trigger update_parts_updated_at before update on parts
  for each row execute function update_updated_at_column();
