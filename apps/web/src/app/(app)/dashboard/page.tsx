import { redirect } from 'next/navigation';

// /dashboard is folded into /my-home. The new /my-home shows the same
// saved-diagnoses + scanned-systems record whether the user is anonymous
// (localStorage) or signed in (Aurora). Keep this redirect so any old
// bookmarks or post-signup ?next=/dashboard hits land in the right place.
export default function DashboardRedirect() {
  redirect('/my-home');
}
