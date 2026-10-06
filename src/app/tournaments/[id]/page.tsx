import TournamentPlay from "@/features/tournaments/components/TournamentPlay/TournamentPlay";

export default async function TournamentPage({
  params,
}: PageProps<"/tournaments/[id]">) {
  const { id } = await params;
  return <TournamentPlay id={id} />;
}
