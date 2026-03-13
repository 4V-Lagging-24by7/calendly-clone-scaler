import { redirect } from "next/navigation";

export default function NewMeetingPage({
  params,
}: {
  params: { username: string };
}) {
  redirect(`/${params.username}/30-minute-meeting`);
}