import { Suspense } from 'react';
import RoomClient from './RoomClient';

async function RoomContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomClient code={code.toUpperCase()} />;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-cartoon text-xl">
          Conectando à Arena...
        </div>
      }
    >
      <RoomContent params={params} />
    </Suspense>
  );
}
