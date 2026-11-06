import { notFound } from 'next/navigation';
import DevFxClient from './DevFxClient';

export default function DevFxPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <DevFxClient />;
}
