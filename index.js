
const execSync = require("child_process").execSync;
const _path = require("path");
const isWin = process.platform === "win32";

/*******************************************************************************
 *
 * Private
 */


function cut_last(f) {
    let x = f.split(" ");
    return x.slice(0, x.length - 1).join(" ");
}

function cut_first(f) {
    return f
        .split(" ")
        .slice(1)
        .join(" ");
}

const execute = cmd => {
    try {
        if (process.argv.indexOf("--debug") > -1) {
            console.log(`$ ${cmd}`);
        }
        execSync(cmd, {stdio: "inherit"});
    } catch (e) {
        console.error("\n" + e.message);
        process.exit(1);
    }
};

/**
 * For working with shell commands, `bash` knows how to remove consecutive
 * text from strings when arguments are "falsey", which makes mapping flags to
 * JS expressions a breeze.  Can be used as a template literal.
 *
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * console.assert(
 *     bash`run -t${1} -u"${undefined}" task`,
 *    `run -t1 task`
 * );
 */
const bash = (exports.bash = function bash(strings, ...args) {
    let terms = [];
    if (strings.length === 1) {
        return strings[0];
    }
    for (let i = 0; i < strings.length - 1; i++) {
        const arg = args[i];
        const start = terms.length === 0 ? strings[i] : terms.pop();
        if (arg === undefined || arg !== arg || arg === false) {
            terms = [...terms, cut_last(start), " ", cut_first(strings[i + 1])];
        } else if (Array.isArray(arg)) {
            terms = [...terms, start, arg.join(" "), strings[i + 1]];
        } else {
            terms = [...terms, start, arg, strings[i + 1]];
        }
    }
    return terms
        .join("")
        .replace(/[ \t\n]+/g, " ")
        .trim();
});

/**
 * Just like `bash, but executes the command immediately.  Will log if the
 * `--debug` flag is used to build.
 *
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * execute`run -t${1} -u"${undefined}" task`;
 */
exports.execute = (strings, ...args) => execute(Array.isArray(strings) ? bash(strings, ...args) : strings);

/*******************************************************************************
 *
 * Tests
 */

function run_suite(tests) {
    for (const [actual, expected] of tests) {
        console.assert(actual === expected, `"${actual}" received, expected: "${expected}"`);
    }
}

if (isWin){
    run_suite([
        [resolve`a/b/c`, `${process.cwd()}\\a\\b\\c`],
        [resolve`${__dirname}/../cpp/perspective`, `${process.cwd()}\\cpp\\perspective`],
        [resolve`${__dirname}/../python/perspective/dist`, _path.resolve(__dirname, "..", "python", "perspective", "dist")],
        [resolve`${__dirname}/../cpp/perspective`, _path.resolve(__dirname, "..", "cpp", "perspective")],
        [resolve`${__dirname}/../cmake`, _path.resolve(__dirname, "..", "cmake")],
        [resolve`${resolve`${__dirname}/../python/perspective/dist`}/cmake`, _path.resolve(_path.resolve(__dirname, "..", "python", "perspective", "dist"), "cmake")],
        [resolve`${resolve`${__dirname}/../python/perspective/dist`}/obj`, _path.resolve(_path.resolve(__dirname, "..", "python", "perspective", "dist"), "obj")]
    ]);

} else {
    run_suite([
        [resolve`a/b/c`, `${process.cwd()}/a/b/c`],
        [resolve`${__dirname}/../cpp/perspective`, `${process.cwd()}/cpp/perspective`],
        [resolve`${__dirname}/../python/perspective/dist`, _path.resolve(__dirname, "..", "python", "perspective", "dist")],
        [resolve`${__dirname}/../cpp/perspective`, _path.resolve(__dirname, "..", "cpp", "perspective")],
        [resolve`${__dirname}/../cmake`, _path.resolve(__dirname, "..", "cmake")],
        [resolve`${resolve`${__dirname}/../python/perspective/dist`}/cmake`, _path.resolve(_path.resolve(__dirname, "..", "python", "perspective", "dist"), "cmake")],
        [resolve`${resolve`${__dirname}/../python/perspective/dist`}/obj`, _path.resolve(_path.resolve(__dirname, "..", "python", "perspective", "dist"), "obj")]
    ]);
}

run_suite([
    [bash`run -t${1}`, `run -t1`],
    [bash`run -t${undefined}`, `run`],
    [bash`run -t${true}`, `run -ttrue`],
    [bash`run -t${false}`, `run`],
    [bash`run -t${1} task`, `run -t1 task`],
    [bash`run -t${undefined} task`, `run task`],
    [bash`run -t="${1}"`, `run -t="1"`],
    [bash`run -t="${undefined}"`, `run`],
    [bash`run -t="${1}" task`, `run -t="1" task`],
    [bash`run -t="${undefined}" task`, `run task`],
    [bash`run -t${1} -u${2} task`, `run -t1 -u2 task`],
    [bash`run -t${1} -u${undefined} task`, `run -t1 task`],
    [bash`run -t${undefined} -u${2} task`, `run -u2 task`],
    [bash`run -t${undefined} -u${undefined} task`, `run task`],
    [bash`run -t"${undefined}" -u"${undefined}" task`, `run task`],
    [bash`run "${undefined}" task`, `run task`],
    [bash`run ${undefined} task`, `run task`],
    [bash`TEST=${undefined} run`, `run`],
    [bash`TEST=${1} run`, `TEST=1 run`],
    [bash`TEST=${1}`, `TEST=1`],
    [bash`TEST=${undefined}`, ``],
    [bash`this is a test`, `this is a test`],
    [bash`this is a test `, `this is a test `],
    [bash`--test="${undefined}.0" ${1}`, `1`]
]);
