export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI is not configured yet. Add OPENAI_API_KEY to .env.local.");
  }

  return apiKey;
}

export function getWeeklyResetModel() {
  return process.env.OPENAI_WEEKLY_RESET_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
}

export function getUseWhatWeHaveModel() {
  return process.env.OPENAI_USE_WHAT_WE_HAVE_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
}
