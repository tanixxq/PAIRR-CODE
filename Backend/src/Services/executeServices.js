import axios from "axios";

const JUDGE0_BASE_URL = "https://ce.judge0.com";
const JUDGE0_LANGUAGES_URL = `${JUDGE0_BASE_URL}/languages`;
const JUDGE0_SUBMIT_URL = `${JUDGE0_BASE_URL}/submissions?wait=true&base64_encoded=false`;

// matched against Judge0's language `name` field, most specific first,
// as regexes anchored to the start of the name so e.g. "c" never
// accidentally matches "C++" or "C#"
const LANGUAGE_PATTERNS = {
    javascript: /^javascript/i,
    typescript: /^typescript/i,
    python: /^python \(3/i,
    java: /^java \(/i,
    cpp: /^c\+\+ \(/i,
    c: /^c \(/i,
    go: /^go \(/i
};

let languageListCache = null;
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getLanguageIdFor(language) {
    const pattern = LANGUAGE_PATTERNS[language];
    if (!pattern) return null;

    const now = Date.now();

    if (!languageListCache || now - cacheFetchedAt > CACHE_TTL_MS) {
        const res = await axios.get(JUDGE0_LANGUAGES_URL);
        languageListCache = res.data;
        cacheFetchedAt = now;
    }

    const candidates = languageListCache.filter((l) => pattern.test(l.name));
    if (candidates.length === 0) return null;

    // prefer a plain numbered build over anything flagged experimental/nightly
    const stable = candidates.find(
        (l) => !/nightly|insider|head|beta/i.test(l.name)
    );

    return (stable || candidates[0]).id;
}

export const executeCode = async ({ language, code, input = "" }) => {
    const languageId = await getLanguageIdFor(language);
    if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
    }

    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await axios.post(JUDGE0_SUBMIT_URL, {
                source_code: code,
                language_id: languageId,
                stdin: input
            });

            const { stdout, stderr, compile_output, message, status } = response.data;

            // status.id === 3 is Judge0's "Accepted" status, meaning the
            // program ran to completion without a compile/runtime/timeout error
            const succeeded = status && status.id === 3;

            return {
                stdout: stdout || "",
                stderr: stderr || compile_output || message || "",
                exitCode: succeeded ? 0 : 1
            };
        } catch (error) {
            lastError = error;
            console.error(
                `JUDGE0 ATTEMPT ${attempt + 1}/${MAX_RETRIES + 1} FAILED —`,
                "status:", error.response?.status,
                "data:", error.response?.data,
                "code:", error.code,
                "message:", error.message
            );
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    throw new Error("Execution service is temporarily unavailable. Please try running again.");
};