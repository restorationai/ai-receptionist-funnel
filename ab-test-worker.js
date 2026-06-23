export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Only intercept the root domain. Let CSS/JS/images load normally.
    if (url.pathname !== "/") {
      return fetch(request);
    }

    const cookieHeader = request.headers.get("Cookie");
    let variant = null;

    // Check if the user already has a sticky variant assigned
    if (cookieHeader && cookieHeader.includes("ab-test-variant=A")) {
      variant = "A";
    } else if (cookieHeader && cookieHeader.includes("ab-test-variant=B")) {
      variant = "B";
    } else {
      // Flip a coin (50/50 split) for new visitors
      variant = Math.random() < 0.5 ? "A" : "B";
    }

    // Determine which landing page to fetch under the hood
    // Variant A: The original funnel
    // Variant B: The brand new Astro funnel we just built and deployed
    const fetchUrl = variant === "A" 
      ? "https://restorationai.io/" 
      : "https://restorationai-demo.pages.dev/";

    // Fetch the page without changing the user's browser URL search bar
    let response = await fetch(fetchUrl, request);
    
    // Create a mutable copy of the response so we can inject headers
    response = new Response(response.body, response);

    // If they are a new visitor, set the 30-day sticky cookie
    if (!cookieHeader || !cookieHeader.includes(`ab-test-variant=${variant}`)) {
      response.headers.append(
        "Set-Cookie",
        `ab-test-variant=${variant}; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=Lax`
      );
    }

    return response;
  }
};
