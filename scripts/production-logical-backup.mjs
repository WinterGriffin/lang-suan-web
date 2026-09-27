import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const ref = "carrbgyuqqnofczoavyg";
const directory = process.env.LANGSUAN_BACKUP_DIR;
const keyFile = process.env.LANGSUAN_BACKUP_KEY_FILE;
if (!directory || !keyFile) throw new Error("Set LANGSUAN_BACKUP_DIR and LANGSUAN_BACKUP_KEY_FILE.");

const keyScript = "Add-Type -AssemblyName System.Runtime.InteropServices; $s=ConvertTo-SecureString (Get-Content -Raw -LiteralPath $env:LANGSUAN_BACKUP_KEY_FILE) -ErrorAction Stop; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try {[Console]::OpenStandardOutput().Write([Text.Encoding]::UTF8.GetBytes([Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)),0,[Text.Encoding]::UTF8.GetByteCount([Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)))} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}";
function protectedKey() {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", keyScript], { stdio: ["ignore", "pipe", "ignore"] });
    const chunks=[]; child.stdout.on("data", c => chunks.push(c)); child.on("error", reject);
    child.on("close", code => { const key=Buffer.from(Buffer.concat(chunks).toString("utf8").trim(), "base64"); if(code || key.length!==32) reject(new Error("Unable to load protected backup key.")); else resolve(key); });
  });
}
function dump(kind) {
  const args=["exec", "--", "supabase", "db", "dump", "--project-ref", ref];
  if(kind==="roles") args.push("--role-only");
  if(kind==="schema") args.push("--schema", "public", "--schema", "auth", "--schema", "storage", "--schema", "supabase_migrations");
  if(kind==="data") args.push("--data-only", "--use-copy", "--schema", "public", "--schema", "auth", "--schema", "storage", "--schema", "supabase_migrations");
  const command = `npm.cmd ${args.map(value => /^[A-Za-z0-9._:-]+$/.test(value) ? value : `"${value}"`).join(" ")}`;
  return process.platform === "win32"
    ? spawn(process.env.ComSpec, ["/d", "/s", "/c", command], { windowsHide:true, stdio:["ignore","pipe","pipe"], env:process.env })
    : spawn("npm", args, { stdio:["ignore","pipe","ignore"], env:process.env });
}
async function encrypt(kind, key, timestamp) {
  const name=`production-${timestamp}-${kind}.sql.aesgcm`;
  const target=join(directory,name), temporary=`${target}.partial`;
  const iv=randomBytes(12), header=Buffer.concat([Buffer.from("LSBK1"),iv]);
  const child=dump(kind), cipher=createCipheriv("aes-256-gcm",key,iv);
  const out=createWriteStream(temporary,{mode:0o600}); out.write(header);
  let stderr=""; child.stderr.on("data",chunk=>{stderr=(stderr+chunk).slice(-2048)});
  const close=new Promise((resolve,reject)=>{child.on("error",reject);child.on("close",(code,signal)=>code===0&&!signal?resolve():reject(new Error(`${kind} dump failed (exit ${code ?? "none"}, signal ${signal ?? "none"}).`)));});
  const stop=()=>{if(!child.killed) child.kill()}; process.once("SIGINT",stop); process.once("SIGTERM",stop);
  try { await Promise.all([pipeline(child.stdout,cipher,out,{end:false}),close]); out.write(cipher.getAuthTag()); await new Promise((resolve,reject)=>out.end(error=>error?reject(error):resolve())); const bytes=await fs.readFile(temporary); if(bytes.length<=header.length+16) throw new Error(`${kind} encrypted stream is empty.`); const sha256=createHash("sha256").update(bytes).digest("hex"); await fs.rename(temporary,target); return {file:basename(target),bytes:bytes.length,sha256,exitCode:0}; }
  catch(error) { await fs.rm(temporary,{force:true}); throw new Error(`${error.message} Stderr was captured privately and not emitted.`); }
  finally { process.removeListener("SIGINT",stop); process.removeListener("SIGTERM",stop); }
}
const timestamp=new Date().toISOString().replace(/[:.]/g,"-");
await fs.mkdir(directory,{recursive:true,mode:0o700});
const key=await protectedKey();
try { const files=[]; for(const kind of ["roles","schema","data"]) files.push(await encrypt(kind,key,timestamp)); const manifest={projectRef:ref,exportedAtUtc:new Date().toISOString(),encryption:"AES-256-GCM; LSBK1 header with 96-bit nonce and trailing 128-bit tag",files}; await fs.writeFile(join(directory,`production-${timestamp}-manifest.json`),JSON.stringify(manifest,null,2),{mode:0o600}); console.log(JSON.stringify({projectRef:ref,exportedAtUtc:manifest.exportedAtUtc,files})); }
finally { key.fill(0); }
