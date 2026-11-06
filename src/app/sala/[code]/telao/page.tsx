import { Suspense } from 'react';
import TelaoClient from './TelaoClient';

async function TelaoContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TelaoClient code={code.toUpperCase()} />;
}

export default function TelaoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-cartoon text-2xl text-black">
          Carregando Telão da Arena...
        </div>
      }
    >
      <TelaoContent params={params} />
    </Suspense>
  );
}
