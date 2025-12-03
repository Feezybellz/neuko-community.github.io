import { spawn } from "bun";

const PORT = 5173;

async function killPort(port: number) {
    try {
        const proc = spawn(["lsof", "-ti", `:${port}`], {
            stdout: "pipe",
        });
        const output = await new Response(proc.stdout).text();
        const pids = output.trim().split('\n').filter(Boolean);

        if (pids.length > 0) {
            console.log(`Killing processes on port ${port} (PIDs: ${pids.join(', ')})...`);
            spawn(["kill", "-9", ...pids]);
            // Give it a moment to die
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    } catch (e) {
        console.error("Error killing port:", e);
    }
}

async function startDev() {
    await killPort(PORT);

    console.log(`Starting VitePress on port ${PORT}...`);

    // We use "bun x" or just spawn the command. 
    // Since we are running with bun, we can just spawn "vitepress" if it's in the path, 
    // or use "bun run vitepress"

    const proc = spawn(["bun", "run", "vitepress", "dev", "--port", `${PORT}`], {
        stdio: ["inherit", "inherit", "inherit"],
    });

    await proc.exited;
}

startDev();
