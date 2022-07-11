import * as fs from "fs"
import MagicString from "magic-string"
import { join } from "pathe"

// Until pkgroll fixes the shebang bug, this needs to be run postbuild

const path = join(process.cwd(), "dist/cli.mjs")
const s = new MagicString(fs.readFileSync(path, "utf8"))
s.prepend("#!/usr/bin/env node\n")
fs.writeFileSync(path, s.toString())



