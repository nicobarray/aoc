import * as path from "jsr:@std/path@1";
import * as cli from "jsr:@std/cli@1.0";
import { parse } from "npm:node-html-parser@6.1";
import { convert } from "npm:html-to-text@9.0";

function help() {
  console.log("Usage: aoc cmd [OPTIONS...]");
  console.log("\n Command (cmd):");
  console.log("  login                               Show instruction on how to get the cookie session for subsequent aoc cmd",);
  console.log("  fetch --year=2015 --day=1           Fetch the year/day input file");
  console.log("  subject --year=2015 --day=1         Show the year/day subject");
  console.log("  setup --year=2015 --day=1           Setup the day script");
  console.log("  solve --year=2015 --day=1 --part=1  Run the year/day subject's part (1, 2 or both if not specified)");
  console.log("\n Optional flags:");
  console.log("  -h, --help   Display this help and exit");
}

const cmd = Deno.args[0];
const args = cli.parseArgs(Deno.args, {
  boolean: ["help"],
  alias: { help: "h", day: "d", year: "y", part: "p" },
  string: ["day", "year", "part"],
});

if (args.help) {
  help();
  Deno.exit(1)
}

async function cmdFetch(day: string, year: string) {
  try {
    await Deno.lstat("session.txt");
  } catch (_err) {
    console.error("Run `aoc login` to get a session cookie value");
    Deno.exit(1);
  }

  const url = new URL(`https://adventofcode.com/${year}/day/${day}/input`);
  const response = await fetch(url, {
    headers: {
      Cookie: `session=${await Deno.readTextFile("session.txt")}`,
    },
  });
  const input = await response.text();

  return input;
}

if (cmd === "login") {
  console.log('Follow these steps to get the "session" cookie');
  console.log("Go to https://adventofcode.com");
  console.log("Login to your account if it is not done already");
  console.log("Inspect the page, go to the Network tab");
  console.log('Find the current page "document" request');
  console.log('Copy the "session" cookie in the Cookie request headers');
  console.log('Cookie: "session=xxx;other=yyy;bar=zzz"');
  const session = prompt("Paste session value here:");
  if (session) {
    await Deno.writeTextFile("session.txt", session);
    console.log("Done !");
  } else {
    console.log("Failed to write session.txt. Try again.");
  }
  Deno.exit(0);
}

if (cmd === "fetch") {
  const day = args.day;
  const year = args.year;

  if (!day || !year) {
    help();
    Deno.exit(1)
  }

  const input = await cmdFetch(day, year);

  console.log(input);
  Deno.exit(0);
}

if (cmd === "subject") {
  const day = args.day;
  const year = args.year;

  if (!day || !year) {
    help();
    Deno.exit(1)
  }

  try {
    await Deno.lstat("session.txt");
  } catch (_err) {
    console.error("Run `aoc login` to get a session cookie value");
    Deno.exit(1);
  }

  const url = new URL(`https://adventofcode.com/${year}/day/${day}`);
  const response = await fetch(url, {
    headers: {
      Cookie: `session=${await Deno.readTextFile("session.txt")}`,
    },
  });
  const html = await response.text();
  const document = parse(html);

  const subject = convert(
    document.querySelector("article")?.toString() ??
      "Could not find the subject. Sorry",
  );

  console.log(subject);
  Deno.exit(0);
}

if (cmd === "setup") {
  const day = args.day;
  const year = args.year;

  if (!day || !year) {
    help();
    Deno.exit(1)
  }

  try {
    await Deno.lstat("session.txt");
  } catch (_err) {
    console.error("Run `aoc login` to get a session cookie value");
    Deno.exit(1);
  }

  const dirname = path.join(
    import.meta.dirname ?? (await Deno.realPath(".")),
    "years",
    year,
    "days",
    day,
  );
  await Deno.mkdir(dirname, { recursive: true });

  const input = await cmdFetch(day, year);
  await Deno.writeTextFile(path.join(dirname, "input.txt"), input);

  const template = `import * as path from "jsr:@std/path@1";
  
  const input = await Deno.readTextFile(path.join(import.meta.dirname, "input.txt"))

  // TODO: solve aoc
  export async function step1() {
    for (const line of input.split('\\n')) {
    }

    console.log(1)
  }

  export async function step2() {
    for (const line of input.split('\\n')) {
    }

    console.log(2)
  }

  if (import.meta.main) {
    await step1()
    await step2()
  }
  `;
  await Deno.writeTextFile(path.join(dirname, "main.ts"), template);

  Deno.exit(0);
}

if (cmd === "solve") {
  const day = args.day;
  const year = args.year;

  if (!day || !year) {
    help();
    Deno.exit(1)
  }

  const part = args.part;

  const scriptName = path.join(
    import.meta.dirname ?? (await Deno.realPath(".")),
    "years",
    year,
    "days",
    day,
    "main.ts",
  );

  const { step1, step2 } = await import(scriptName);

  if (!part || part === "1") {
    await step1();
  }
  if (!part || part === "2") {
    await step2();
  }

  Deno.exit(0);
}

help();
Deno.exit(1);