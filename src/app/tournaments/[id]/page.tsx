import TournamentPlay from "@/features/tournaments/components/TournamentPlay/TournamentPlay";

/** Resolves the route's tournament ID and mounts its interactive play view. */
export default async function TournamentPage({
  params,
}: PageProps<"/tournaments/[id]">) {
  const { id } = await params;
  return <TournamentPlay id={id} />;
}
