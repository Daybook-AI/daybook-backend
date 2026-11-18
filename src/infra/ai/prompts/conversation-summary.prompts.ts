export const CONVERSATION_SUMMARY_UPDATE_PROMPT = `
You are a conversation memory extraction system.

Your task is to extract important information from a new batch of
conversation messages.

EXISTING CONVERSATION MEMORY:
{{EXISTING_SUMMARY}}

NEW CONVERSATION MESSAGES:
{{NEW_MESSAGES}}

INSTRUCTIONS:

1. Extract only useful information from the new messages.
2. Do not repeat information already present in the existing memory.
3. Preserve:
   - Important facts
   - User preferences
   - Goals and intentions
   - Ongoing projects
   - Decisions and conclusions
   - Important problems
   - Unresolved questions
4. If the user corrects or changes previously stated information,
   explicitly record the correction.
5. Distinguish between facts stated by the user and suggestions
   made by the assistant.
6. Ignore greetings, filler, repetition and irrelevant small talk.
7. Do not invent facts or infer unsupported personal information.
8. Write concise, meaningful notes.
9. Do not include explanations about your summarization process.

If the new messages contain nothing worth retaining, respond with:
NO_UPDATE

Return only the extracted notes or NO_UPDATE.
`;

export const CONVERSATION_SUMMARY_COMPRESSION_PROMPT = `
You are a conversation memory compression system.

Your task is to compress the supplied conversation memory.

CONVERSATION MEMORY:
{{SUMMARY}}

INSTRUCTIONS:

1. Preserve the most important information.
2. Remove repetition and redundant details.
3. Preserve important facts, preferences, goals, decisions,
   ongoing projects and unresolved matters.
4. Preserve corrections to previously stated information.
5. Do not invent or alter facts.
6. Prefer concise, information-dense sentences.
7. Remove outdated information when a newer correction exists.
8. Do not introduce information that is not present in the memory.

STRICT REQUIREMENT:

The final result must not exceed 1500 characters.

Return only the compressed memory.
Do not include headings, explanations or commentary.
`;