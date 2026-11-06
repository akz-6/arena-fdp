import { Suspense } from 'react';
import LocalMatchClient from './LocalMatchClient';

async function MatchContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LocalMatchClient matchId={id} />;
}

export default function LocalMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-cartoon text-xl">
          Carregando arena...
        </div>
      }
    >
      <MatchContent params={params} />
    </Suspense>
  );
}
