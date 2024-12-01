import * as cli from "jsr:@std/cli@1.0";
import { parse } from 'npm:node-html-parser@6.1'
import { convert } from 'npm:html-to-text@9.0'

function help() {
  console.log('Usage: aoc cmd [OPTIONS...]')
  console.log('\n Command (cmd):')
  console.log('  login      Show instruction on how to get the cookie session for subsequent aoc cmd')
  console.log('  fetch --year=2015 --day=1      Fetch the year/day input file')
  console.log('  subject --year=2015 --day=1      Show the year/day subject') 
  console.log('  setup --year=2015 --day=1      Setup the day script') 
  console.log('\n Optional flags:')
  console.log('  -h, --help   Display this help and exit')

  Deno.exit(1)
}

const cmd = Deno.args[0]
const args = cli.parseArgs(Deno.args, {
  boolean: ['help'],
  alias: { help: 'h' },
  string: ['day', 'year']
})

if (args.help) {
  help()
}

async function cmdFetch(day: number, year: number) {
  try {
    await Deno.lstat("session.txt");
  } catch(err) {
    console.error("Run `aoc login` to get a session cookie value")
    Deno.exit(1)
  }

  const url = new URL(`https://adventofcode.com/${year}/day/${day}/input`)
  const response = await fetch(url, {
    headers: {
      Cookie: `session=${await Deno.readTextFile('session.txt')}`
    }
  })
  const input = await response.text()

  return input
}

if (cmd === 'login') {
  console.log('Follow these steps to get the "session" cookie')
  console.log('Go to https://adventofcode.com')
  console.log('Login to your account if it is not done already')
  console.log('Inspect the page, go to the Network tab')
  console.log('Find the current page "document" request')
  console.log('Copy the "session" cookie in the Cookie request headers')
  console.log('Cookie: "session=xxx;other=yyy;bar=zzz"')
  const session = prompt("Paste session value here:")
  if (session) {
    await Deno.writeTextFile("session.txt", session)
    console.log('Done !')
  } else {
    console.log('Failed to write session.txt. Try again.')
  }
  Deno.exit(0)
}

if (cmd === 'fetch') {

  if (!args.day && !args.year) {
    help()
  }

  const day = parseInt(args.day ?? "1")
  const year = parseInt(args.year ?? "2024")

  const input= await cmdFetch(day, year)

  console.log(input)
  Deno.exit(0)
}

if (cmd === 'subject') {

  if (!args.day && !args.year) {
    help()
  }

  const day = parseInt(args.day ?? "1")
  const year = parseInt(args.year ?? "2024")

  try {
    await Deno.lstat("session.txt");
  } catch(err) {
    console.error("Run `aoc login` to get a session cookie value")
    Deno.exit(1)
  }

  const url = new URL(`https://adventofcode.com/${year}/day/${day}`)
  const response = await fetch(url, {
    headers: {
      Cookie: `session=${await Deno.readTextFile('session.txt')}`
    }
  })
  const html = await response.text()
  const document = parse(html)

  const subject = convert(document.querySelector('article')?.toString() ?? "Could not find the subject. Sorry")

  console.log(subject)
  Deno.exit(0)
}

if (cmd === "setup") {

  if (!args.day && !args.year) {
    help()
  }

  const day = parseInt(args.day ?? "1")
  const year = parseInt(args.year ?? "2024")

  try {
    await Deno.lstat("session.txt");
  } catch(err) {
    console.error("Run `aoc login` to get a session cookie value")
    Deno.exit(1)
  }

  const path = import.meta.dirname + `/years/${year}/days/${day}/`
  await Deno.mkdir(path, { recursive: true })
  const input = await cmdFetch(day, year)
  await Deno.writeTextFile(path + 'input.txt', input)
  await Deno.writeTextFile(path + 'main.ts', await Deno.readTextFile(import.meta.dirname + '/template.txt'))

  Deno.exit(0)
}

help()
