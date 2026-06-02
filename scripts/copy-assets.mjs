import { cpSync, mkdirSync } from "fs";

mkdirSync("public", { recursive: true });
cpSync("dist/client", "public", { recursive: true, force: true });
console.log("Assets copied to public/");
