import {serve} from "bun";

const image = Bun.file("screenshot.png", {type: "image/png"})
const debugText = Bun.file("debug.log")
serve({
    fetch(req){
        const url = new URL(req.url);
        if(url.pathname === "/"){
            return new Response(image.stream(), {
                headers:{
                    "Content-Type": "image/png",
                    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                }
            })
        }
        if(url.pathname === "/debug"){
            return new Response(debugText.stream(), {
                headers:{
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                }
            })
        }

        return new Response("Not Found", {status: 404})
    }
})
console.log("Server running on http://localhost:3000")
