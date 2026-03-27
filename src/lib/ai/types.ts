export type UseWhatWeHaveIdea = {
  title: string;
  summary: string;
  uses: string[];
  missing_items: string[];
};

export type UseWhatWeHaveResult = {
  ideas: UseWhatWeHaveIdea[];
};
