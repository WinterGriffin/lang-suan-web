const response = await fetch("https://langsuanapp.com/", {
  redirect: "manual",
  signal: AbortSignal.timeout(10000),
});
if (response.status !== 308 || response.headers.get("location") !== "https://app.langsuanapp.com/") {
  throw new Error("Root domain does not redirect to the production Web origin.");
}
console.log("Root domain redirects to the production Web origin.");
