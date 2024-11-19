import application from "./app.js";

application().listen(process.env.PORT ?? 3000, () => {
  console.log("running");
});
