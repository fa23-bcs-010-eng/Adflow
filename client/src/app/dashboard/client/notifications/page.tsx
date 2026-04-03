import { redirect } from 'next/navigation';

export default function ClientNotificationsRedirect() {
  redirect('/dashboard/client?tab=notifications');
}
