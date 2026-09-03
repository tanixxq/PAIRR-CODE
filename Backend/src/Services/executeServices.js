import axios from "axios";

const WANDBOX_LIST_URL = "https://wandbox.org/api/list.json";
const WANDBOX_COMPILE_URL = "https://wandbox.org/api/compile.json";

const LANGUAGE_NAME_MAP = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    go: "Go"
};

let compilerListCache = null;
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function getCompilerFor(wandboxLanguage) {
    const now = Date.now();

    if (!compilerListCache || now - cacheFetchedAt > CACHE_TTL_MS) {
        const res = await axios.get(WANDBOX_LIST_URL);
        compilerListCache = res.data;
        cacheFetchedAt = now;
    }

    const candidates = compilerListCache.filter((c) => c.language === wandboxLanguage);
    if (candidates.length === 0) return null;

    // prefer a stable, numbered build over an experimental "head"/nightly build,
    // which is more likely to have a broken sandbox on Wandbox's side
    const stable = candidates.find((c) => !c.name.includes("head"));
    return (stable || candidates[0]).name;
}

export const executeCode = async ({ language, code }) => {
    const wandboxLanguage = LANGUAGE_NAME_MAP[language];
    if (!wandboxLanguage) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const compiler = await getCompilerFor(wandboxLanguage);
    if (!compiler) {
        throw new Error(`No compiler currently available for ${language}`);
    }

    const response = await axios.post(WANDBOX_COMPILE_URL, {
        code,
        compiler,
        save: false
    });

    const { program_output, program_error, compiler_error, status } = response.data;

    return {
        stdout: program_output || "",
        stderr: program_error || compiler_error || "",
        exitCode: status === "0" ? 0 : 1
    };
};