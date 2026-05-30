import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import PublicShell from './PublicShell';
import { createClient } from '@/utils/supabase/server';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

type SubjectNavItem = {
  id: string;
  name: string;
  color: string | null;
};

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.from('subjects').select('id, name, color').order('created_at', { ascending: false });

  const subjects: SubjectNavItem[] = (error ? [] : data ?? []).map((subject) => ({
    id: subject.id as string,
    name: subject.name as string,
    color: subject.color as string | null,
  }));

  return (
    <div className={`${inter.variable} font-(family-name:--font-inter)`}>
      <PublicShell subjects={subjects}>{children}</PublicShell>
    </div>
  );
}
