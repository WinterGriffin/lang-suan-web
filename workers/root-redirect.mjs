export default {
  fetch(request) {
    const destination = new URL(request.url);
    destination.protocol = "https:";
    destination.hostname = "app.langsuanapp.com";
    destination.port = "";
    return Response.redirect(destination.toString(), 308);
  },
};
