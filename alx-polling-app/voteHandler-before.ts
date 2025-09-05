// BEFORE version
export async function voteHandler(pollId: string, option: string, userId: string) {
  const { data: existingVote, error: existingError } = await supabase
    .from("votes")
    .select("*")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    return { error: "Could not check existing vote" };
  }

  if (existingVote) {
    return { error: "User has already voted" };
  }

  const { data, error } = await supabase
    .from("votes")
    .insert([{ poll_id: pollId, option, user_id: userId }]);

  if (error) return { error: "Failed to submit vote" };

  return { success: true, data };
}
