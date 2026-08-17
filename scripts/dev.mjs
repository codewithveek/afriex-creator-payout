// Cross-platform launcher for `pnpm dev` at the workspace root.
//
// `pnpm --parallel --filter client --filter server dev` starts both apps fine,
// but on Windows Ctrl-C does not stop them. pnpm runs each workspace script
// through a `cmd.exe /d /s /c` shim, so the process that actually binds the
// port sits three levels below pnpm:
//
//   pnpm --parallel
//     +- cmd.exe /d /s /c next dev   -> node next  -> node worker    (:3000)
//     +- cmd.exe /d /s /c tsx watch  -> node tsx   -> node server.ts (:4000)
//
// Ctrl-C raises CTRL_C_EVENT for the whole console process group. The cmd.exe
// shims take it and exit immediately, orphaning the leaf node processes, which
// keep their ports bound. The next `pnpm dev` then trips over itself: Next
// falls back to port 3001 and refuses to start ("Another next dev server is
// already running"), and the API server dies with EADDRINUSE.
//
// The tidy-looking fix — spawn the children `detached` so the interrupt only
// reaches this launcher — does not work here. On Windows `detached` implies
// DETACHED_PROCESS, and a `cmd.exe` started without a console exits 1 without
// running anything; since pnpm resolves to `pnpm.cmd`, a shell is unavoidable.
//
// So the children stay in the console group, and teardown is made explicit
// instead: on the way out we walk the process tree and kill it outright. That
// works even for already-orphaned leaves because Windows does not reparent
// orphans — a dead parent's pid stays recorded on its children, so the chain
// is still walkable after the shims have gone.

import { spawn, spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'

const TARGETS = [
  { name: 'client', args: ['--filter', 'client', 'dev'] },
  { name: 'server', args: ['--filter', 'server', 'dev'] },
]

/** Live children, keyed by target name. Entries are removed as they exit. */
const children = new Map()
/** Spawned pids, kept even after exit so teardown can still sweep below them. */
const roots = []
let shuttingDown = false
let exitCode = 0

/** Every descendant pid of `roots`, including any whose parent already died. */
function collectDescendants() {
  const listed = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId) $($_.ParentProcessId)" }',
    ],
    { encoding: 'utf8', windowsHide: true },
  )
  if (listed.status !== 0 || !listed.stdout) return []

  const childrenOf = new Map()
  for (const line of listed.stdout.split(/\r?\n/)) {
    const [pid, parent] = line.trim().split(/\s+/).map(Number)
    if (!pid || Number.isNaN(parent)) continue
    if (!childrenOf.has(parent)) childrenOf.set(parent, [])
    childrenOf.get(parent).push(pid)
  }

  const found = new Set()
  const queue = [...roots]
  while (queue.length > 0) {
    const pid = queue.pop()
    for (const child of childrenOf.get(pid) ?? []) {
      // Guard against a cycle from a recycled pid.
      if (found.has(child) || roots.includes(child)) continue
      found.add(child)
      queue.push(child)
    }
  }
  return [...found]
}

function killTree() {
  if (isWindows) {
    // Sweep bottom-up in one call. /F is not optional: the cmd.exe shims and
    // the watchers below them ignore a polite close request.
    const targets = [...collectDescendants(), ...roots]
    if (targets.length === 0) return
    const args = targets.flatMap((pid) => ['/PID', String(pid)])
    spawnSync('taskkill', [...args, '/F'], { stdio: 'ignore', windowsHide: true })
    return
  }
  // POSIX needs none of the above: Ctrl-C is delivered to the whole foreground
  // process group, grandchildren included, so they are already on their way
  // out. This is only a nudge for the non-Ctrl-C paths (SIGTERM, one half
  // exiting on its own).
  for (const child of children.values()) {
    try {
      process.kill(child.pid, 'SIGTERM')
    } catch {
      // Already gone — nothing to signal.
    }
  }
}

function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  exitCode = code

  killTree()

  // Poll rather than unref-ing a timer: an unref'd handle would let node exit
  // on its own with the wrong status the moment the last child is reaped.
  const deadline = Date.now() + 5000
  const timer = setInterval(() => {
    if (children.size === 0 || Date.now() > deadline) {
      clearInterval(timer)
      process.exit(exitCode)
    }
  }, 100)
}

for (const target of TARGETS) {
  const child = spawn('pnpm', target.args, {
    stdio: 'inherit',
    // Windows needs a shell to resolve `pnpm.cmd`.
    //
    // Deliberately not `detached` on either platform: on Windows it prevents
    // cmd.exe starting at all (see the header), and on POSIX it would move the
    // children into a background process group, where reading the inherited
    // stdin raises SIGTTIN and stops them.
    shell: isWindows,
  })

  children.set(target.name, child)
  if (child.pid) roots.push(child.pid)

  child.on('error', (err) => {
    console.error(`[dev] failed to start ${target.name}: ${err.message}`)
    children.delete(target.name)
    shutdown(1)
  })

  child.on('exit', (code, signal) => {
    children.delete(target.name)
    if (shuttingDown) return
    // One half going down on its own leaves a half-broken stack, so stop the
    // other half too rather than leaving it running and unnoticed.
    console.log(`\n[dev] ${target.name} exited (${signal ?? code}) — stopping the other.`)
    shutdown(typeof code === 'number' ? code : 1)
  })
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.on(signal, () => shutdown(0))
}
