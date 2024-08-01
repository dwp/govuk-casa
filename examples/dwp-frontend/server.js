import application from "./app.js";

const port = process.env.PORT || "3000";

application({
  MOUNT_URL: "/",
}).listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
});
