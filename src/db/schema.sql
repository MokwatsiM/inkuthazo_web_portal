-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist
drop table if exists payouts;
drop table if exists contributions;
drop table if exists members;

-- Create tables with proper foreign key relationships
create table members (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text unique not null,
  phone text not null,
  join_date timestamp with time zone default now(),
  status text check (status in ('active', 'inactive')) default 'active'
);

create table contributions (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid not null references members(id) on delete cascade,
  amount decimal(10,2) not null,
  date timestamp with time zone default now(),
  type text check (type in ('monthly', 'registration', 'other')) not null
);

create table payouts (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid not null references members(id) on delete cascade,
  amount decimal(10,2) not null,
  date timestamp with time zone default now(),
  reason text not null,
  status text check (status in ('pending', 'approved', 'paid')) default 'pending'
);

-- Create indexes for better performance
create index idx_contributions_member_id on contributions(member_id);
create index idx_contributions_date on contributions(date);
create index idx_payouts_member_id on payouts(member_id);
create index idx_payouts_date on payouts(date);

-- Enable RLS
alter table members enable row level security;
alter table contributions enable row level security;
alter table payouts enable row level security;

-- Create RLS policies
create policy "Enable read access for authenticated users"
  on members for select
  using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users"
  on members for insert
  with check (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users"
  on contributions for select
  using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users"
  on contributions for insert
  with check (auth.role() = 'authenticated');

create policy "Enable read access for authenticated users"
  on payouts for select
  using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users"
  on payouts for insert
  with check (auth.role() = 'authenticated');